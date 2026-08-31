/**
 * Decision service — the three filters of the شیوه‌نامه, end to end.
 *
 *   فیلتر ۱  screening   معیارهای الزامی، ماهیت صفر و یک
 *   فیلتر ۲  weighting + ranking   معیارهای ترجیحی، جریان‌های ترجیح
 *   فیلتر ۳  portfolio   تشکیل سبد تحت محدودیت‌ها
 *
 * The appendix's distinction between ارزیابی, رتبه‌بندی and انتخاب سبد is
 * reflected in the API surface: `evaluate`, `rankProjects` and
 * `optimizePortfolio` are three separate operations, and a high rank never
 * implies portfolio membership.
 */

import * as decisionRepository from "../repositories/decision.repository.js";
import { criteria as allCriteria, dimensions } from "../data/criteria.js";
import projectClasses, {
  findProjectClass,
  nonComparableClasses
} from "../data/project-classes.js";
import policy from "../data/policy.js";
import { dependencyGroups } from "../data/projects.js";
import { inspectProjects } from "../domain/data-quality.js";
import { computeDeprivationIndex, deprivedDistricts, evaluateEquity } from "../domain/equity.js";
import { evaluateContinuation, lifecycleCost } from "../domain/lifecycle.js";
import { round } from "../domain/normalize.js";
import { buildPortfolio } from "../domain/portfolio.js";
import { explainPair, rankByPromethee } from "../domain/promethee.js";
import { screenProjects } from "../domain/screening.js";
import { runAddDropTest, runSensitivityAnalysis } from "../domain/sensitivity.js";
import { expandToCriterionWeights, resolveDimensionWeights } from "../domain/weighting.js";
import HttpError from "../utils/http-error.js";

/**
 * @param {Array} projects
 * @param {string[]} ids
 */
function assertProjectIds(projects, ids) {
  const available = new Set(projects.map(project => String(project.id)));
  const missing = ids.filter(id => !available.has(String(id)));

  if (missing.length > 0) {
    throw new HttpError(
      404,
      "One or more projects were not found.",
      missing.map(id => ({
        field: "projectId",
        message: `Project ${id} was not found.`
      }))
    );
  }
}

/**
 * Load the base dataset every operation starts from.
 *
 * @returns {Promise<Object>}
 */
async function loadContext() {
  const [projects, neighborhoods] = await Promise.all([
    decisionRepository.findProjects(),
    decisionRepository.findNeighborhoods()
  ]);

  const scoredNeighborhoods = computeDeprivationIndex(
    neighborhoods,
    policy.deprivationIndicators
  );
  const districts = deprivedDistricts(
    scoredNeighborhoods,
    policy.equityConstraints.deprivedThreshold
  );

  return {
    projects,
    neighborhoods: scoredNeighborhoods,
    districts,
    deprived: districts.filter(entry => entry.deprived).map(entry => entry.district)
  };
}

/**
 * Split a screened project set by evaluation class.
 *
 * The appendix forbids putting heterogeneous classes in one matrix, so
 * statutory and emergency projects are routed out of the ranking entirely and
 * enter the portfolio on their own track.
 *
 * @param {Array} projects
 * @returns {{ comparable: Array, separateTrack: Array }}
 */
function partitionByClass(projects) {
  const comparable = [];
  const separateTrack = [];

  projects.forEach(project => {
    const key = project.classification?.projectClass;

    if (nonComparableClasses.has(key)) {
      separateTrack.push(project);
    } else {
      comparable.push(project);
    }
  });

  return { comparable, separateTrack };
}

/**
 * Build the candidate pool the portfolio optimiser selects from.
 *
 * Ranking and portfolio selection must draw on the *same* pool, or a
 * sensitivity run silently answers a different question than the baseline it
 * is meant to perturb. Projects on the separate track (statutory, emergency)
 * carry no comparative rank but still consume budget and still satisfy policy
 * minimums, so they belong in the pool with a null rank rather than outside it.
 *
 * @param {Array} projects Screened projects.
 * @param {Object} criterionWeights
 * @returns {{ candidates: Array, comparable: Array, separateTrack: Array, ranking: Array }}
 */
function buildCandidatePool(projects, criterionWeights) {
  const { comparable, separateTrack } = partitionByClass(projects);
  const { ranking } = rankByPromethee({
    projects: comparable,
    criteria: allCriteria,
    criterionWeights
  });

  return {
    comparable,
    separateTrack,
    ranking,
    candidates: [
      ...ranking,
      ...separateTrack.map(project => ({
        ...project,
        netFlow: 0,
        finalScore: null,
        rank: null,
        separateTrack: true
      }))
    ]
  };
}

/**
 * ارزیابی — measure each project's performance on the criteria, with no
 * ordering implied. This is the operation the appendix distinguishes from
 * ranking, and it is what the project دشبورد and quality reports consume.
 *
 * @param {Object} [input]
 * @returns {Promise<Object>}
 */
export async function evaluateProjects(input = {}) {
  const { projects, neighborhoods, districts } = await loadContext();
  const requestedIds = input.projectIds ?? projects.map(project => String(project.id));

  assertProjectIds(projects, requestedIds);

  const requested = new Set(requestedIds.map(String));
  const selected = projects.filter(project => requested.has(String(project.id)));

  const screening = screenProjects(selected);
  const quality = inspectProjects(selected, { criteria: allCriteria });

  const lifecycle = selected.map(project => ({
    projectId: String(project.id),
    projectName: project.name,
    projectClass: project.classification?.projectClass ?? null,
    cost: lifecycleCost(project, policy.planningHorizon),
    continuation:
      project.classification?.projectClass === "inProgress"
        ? evaluateContinuation(project, policy.planningHorizon)
        : null
  }));

  return {
    generatedAt: new Date().toISOString(),
    projectCount: selected.length,
    model: {
      dimensions,
      criteriaCount: allCriteria.length,
      projectClasses,
      decisionUnitsSupported: true,
      planningHorizon: policy.planningHorizon
    },
    screening: {
      passedCount: screening.passed.length,
      rejectedCount: screening.rejected.length,
      report: screening.report
    },
    dataQuality: quality,
    lifecycle,
    equity: { neighborhoods, districts }
  };
}

/**
 * فیلتر ۲ — weight the preferential criteria and rank the projects.
 *
 * @param {Object} [input]
 * @returns {Promise<Object>}
 */
export async function rankProjects(input = {}) {
  const { projects, districts } = await loadContext();
  const requestedIds = input.projectIds ?? projects.map(project => String(project.id));

  assertProjectIds(projects, requestedIds);

  const requested = new Set(requestedIds.map(String));
  const selected = projects.filter(project => requested.has(String(project.id)));

  const screening = screenProjects(selected);
  const { comparable, separateTrack } = partitionByClass(screening.passed);

  const weighting = resolveDimensionWeights(input, dimensions);
  const criterionWeights = expandToCriterionWeights(weighting.weights, allCriteria);

  // One comparison matrix per class: «پروژه‌های کاملاً ناهمگون نباید بدون
  // قواعد تفکیکی در یک ماتریس واحد قرار گیرند».
  const groups = new Map();

  comparable.forEach(project => {
    const key = project.classification?.projectClass ?? "newDevelopment";

    groups.set(key, [...(groups.get(key) ?? []), project]);
  });

  const rankedGroups = [...groups.entries()].map(([classKey, members]) => {
    const result = rankByPromethee({
      projects: members,
      criteria: allCriteria,
      criterionWeights
    });

    return {
      projectClass: classKey,
      projectClassLabel: findProjectClass(classKey)?.label ?? classKey,
      treatment: findProjectClass(classKey)?.treatment ?? null,
      ranking: result.ranking,
      dataQuality: result.dataQuality,
      result
    };
  });

  // A cross-class view is still produced, but it is labelled as indicative and
  // ranks within class are the authoritative figures.
  const combined = rankedGroups
    .flatMap(group =>
      group.ranking.map(project => ({
        ...project,
        projectClass: group.projectClass,
        rankInClass: project.rank
      }))
    )
    .sort(
      (left, right) =>
        right.netFlow - left.netFlow ||
        String(left.id).localeCompare(String(right.id))
    )
    .map((project, index) => ({ ...project, rank: index + 1 }));

  const explanations = rankedGroups.flatMap(group =>
    group.ranking.slice(0, -1).map((project, index) => ({
      projectId: String(project.id),
      outranks: String(group.ranking[index + 1].id),
      drivers: explainPair(
        group.result,
        project.id,
        group.ranking[index + 1].id,
        allCriteria
      )
    }))
  );

  return {
    generatedAt: new Date().toISOString(),
    weighting: {
      source: weighting.source,
      dimensionWeights: weighting.weights,
      criterionWeights,
      consistencyRatio: weighting.consistencyRatio ?? null,
      consistent: weighting.consistent,
      warnings: weighting.warnings
    },
    method: {
      ranking: "PROMETHEE II",
      preferenceFunction: "linear with indifference (q) and preference (p) thresholds",
      note: "رتبه بالاتر یک پروژه الزاماً به معنای عضویت آن در سبد نهایی نیست."
    },
    screening: {
      passedCount: screening.passed.length,
      rejectedCount: screening.rejected.length,
      report: screening.report
    },
    separateTrack: separateTrack.map(project => ({
      id: String(project.id),
      name: project.name,
      projectClass: project.classification?.projectClass,
      reason:
        findProjectClass(project.classification?.projectClass)?.description ??
        "این طبقه از مسیر مستقل وارد سبد می‌شود."
    })),
    groups: rankedGroups.map(({ result, ...group }) => group),
    projectCount: combined.length,
    projects: combined,
    explanations,
    equityContext: { districts }
  };
}

/**
 * فیلتر ۳ — build the portfolio under the full constraint set.
 *
 * @param {Object} input
 * @returns {Promise<Object>}
 */
export async function optimizePortfolio(input) {
  const { projects, neighborhoods, districts, deprived } = await loadContext();

  const include = (input.includeProjectIds ?? []).map(String);
  const exclude = (input.excludeProjectIds ?? []).map(String);

  assertProjectIds(projects, [...include, ...exclude]);

  const screening = screenProjects(projects);
  const rejectedIncludes = include.filter(id =>
    screening.rejected.some(project => String(project.id) === id)
  );

  if (rejectedIncludes.length > 0) {
    throw new HttpError(
      422,
      "Included projects did not pass the mandatory-criteria filter.",
      rejectedIncludes.map(id => ({
        field: "includeProjectIds",
        message: `پروژه ${id} در فیلتر شماره یک رد شده است و نمی‌تواند به سبد اضافه شود.`
      }))
    );
  }

  const weighting = resolveDimensionWeights(input, dimensions);
  const criterionWeights = expandToCriterionWeights(weighting.weights, allCriteria);

  const { candidates } = buildCandidatePool(screening.passed, criterionWeights);

  const context = {
    budget: input.budget,
    financial: input.financial,
    capacity: input.capacity,
    policy: input.policy,
    equity: input.equity,
    objectives: input.objectives,
    horizon: policy.planningHorizon,
    deprivedDistricts: deprived,
    dependencyGroups,
    include,
    exclude
  };

  const portfolio = buildPortfolio({
    candidates,
    context,
    include,
    exclude,
    seed: input.seed ?? 20250831,
    restarts: input.restarts ?? 48
  });

  /**
   * When no selection satisfies every constraint, the honest answer is that
   * the budget cannot buy a compliant portfolio — not a best-effort list that
   * quietly overspends. Bisecting on the cap finds the smallest budget at
   * which the constraint set *is* satisfiable, which is the number the
   * decision maker actually needs («تحلیل تغییر بودجه»).
   */
  const diagnoseInfeasibility = () => {
    const feasibleAt = cap =>
      buildPortfolio({
        candidates,
        context: { ...context, budget: cap },
        include,
        exclude,
        seed: input.seed ?? 20250831,
        restarts: 12
      }).feasible;

    let low = input.budget;
    let high = input.budget;

    // Expand until a feasible cap is found, or give up at 8× the request.
    for (let step = 0; step < 4 && !feasibleAt(high); step += 1) {
      low = high;
      high *= 2;
    }

    if (!feasibleAt(high)) {
      return {
        minimumFeasibleBudget: null,
        message:
          "با محدودیت‌های سیاستی و ظرفیتی جاری، هیچ سبد سازگاری تا هشت برابر بودجه درخواستی یافت نشد؛ محدودیت‌ها باید بازنگری شوند."
      };
    }

    for (let iteration = 0; iteration < 12; iteration += 1) {
      const mid = (low + high) / 2;

      if (feasibleAt(mid)) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return {
      minimumFeasibleBudget: round(high, 2),
      message: `با بودجه درخواستی هیچ سبد سازگاری وجود ندارد؛ کمینه بودجه لازم برای رعایت هم‌زمان همه محدودیت‌ها حدود ${round(high, 0)} است.`
    };
  };

  const infeasibility = portfolio.feasible ? null : diagnoseInfeasibility();

  const usedBudget = portfolio.selected.reduce(
    (sum, project) => sum + (project.budget ?? 0),
    0
  );
  const totalBudget = projects.reduce(
    (sum, project) => sum + (project.budget ?? 0),
    0
  );

  const equity = evaluateEquity(
    portfolio.selected,
    districts,
    { ...policy.equityConstraints, ...input.equity }
  );

  const annualSpend = Object.fromEntries(
    policy.planningHorizon.years.map(year => [
      year,
      round(
        portfolio.selected.reduce((sum, project) => {
          const flow = project.finance?.cashFlow ?? {};

          return sum + (flow[year] ?? flow[String(year)] ?? 0);
        }, 0),
        2
      )
    ])
  );

  const objectiveBreakdown = portfolio.selected.reduce((totals, project) => {
    const breakdown =
      portfolio.objectiveScores.get(String(project.id))?.breakdown ?? {};

    Object.entries(breakdown).forEach(([key, value]) => {
      totals[key] = round((totals[key] ?? 0) + value, 6);
    });

    return totals;
  }, {});

  const average = field =>
    portfolio.selected.length === 0
      ? 0
      : portfolio.selected.reduce(
          (sum, project) => sum + (project[field] ?? 0),
          0
        ) / portfolio.selected.length;

  return {
    generatedAt: new Date().toISOString(),
    budget: input.budget,
    usedBudget: round(usedBudget, 2),
    remainingBudget: round(input.budget - usedBudget, 2),
    utilizationPercent: round((usedBudget / input.budget) * 100, 2),
    portfolioCoveragePercent: round((usedBudget / totalBudget) * 100, 2),
    projectCount: portfolio.selected.length,
    averageScore: round(average("finalScore"), 2),
    averageRisk: round(average("risk"), 2),
    weighting: {
      source: weighting.source,
      dimensionWeights: weighting.weights,
      consistencyRatio: weighting.consistencyRatio ?? null,
      consistent: weighting.consistent,
      warnings: weighting.warnings
    },
    optimization: {
      method: "constrained multi-objective selection (randomised greedy + local search)",
      seed: portfolio.seed,
      objectiveValue: portfolio.objectiveValue,
      objectiveBreakdown,
      feasible: portfolio.feasible,
      violations: portfolio.violations,
      forcedProjects: portfolio.forced,
      infeasibility,
      note: "ترکیب چند پروژه با رتبه پایین‌تر می‌تواند ارزش یا پوشش عادلانه‌تری از انتخاب صرفِ رتبه‌های بالا ایجاد کند."
    },
    /**
     * `proposed` means the selection satisfies every constraint and can go
     * forward as a portfolio. `infeasible` means it does not, and the listed
     * projects are the least-violating combination — a diagnostic, not a
     * recommendation. Callers must not present the two the same way.
     */
    status: portfolio.feasible ? "proposed" : "infeasible",
    annualSpend,
    annualCaps: { ...policy.financialConstraints.annualCaps, ...input.financial?.annualCaps },
    futureCommitments: round(
      portfolio.selected.reduce(
        (sum, project) => sum + (project.finance?.futureCommitments ?? 0),
        0
      ),
      2
    ),
    equity,
    screening: {
      passedCount: screening.passed.length,
      rejectedCount: screening.rejected.length,
      report: screening.report
    },
    projects: portfolio.selected,
    rejected: portfolio.rejected.map(project => ({
      id: String(project.id),
      name: project.name,
      rank: project.rank,
      budget: project.budget,
      reason: "در ترکیب بهینه تحت محدودیت‌های جاری قرار نگرفت."
    })),
    neighborhoods
  };
}

/**
 * اعتبارسنجی، حساسیت و شاخص پایداری.
 *
 * @param {Object} input
 * @returns {Promise<Object>}
 */
export async function analyzeSensitivity(input) {
  const { projects, districts, deprived } = await loadContext();

  const screening = screenProjects(projects);

  const weighting = resolveDimensionWeights(input, dimensions);
  const criterionWeights = expandToCriterionWeights(weighting.weights, allCriteria);

  const { candidates, comparable, separateTrack } = buildCandidatePool(
    screening.passed,
    criterionWeights
  );

  const context = {
    budget: input.budget,
    financial: input.financial,
    capacity: input.capacity,
    policy: input.policy,
    equity: input.equity,
    horizon: policy.planningHorizon,
    deprivedDistricts: deprived,
    dependencyGroups,
    include: (input.includeProjectIds ?? []).map(String),
    exclude: (input.excludeProjectIds ?? []).map(String)
  };

  const baseline = buildPortfolio({
    candidates,
    context,
    include: context.include,
    exclude: context.exclude,
    seed: input.seed ?? 20250831,
    restarts: 24
  });

  const sensitivity = runSensitivityAnalysis({
    projects: comparable,
    separateTrack,
    criteria: allCriteria,
    baselineDimensionWeights: weighting.weights,
    context,
    baseline,
    scenarios: input.scenarios ?? 40,
    seed: input.seed ?? 20250831
  });

  const addDrop = runAddDropTest({
    projects: comparable,
    criteria: allCriteria,
    criterionWeights
  });

  // «علت اصلی حذف یا انتخاب» — attribute each project's fate to the binding
  // rule rather than leaving the stakeholder to guess.
  const baselineIds = new Set(
    baseline.selected.map(project => String(project.id))
  );

  const reasons = sensitivity.projects.map(entry => {
    const inPortfolio = baselineIds.has(entry.projectId);

    let reason;

    if (inPortfolio) {
      reason =
        entry.selectionRatePercent >= 80
          ? "انتخاب پایدار: در اکثریت قاطع سناریوها وارد سبد می‌شود."
          : "انتخاب مشروط: عضویت آن به وزن‌ها یا سقف بودجه حساس است.";
    } else if (entry.minimumEntryBudget === null) {
      reason = "با هیچ سقف بودجه‌ای در محدوده آزمون وارد سبد نشد؛ محدودیت غیرمالی مانع ورود است.";
    } else if (entry.minimumEntryBudget > (input.budget ?? 0)) {
      reason = `برای ورود به سبد حداقل بودجه ${entry.minimumEntryBudget} لازم است.`;
    } else {
      reason = "در ترکیب بهینه جای خود را به پروژه‌ای با ارزش ترکیبی بالاتر داد.";
    }

    return { projectId: entry.projectId, inPortfolio, reason };
  });

  return {
    generatedAt: new Date().toISOString(),
    baseline: {
      projectIds: [...baselineIds],
      objectiveValue: baseline.objectiveValue,
      feasible: baseline.feasible,
      violations: baseline.violations
    },
    weighting: {
      source: weighting.source,
      dimensionWeights: weighting.weights,
      consistencyRatio: weighting.consistencyRatio ?? null
    },
    sensitivity,
    rankReversalTest: addDrop,
    selectionReasons: reasons,
    equityContext: { districts }
  };
}

/**
 * Retrieve predefined decision scenarios.
 *
 * @returns {Promise<Array>}
 */
export async function getScenarios() {
  return decisionRepository.findScenarios();
}
