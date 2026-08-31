/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * PORTFOLIO OPTIMISATION ENGINE [موتور بهینه‌سازی].
 *
 * Appendix 2 of the directive draws a line that a simple implementation misses:
 *
 *   "A higher rank does not necessarily mean membership in the final
 *    portfolio, because a combination of several lower-ranked projects may
 *    deliver more value, fairer coverage, or better deliverability."
 *
 * So portfolio selection is a COMBINATORIAL problem over a multi-objective
 * value function — not a greedy walk down the ranking. This module models it as
 * a constrained knapsack and solves it with a randomised-greedy construction
 * plus local search. That scheme is:
 *   - deterministic for a given seed (so results are reproducible),
 *   - fast enough for interactive scenario analysis, and
 *   - able to DROP a high-ranking project when a cheaper combination scores
 *     better under the constraints, which a greedy pass structurally cannot do.
 *
 * Constraint families implemented, all from the appendix:
 *   financial · project dependencies · regional equity · delivery capacity ·
 *   policy rules.
 *
 * IF RESULTS LOOK WRONG: check `findViolations` first. An "odd" portfolio is
 * usually a constraint doing its job, and every violation carries a message
 * saying which rule fired and by how much.
 */

import {
  capacityConstraints as defaultCapacity,
  financialConstraints as defaultFinancial,
  objectives as defaultObjectives,
  planningHorizon as defaultHorizon,
  policyConstraints as defaultPolicy,
  equityConstraints as defaultEquity
} from "../data/policy.js";
import { lifecycleCost } from "./lifecycle.js";
import { minMaxNormalize, round } from "./normalize.js";

/**
 * A small, explicit PRNG. Portfolio search needs randomisation to escape the
 * greedy optimum, but a decision-support system must be able to reproduce the
 * exact portfolio it recommended — so the seed is an input and the generator
 * is ours, not `Math.random`.
 *
 * @param {number} seed
 * @returns {() => number}
 */
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x2f6e2b1;

  return () => {
    // xorshift32
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;

    return state / 0x100000000;
  };
}

/**
 * Score every project against the formal decision objectives, producing one
 * 0..1 value per project that the optimiser maximises the sum of.
 *
 * @param {Array} projects Ranked projects (carrying `netFlow`).
 * @param {Object} context
 * @returns {Map<string, { value: number, breakdown: Object }>}
 */
export function scoreObjectives(projects, context = {}) {
  const objectives = context.objectives ?? defaultObjectives;
  const deprived = new Set(context.deprivedDistricts ?? []);
  const horizon = context.horizon ?? defaultHorizon;

  const raw = {
    strategicValue: projects.map(project => project.netFlow ?? 0),
    beneficiaries: projects.map(project => project.beneficiaries ?? 0),
    equityGap: projects.map(project =>
      deprived.has(project.district) ? (project.beneficiaries ?? 0) : 0
    ),
    safetyRisk: projects.map(
      project => project.criterionScores?.S3 ?? project.scores?.social ?? 0
    ),
    lifecycleCost: projects.map(project => lifecycleCost(project, horizon).total),
    completionSpeed: projects.map(
      project => project.lifecycle?.physicalProgressPercent ?? 0
    )
  };

  const normalized = Object.fromEntries(
    Object.entries(raw).map(([key, values]) => [key, minMaxNormalize(values)])
  );

  const weightTotal = objectives.reduce(
    (sum, objective) => sum + objective.weight,
    0
  );

  return new Map(
    projects.map((project, index) => {
      const breakdown = {};
      let value = 0;

      objectives.forEach(objective => {
        const series = normalized[objective.key];

        if (!series) {
          return;
        }

        const oriented = objective.direction === "minimize"
          ? 1 - series[index]
          : series[index];
        const contribution = (objective.weight / weightTotal) * oriented;

        breakdown[objective.key] = round(contribution, 6);
        value += contribution;
      });

      return [String(project.id), { value, breakdown }];
    })
  );
}

/**
 * Check a candidate selection against every constraint family.
 *
 * Returns the list of violations rather than a boolean, so the caller can
 * report WHICH rule blocked a portfolio — that is what the report needs in
 * order to state a reason for each project's inclusion or exclusion.
 *
 * @param {Array} selection
 * @param {Object} context
 * @returns {Array<{ family: string, rule: string, message: string }>}
 */
export function findViolations(selection, context = {}) {
  const financial = { ...defaultFinancial, ...context.financial };
  const capacity = { ...defaultCapacity, ...context.capacity };
  const policy = { ...defaultPolicy, ...context.policy };
  const equity = { ...defaultEquity, ...context.equity };
  const horizon = context.horizon ?? defaultHorizon;
  const deprived = new Set(context.deprivedDistricts ?? []);

  const violations = [];
  const totalBudget = selection.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const budgetCap = context.budget ?? financial.totalBudget;

  /**
   * Record a violation.
   *
   * `magnitude` is how badly the rule is broken, as a fraction of the limit —
   * 0.2 means "20% over the cap". It matters because a flat per-violation
   * penalty makes an already-broken constraint free to break further: once a
   * portfolio is over budget by any amount, adding another project costs
   * nothing and gains value, so the search happily runs away from feasibility.
   * Scaling the penalty by magnitude keeps the pressure on.
   */
  const push = (family, rule, message, magnitude = 0) =>
    violations.push({
      family,
      rule,
      message,
      magnitude: round(Math.max(0, magnitude), 4)
    });

  /**
   * Magnitude of an "actual exceeds limit" breach.
   *
   * @param {number} actual
   * @param {number} limit
   * @returns {number}
   */
  const over = (actual, limit) =>
    limit > 0 ? (actual - limit) / limit : actual > 0 ? 1 : 0;

  /**
   * Magnitude of an "actual falls short of a required minimum" breach.
   *
   * @param {number} actual
   * @param {number} required
   * @returns {number}
   */
  const under = (actual, required) =>
    required > 0 ? (required - actual) / required : 0;

  // ── FINANCIAL CONSTRAINTS ────────────────────────────────────────────
  if (totalBudget > budgetCap) {
    push(
      "financial",
      "totalBudget",
      `سقف بودجه کل (${budgetCap}) نقض شده است.`,
      over(totalBudget, budgetCap)
    );
  }

  horizon.years.forEach(year => {
    const cap = financial.annualCaps?.[year] ?? financial.annualCaps?.[String(year)];

    if (!Number.isFinite(cap)) {
      return;
    }

    const spend = selection.reduce((sum, project) => {
      const flow = project.finance?.cashFlow ?? {};

      return sum + (flow[year] ?? flow[String(year)] ?? 0);
    }, 0);

    if (spend > cap) {
      push(
        "financial",
        `annualCap:${year}`,
        `بودجه سال ${year} (${cap}) نقض شده است.`,
        over(spend, cap)
      );
    }
  });

  Object.entries(financial.districtCaps ?? {}).forEach(([district, cap]) => {
    const spend = selection
      .filter(project => project.district === district)
      .reduce((sum, project) => sum + (project.budget ?? 0), 0);

    if (spend > cap) {
      push(
        "financial",
        `districtCap:${district}`,
        `سقف بودجه ${district} (${cap}) نقض شده است.`,
        over(spend, cap)
      );
    }
  });

  const futureCommitments = selection.reduce(
    (sum, project) => sum + (project.finance?.futureCommitments ?? 0),
    0
  );

  if (futureCommitments > financial.futureCommitmentCap) {
    push(
      "financial",
      "futureCommitmentCap",
      `سقف تعهدات آتی (${financial.futureCommitmentCap}) نقض شده است؛ سبد در سال نخست قابل تأمین است اما برای سال‌های بعد تعهد غیرقابل پوشش ایجاد می‌کند.`,
      over(futureCommitments, financial.futureCommitmentCap)
    );
  }

  // Ring-fenced funds. An earmarked fund is a PARTIAL source: a project draws
  // a stated amount from it and funds the rest elsewhere, so the cap applies to
  // the sum of draws, not to the budgets of the projects touching the fund.
  // Only eligible categories may draw on it at all — that is what makes the
  // fund non-transferable.
  (financial.earmarkedFunds ?? []).forEach(fund => {
    const drawing = selection.filter(
      project => project.finance?.earmarkedFund?.key === fund.key
    );
    const drawn = drawing.reduce(
      (sum, project) => sum + (project.finance?.earmarkedFund?.draw ?? 0),
      0
    );

    if (drawn > fund.amount) {
      push(
        "financial",
        `earmarked:${fund.key}`,
        `سقف ${fund.label} (${fund.amount}) نقض شده است.`,
        over(drawn, fund.amount)
      );
    }

    const ineligible = drawing.filter(
      project => !fund.eligibleCategories.includes(project.category)
    );

    if (ineligible.length > 0) {
      push(
        "financial",
        `earmarkedEligibility:${fund.key}`,
        `پروژه‌های ${ineligible.map(p => p.id).join("، ")} واجد شرایط ${fund.label} نیستند.`,
        1
      );
    }
  });

  if (totalBudget > 0) {
    const externalShare =
      selection.reduce(
        (sum, project) =>
          sum +
          ((project.budget ?? 0) * (project.finance?.externalSharePercent ?? 0)) / 100,
        0
      ) / totalBudget * 100;

    if (externalShare < (financial.fundingMix?.minExternalSharePercent ?? 0)) {
      push(
        "financial",
        "fundingMix",
        `سهم منابع خارجی (${round(externalShare, 1)}٪) از حداقل ${financial.fundingMix.minExternalSharePercent}٪ کمتر است.`,
        under(externalShare, financial.fundingMix.minExternalSharePercent)
      );
    }
  }

  Object.entries(financial.domainShares ?? {}).forEach(([domain, bounds]) => {
    if (totalBudget === 0) {
      return;
    }

    const share =
      (selection
        .filter(project => project.classification?.missionDomain === domain)
        .reduce((sum, project) => sum + (project.budget ?? 0), 0) /
        totalBudget) *
      100;

    if (Number.isFinite(bounds.min) && share < bounds.min) {
      push(
        "financial",
        `domainMin:${domain}`,
        `حداقل سهم حوزه ${domain} (${bounds.min}٪) رعایت نشده است.`,
        under(share, bounds.min)
      );
    }

    if (Number.isFinite(bounds.max) && share > bounds.max) {
      push(
        "financial",
        `domainMax:${domain}`,
        `حداکثر سهم حوزه ${domain} (${bounds.max}٪) نقض شده است.`,
        over(share, bounds.max)
      );
    }
  });

  // ── PROJECT DEPENDENCIES ─────────────────────────────────────────────
  const selectedIds = new Set(selection.map(project => String(project.id)));

  selection.forEach(project => {
    (project.dependencies?.requires ?? []).forEach(requiredId => {
      if (!selectedIds.has(String(requiredId))) {
        push(
          "dependency",
          `requires:${project.id}`,
          `اجرای ${project.id} مستلزم انتخاب ${requiredId} است.`,
          1
        );
      }
    });

    (project.dependencies?.conflictsWith ?? []).forEach(conflictId => {
      if (selectedIds.has(String(conflictId))) {
        push(
          "dependency",
          `conflict:${project.id}`,
          `${project.id} و ${conflictId} ناسازگار یا رقیب یکدیگرند.`,
          1
        );
      }
    });
  });

  (context.dependencyGroups ?? []).forEach(group => {
    if (group.rule !== "atLeastOne") {
      return;
    }

    const chosen = group.members.filter(id => selectedIds.has(String(id)));

    if (chosen.length === 0) {
      push(
        "dependency",
        `atLeastOne:${group.key}`,
        `حداقل یکی از پروژه‌های گروه «${group.label}» باید انتخاب شود.`,
        1
      );
    }
  });

  // ── REGIONAL EQUITY ──────────────────────────────────────────────────
  if (totalBudget > 0 && deprived.size > 0) {
    const share =
      (selection
        .filter(project => deprived.has(project.district))
        .reduce((sum, project) => sum + (project.budget ?? 0), 0) /
        totalBudget) *
      100;

    if (share < equity.minDeprivedSharePercent) {
      push(
        "equity",
        "minDeprivedShare",
        `سهم مناطق هدف (${round(share, 1)}٪) از حداقل ${equity.minDeprivedSharePercent}٪ کمتر است.`,
        under(share, equity.minDeprivedSharePercent)
      );
    }
  }

  // ── DELIVERY CAPACITY ────────────────────────────────────────────────
  if (selection.length > capacity.maxConcurrentProjects) {
    push(
      "capacity",
      "maxConcurrentProjects",
      `ظرفیت هم‌زمان اجرای پروژه‌ها (${capacity.maxConcurrentProjects}) نقض شده است.`,
      over(selection.length, capacity.maxConcurrentProjects)
    );
  }

  if (selection.length > capacity.supervisionCapacity) {
    push(
      "capacity",
      "supervisionCapacity",
      `ظرفیت نظارت شهرداری (${capacity.supervisionCapacity}) نقض شده است.`,
      over(selection.length, capacity.supervisionCapacity)
    );
  }

  if (selection.length > capacity.contractorCapacity) {
    push(
      "capacity",
      "contractorCapacity",
      `ظرفیت پیمانکاران (${capacity.contractorCapacity}) نقض شده است.`,
      over(selection.length, capacity.contractorCapacity)
    );
  }

  const pendingLand = selection.filter(
    project => project.readiness?.landAcquisitionComplete === false
  ).length;

  if (pendingLand > capacity.maxProjectsPendingLandAcquisition) {
    push(
      "capacity",
      "landAcquisition",
      `تعداد پروژه‌های دارای محدودیت تملک زمین (${pendingLand}) از سقف ${capacity.maxProjectsPendingLandAcquisition} بیشتر است.`,
      over(pendingLand, capacity.maxProjectsPendingLandAcquisition)
    );
  }

  const pendingPermits = selection.filter(
    project => project.readiness?.permitsReady === false
  ).length;

  if (pendingPermits > capacity.maxProjectsPendingPermits) {
    push(
      "capacity",
      "permits",
      `تعداد پروژه‌های فاقد آمادگی اسناد و مجوزها (${pendingPermits}) از سقف ${capacity.maxProjectsPendingPermits} بیشتر است.`,
      over(pendingPermits, capacity.maxProjectsPendingPermits)
    );
  }

  // ── POLICY CONSTRAINTS ───────────────────────────────────────────────
  if (totalBudget > 0) {
    const shareOf = predicate =>
      (selection.filter(predicate).reduce((sum, p) => sum + (p.budget ?? 0), 0) /
        totalBudget) *
      100;

    const safetyShare = shareOf(
      project =>
        project.classification?.missionDomain === "safety" ||
        project.category === "ایمنی"
    );

    if (safetyShare < policy.minSafetySharePercent) {
      push(
        "policy",
        "minSafetyShare",
        `حداقل سهم پروژه‌های ایمنی (${policy.minSafetySharePercent}٪) رعایت نشده است.`,
        under(safetyShare, policy.minSafetySharePercent)
      );
    }

    const transitShare = shareOf(project => project.category === "حمل‌ونقل");

    if (transitShare < policy.minPublicTransportSharePercent) {
      push(
        "policy",
        "minPublicTransportShare",
        `حداقل سهم حمل‌ونقل عمومی (${policy.minPublicTransportSharePercent}٪) رعایت نشده است.`,
        under(transitShare, policy.minPublicTransportSharePercent)
      );
    }

    const lowImpactShare = shareOf(
      project => project.classification?.lowImpact === true
    );

    if (lowImpactShare > policy.maxLowImpactSharePercent) {
      push(
        "policy",
        "maxLowImpactShare",
        `سقف بودجه پروژه‌های کم‌اثر (${policy.maxLowImpactSharePercent}٪) نقض شده است.`,
        over(lowImpactShare, policy.maxLowImpactSharePercent)
      );
    }
  }

  const neighborhoodProjects = selection.filter(
    project => project.classification?.neighborhoodScale === true
  ).length;

  if (neighborhoodProjects < policy.minNeighborhoodProjects) {
    push(
      "policy",
      "minNeighborhoodProjects",
      `حداقل تعداد پروژه‌های محله‌محور (${policy.minNeighborhoodProjects}) رعایت نشده است.`,
      under(neighborhoodProjects, policy.minNeighborhoodProjects)
    );
  }

  const withoutPlan = selection.filter(
    project => project.readiness?.hasExecutivePlan === false
  ).length;

  if (withoutPlan > policy.maxProjectsWithoutExecutivePlan) {
    push(
      "policy",
      "maxProjectsWithoutExecutivePlan",
      `سقف پروژه‌های فاقد طرح اجرایی (${policy.maxProjectsWithoutExecutivePlan}) نقض شده است.`,
      over(withoutPlan, policy.maxProjectsWithoutExecutivePlan)
    );
  }

  return violations;
}

/**
 * Projects the policy forces into the portfolio regardless of their rank:
 * statutory and emergency classes, and half-finished projects whose physical
 * progress clears the mandatory-completion threshold in `policy.js`.
 *
 * @param {Array} projects
 * @param {Object} [policy]
 * @returns {Array}
 */
export function findForcedProjects(projects, policy = defaultPolicy) {
  return projects.filter(project => {
    const projectClass = project.classification?.projectClass;

    if (projectClass === "statutory" || projectClass === "emergency") {
      return true;
    }

    return (
      projectClass === "inProgress" &&
      (project.lifecycle?.physicalProgressPercent ?? 0) >=
        policy.mandatoryCompletionProgressThreshold
    );
  });
}

/**
 * Total value of a selection under the objective function, with a penalty for
 * each unmet constraint. Infeasible selections are kept in the search space
 * with a heavy penalty rather than discarded, because a portfolio one small
 * swap away from feasible is a useful neighbour.
 *
 * @param {Array} selection
 * @param {Map} objectiveScores
 * @param {Object} context
 * @returns {{ value: number, penalty: number, violations: Array, feasible: boolean }}
 */
export function evaluateSelection(selection, objectiveScores, context) {
  const violations = findViolations(selection, context);
  const value = selection.reduce(
    (sum, project) => sum + (objectiveScores.get(String(project.id))?.value ?? 0),
    0
  );

  // A fixed cost for breaking a rule at all, plus a term proportional to how
  // badly it is broken. Without the second term, an over-budget portfolio can
  // keep adding projects for free; without the first, a hair's-breadth
  // violation would be indistinguishable from feasibility.
  const base = context.penaltyWeight ?? 5;
  const penalty = violations.reduce(
    (sum, violation) => sum + base * (1 + (violation.magnitude ?? 0) * 4),
    0
  );

  return {
    value: round(value, 6),
    penalty,
    violations,
    feasible: violations.length === 0
  };
}

/**
 * Build the portfolio.
 *
 * @param {Object} options
 * @param {Array}  options.candidates Ranked, screened projects.
 * @param {Object} options.context Constraint context.
 * @param {string[]} [options.include] Projects the analyst pins in.
 * @param {string[]} [options.exclude] Projects the analyst rules out.
 * @param {number} [options.seed]
 * @param {number} [options.restarts]
 * @returns {Object}
 */
export function buildPortfolio({
  candidates,
  context,
  include = [],
  exclude = [],
  seed = 20250831,
  restarts = 48
}) {
  const excluded = new Set(exclude.map(String));
  const pool = candidates.filter(project => !excluded.has(String(project.id)));
  const byId = new Map(pool.map(project => [String(project.id), project]));

  const objectiveScores = scoreObjectives(pool, context);

  const forced = new Map(
    [
      ...findForcedProjects(pool, { ...defaultPolicy, ...context.policy }),
      ...include.map(id => byId.get(String(id))).filter(Boolean)
    ].map(project => [String(project.id), project])
  );

  const optional = pool.filter(project => !forced.has(String(project.id)));
  const random = createRandom(seed);

  /**
   * One randomised greedy construction pass followed by a local search that
   * tries every single add, drop and swap until no move improves the score.
   */
  const runOnce = greediness => {
    const selection = [...forced.values()];
    const remaining = [...optional].sort(
      (left, right) =>
        (objectiveScores.get(String(right.id))?.value ?? 0) /
          Math.max(1, right.budget ?? 1) -
        (objectiveScores.get(String(left.id))?.value ?? 0) /
          Math.max(1, left.budget ?? 1)
    );

    // Construction: pick from the top `window` candidates by value density.
    while (remaining.length > 0) {
      const window = Math.max(
        1,
        Math.round(remaining.length * (1 - greediness))
      );
      const pick = Math.floor(random() * Math.min(window, remaining.length));
      const [candidate] = remaining.splice(pick, 1);
      const trial = [...selection, candidate];

      if (evaluateSelection(trial, objectiveScores, context).penalty <=
          evaluateSelection(selection, objectiveScores, context).penalty) {
        selection.push(candidate);
      }
    }

    let current = selection;
    let currentScore = evaluateSelection(current, objectiveScores, context);
    let improved = true;

    while (improved) {
      improved = false;

      const currentIds = new Set(current.map(project => String(project.id)));

      // Drops — never a forced project.
      for (const project of current) {
        if (forced.has(String(project.id))) {
          continue;
        }

        const trial = current.filter(
          other => String(other.id) !== String(project.id)
        );
        const score = evaluateSelection(trial, objectiveScores, context);

        if (score.value - score.penalty > currentScore.value - currentScore.penalty) {
          current = trial;
          currentScore = score;
          improved = true;
          break;
        }
      }

      if (improved) {
        continue;
      }

      // Adds.
      for (const project of optional) {
        if (currentIds.has(String(project.id))) {
          continue;
        }

        const trial = [...current, project];
        const score = evaluateSelection(trial, objectiveScores, context);

        if (score.value - score.penalty > currentScore.value - currentScore.penalty) {
          current = trial;
          currentScore = score;
          improved = true;
          break;
        }
      }

      if (improved) {
        continue;
      }

      // Swaps — the move that lets a cheaper pair displace a higher-ranked
      // project, which is the whole point of the appendix's warning.
      outer: for (const inside of current) {
        if (forced.has(String(inside.id))) {
          continue;
        }

        for (const outside of optional) {
          if (currentIds.has(String(outside.id))) {
            continue;
          }

          const trial = current
            .filter(other => String(other.id) !== String(inside.id))
            .concat(outside);
          const score = evaluateSelection(trial, objectiveScores, context);

          if (score.value - score.penalty > currentScore.value - currentScore.penalty) {
            current = trial;
            currentScore = score;
            improved = true;
            break outer;
          }
        }
      }
    }

    return { selection: current, score: currentScore };
  };

  let best = null;

  for (let attempt = 0; attempt < restarts; attempt += 1) {
    // The first pass is fully greedy; later passes progressively randomise.
    const greediness = attempt === 0 ? 1 : 0.35 + random() * 0.6;
    const result = runOnce(greediness);
    const objective = result.score.value - result.score.penalty;

    if (
      best === null ||
      objective > best.score.value - best.score.penalty ||
      (objective === best.score.value - best.score.penalty &&
        result.selection.length < best.selection.length)
    ) {
      best = result;
    }
  }

  const selectedIds = new Set(best.selection.map(project => String(project.id)));

  return {
    selected: best.selection
      .slice()
      .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0)),
    rejected: pool.filter(project => !selectedIds.has(String(project.id))),
    excluded: [...excluded],
    forced: [...forced.keys()],
    objectiveValue: best.score.value,
    penalty: best.score.penalty,
    feasible: best.score.feasible,
    violations: best.score.violations,
    objectiveScores,
    seed
  };
}
