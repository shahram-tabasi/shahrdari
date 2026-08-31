/**
 * تحلیل حساسیت و پایداری.
 *
 * پیوست شماره دو asks for a specific list of validations — weight sensitivity,
 * threshold sensitivity, add/drop testing, rank reversal, budget change and
 * portfolio-membership stability — and a specific list of per-project outputs:
 *
 *   درصد سناریوهای انتخاب · حداقل بودجه لازم برای ورود · حساسیت به افزایش هزینه
 *   · حساسیت به تغییر وزن‌ها · حساسیت به آستانه‌های ترجیح · پروژه جایگزین ·
 *   علت اصلی حذف یا انتخاب.
 *
 * Each of those is produced here. The scenario sweep is seeded, so a report
 * that quotes "این پروژه در ۸۷٪ سناریوها انتخاب شد" can be regenerated and
 * checked rather than taken on trust.
 */

import { createRandom, buildPortfolio } from "./portfolio.js";
import { expandToCriterionWeights } from "./weighting.js";
import { rankByPromethee } from "./promethee.js";
import { round } from "./normalize.js";

/**
 * Perturb a weight vector by up to ±`magnitude` (relative), then renormalise.
 *
 * @param {Object} weights
 * @param {() => number} random
 * @param {number} magnitude
 * @returns {Object}
 */
function perturbWeights(weights, random, magnitude) {
  const perturbed = Object.fromEntries(
    Object.entries(weights).map(([key, weight]) => [
      key,
      Math.max(0.0001, weight * (1 + (random() * 2 - 1) * magnitude))
    ])
  );
  const total = Object.values(perturbed).reduce((sum, value) => sum + value, 0);

  return Object.fromEntries(
    Object.entries(perturbed).map(([key, weight]) => [
      key,
      (weight / total) * 100
    ])
  );
}

/**
 * Run the full scenario sweep.
 *
 * Every scenario re-runs the *whole* pipeline — re-weight, re-rank, re-optimise
 * — because a sensitivity analysis that perturbs the weights but reuses the
 * baseline ranking measures nothing.
 *
 * @param {Object} options
 * @param {Array}  options.projects Screened, comparable projects.
 * @param {Array}  options.criteria
 * @param {Object} options.baselineDimensionWeights
 * @param {Object} options.context Portfolio constraint context.
 * @param {Object} options.baseline Baseline portfolio result.
 * @param {number} [options.scenarios]
 * @param {number} [options.seed]
 * @returns {Object}
 */
export function runSensitivityAnalysis({
  projects,
  separateTrack = [],
  criteria,
  baselineDimensionWeights,
  context,
  baseline,
  scenarios = 60,
  seed = 20250831
}) {
  /**
   * Separate-track projects (statutory, emergency) are not ranked but do
   * consume budget and do satisfy policy minimums. Every scenario must see
   * them, or each perturbed portfolio is judged against a constraint set it
   * structurally cannot meet and the whole sweep reports zero selections.
   */
  const asCandidate = project => ({
    ...project,
    netFlow: 0,
    finalScore: null,
    rank: null,
    separateTrack: true
  });

  const random = createRandom(seed);
  const ids = projects.map(project => String(project.id));

  const selectionCount = new Map(ids.map(id => [id, 0]));
  const rankSum = new Map(ids.map(id => [id, 0]));
  const rankMin = new Map(ids.map(id => [id, Number.POSITIVE_INFINITY]));
  const rankMax = new Map(ids.map(id => [id, 0]));
  /** For «پروژه جایگزین»: who tends to appear when project X does not. */
  const substitutes = new Map(ids.map(id => [id, new Map()]));

  const baselineIds = new Set(
    baseline.selected.map(project => String(project.id))
  );

  const budgetCap = context.budget ?? 0;

  const runScenario = ({ weightMagnitude, thresholdMagnitude, budgetFactor, costFactor }) => {
    const dimensionWeights = perturbWeights(
      baselineDimensionWeights,
      random,
      weightMagnitude
    );
    const criterionWeights = expandToCriterionWeights(dimensionWeights, criteria);

    const thresholds = Object.fromEntries(
      criteria.map(criterion => {
        const jitter = 1 + (random() * 2 - 1) * thresholdMagnitude;

        return [
          criterion.code,
          { q: criterion.q * jitter, p: criterion.p * jitter }
        ];
      })
    );

    const scenarioProjects = costFactor === 1
      ? projects
      : projects.map(project => ({
          ...project,
          budget: (project.budget ?? 0) * costFactor
        }));

    const { ranking } = rankByPromethee({
      projects: scenarioProjects,
      criteria,
      criterionWeights,
      thresholds
    });

    const scenarioSeparateTrack = costFactor === 1
      ? separateTrack
      : separateTrack.map(project => ({
          ...project,
          budget: (project.budget ?? 0) * costFactor
        }));

    const portfolio = buildPortfolio({
      candidates: [...ranking, ...scenarioSeparateTrack.map(asCandidate)],
      context: { ...context, budget: budgetCap * budgetFactor },
      include: context.include ?? [],
      exclude: context.exclude ?? [],
      seed: Math.floor(random() * 2 ** 31),
      restarts: 8
    });

    return { ranking, portfolio };
  };

  for (let index = 0; index < scenarios; index += 1) {
    const { ranking, portfolio } = runScenario({
      weightMagnitude: 0.25,
      thresholdMagnitude: 0.3,
      budgetFactor: 0.8 + random() * 0.4,
      costFactor: 1 + random() * 0.25
    });

    ranking.forEach(project => {
      const id = String(project.id);

      rankSum.set(id, rankSum.get(id) + project.rank);
      rankMin.set(id, Math.min(rankMin.get(id), project.rank));
      rankMax.set(id, Math.max(rankMax.get(id), project.rank));
    });

    const chosen = new Set(portfolio.selected.map(project => String(project.id)));

    chosen.forEach(id => selectionCount.set(id, (selectionCount.get(id) ?? 0) + 1));

    // Substitute tracking: when a baseline member is absent, note who is in.
    baselineIds.forEach(baselineId => {
      if (chosen.has(baselineId)) {
        return;
      }

      chosen.forEach(otherId => {
        if (baselineIds.has(otherId)) {
          return;
        }

        const tally = substitutes.get(baselineId);

        tally.set(otherId, (tally.get(otherId) ?? 0) + 1);
      });
    });
  }

  /**
   * The smallest budget at which a project still makes the portfolio — found
   * by bisection on the budget cap rather than by a linear sweep.
   */
  const minimumEntryBudget = projectId => {
    const criterionWeights = expandToCriterionWeights(
      baselineDimensionWeights,
      criteria
    );
    const { ranking } = rankByPromethee({ projects, criteria, criterionWeights });
    const pool = [...ranking, ...separateTrack.map(asCandidate)];

    const entersAt = cap =>
      buildPortfolio({
        candidates: pool,
        context: { ...context, budget: cap },
        include: context.include ?? [],
        exclude: context.exclude ?? [],
        seed,
        restarts: 6
      }).selected.some(project => String(project.id) === projectId);

    let low = 0;
    let high = budgetCap * 2;

    if (!entersAt(high)) {
      return null;
    }

    for (let iteration = 0; iteration < 12; iteration += 1) {
      const mid = (low + high) / 2;

      if (entersAt(mid)) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return round(high, 2);
  };

  const byId = new Map(projects.map(project => [String(project.id), project]));

  const perProject = ids.map(id => {
    const project = byId.get(id);
    const selectionRate = round((selectionCount.get(id) / scenarios) * 100, 1);
    const inBaseline = baselineIds.has(id);

    const substituteTally = [...(substitutes.get(id)?.entries() ?? [])].sort(
      ([, left], [, right]) => right - left
    );

    return {
      projectId: id,
      projectName: project.name,
      inBaselinePortfolio: inBaseline,
      /** درصد سناریوهای انتخاب */
      selectionRatePercent: selectionRate,
      /** بررسی پایداری عضویت پروژه‌ها در سبد */
      membershipStability: inBaseline
        ? round(selectionRate / 100, 3)
        : round(1 - selectionRate / 100, 3),
      averageRank: round(rankSum.get(id) / scenarios, 2),
      /** بررسی رتبه‌برگشتی: the spread the ranking shows across scenarios. */
      rankRange: {
        best: rankMin.get(id) === Number.POSITIVE_INFINITY ? null : rankMin.get(id),
        worst: rankMax.get(id) || null,
        reversal: (rankMax.get(id) || 0) - (rankMin.get(id) || 0)
      },
      /** پروژه جایگزین */
      substitute: substituteTally.length > 0
        ? {
            projectId: substituteTally[0][0],
            projectName: byId.get(substituteTally[0][0])?.name ?? null,
            frequency: round((substituteTally[0][1] / scenarios) * 100, 1)
          }
        : null
    };
  });

  /**
   * حساسیت به افزایش هزینه.
   *
   * Cost is measured against portfolio *membership*, not rank: PROMETHEE ranks
   * on criterion performance and never reads `budget`, so a cost sweep would
   * report a flat zero if it looked at rank shift. What a cost overrun actually
   * threatens is a project's place in the portfolio, so that is what is
   * measured — the drop in selection rate per unit of cost increase.
   *
   * @returns {Map<string, number>}
   */
  const costMembershipSensitivity = () => {
    const passes = 8;
    const chosenAtCost = new Map(ids.map(id => [id, 0]));
    let totalIncrease = 0;

    for (let index = 0; index < passes; index += 1) {
      const costFactor = 1.05 + random() * 0.3;

      totalIncrease += costFactor - 1;

      const { portfolio } = runScenario({
        weightMagnitude: 0,
        thresholdMagnitude: 0,
        budgetFactor: 1,
        costFactor
      });

      portfolio.selected.forEach(project => {
        const id = String(project.id);

        if (chosenAtCost.has(id)) {
          chosenAtCost.set(id, chosenAtCost.get(id) + 1);
        }
      });
    }

    const averageIncrease = totalIncrease / passes;

    return new Map(
      ids.map(id => {
        const baselineMember = baselineIds.has(id) ? 1 : 0;
        const retained = chosenAtCost.get(id) / passes;
        // Loss of membership per 1.0 (100%) of cost increase.
        const drop = Math.max(0, baselineMember - retained);

        return [
          id,
          averageIncrease > 0 ? round(drop / averageIncrease, 3) : 0
        ];
      })
    );
  };

  /**
   * Targeted single-factor sweeps, so a stakeholder can see which lever moves
   * this project rather than only an aggregate stability number.
   */
  const singleFactor = factor => {
    const criterionWeights = expandToCriterionWeights(
      baselineDimensionWeights,
      criteria
    );
    const baseRanking = rankByPromethee({ projects, criteria, criterionWeights }).ranking;
    const baseRank = new Map(
      baseRanking.map(project => [String(project.id), project.rank])
    );

    const shifts = new Map(ids.map(id => [id, 0]));
    const passes = 12;

    for (let index = 0; index < passes; index += 1) {
      const { ranking } = runScenario({
        weightMagnitude: factor === "weights" ? 0.35 : 0,
        thresholdMagnitude: factor === "thresholds" ? 0.5 : 0,
        budgetFactor: 1,
        costFactor: 1
      });

      ranking.forEach(project => {
        const id = String(project.id);

        shifts.set(
          id,
          shifts.get(id) + Math.abs(project.rank - (baseRank.get(id) ?? project.rank))
        );
      });
    }

    return new Map(
      ids.map(id => [id, round(shifts.get(id) / passes, 2)])
    );
  };

  const weightSensitivity = singleFactor("weights");
  const thresholdSensitivity = singleFactor("thresholds");
  const costSensitivity = costMembershipSensitivity();

  return {
    scenarios,
    seed,
    projects: perProject.map(entry => ({
      ...entry,
      /** حداقل بودجه لازم برای ورود */
      minimumEntryBudget: minimumEntryBudget(entry.projectId),
      /** حساسیت به تغییر وزن‌ها — mean rank shift under weight perturbation. */
      weightSensitivity: weightSensitivity.get(entry.projectId) ?? 0,
      /** حساسیت به آستانه‌های ترجیح */
      thresholdSensitivity: thresholdSensitivity.get(entry.projectId) ?? 0,
      /**
       * حساسیت به افزایش هزینه — loss of portfolio membership per unit of
       * cost overrun. 0 means the project holds its place; 1 means a 100%
       * overrun would fully displace it.
       */
      costSensitivity: costSensitivity.get(entry.projectId) ?? 0
    })),
    summary: {
      /** How stable the portfolio is as a whole. */
      averageMembershipStability: round(
        perProject.reduce((sum, entry) => sum + entry.membershipStability, 0) /
          Math.max(1, perProject.length),
        3
      ),
      maxRankReversal: perProject.reduce(
        (max, entry) => Math.max(max, entry.rankRange.reversal ?? 0),
        0
      )
    }
  };
}

/**
 * آزمون ورود و حذف پروژه — re-run the ranking with one project removed and
 * report whether the relative order of the survivors changed.
 *
 * A well-behaved model should not reorder unrelated projects when an
 * irrelevant alternative leaves the set; PROMETHEE II can, so the appendix is
 * right to ask for the test rather than assume the answer.
 *
 * @param {Object} options
 * @returns {Array}
 */
export function runAddDropTest({ projects, criteria, criterionWeights }) {
  const baseline = rankByPromethee({ projects, criteria, criterionWeights }).ranking;
  const baselineOrder = baseline.map(project => String(project.id));

  return projects.map(removed => {
    const remaining = projects.filter(
      project => String(project.id) !== String(removed.id)
    );
    const { ranking } = rankByPromethee({
      projects: remaining,
      criteria,
      criterionWeights
    });

    const expected = baselineOrder.filter(id => id !== String(removed.id));
    const actual = ranking.map(project => String(project.id));
    const reversals = actual.filter((id, index) => id !== expected[index]);

    return {
      removedProjectId: String(removed.id),
      removedProjectName: removed.name,
      rankReversalDetected: reversals.length > 0,
      affectedProjects: reversals
    };
  });
}
