/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * RANKING ENGINE — PROMETHEE II.
 *
 * The directive describes the ranking module as "computing FLOWS and project
 * ranks" — preference flows, not a weighted average. PROMETHEE II is used
 * because it delivers three things the directive asks for that a weighted sum
 * structurally cannot:
 *
 *   1. Preference and indifference thresholds (p and q), so a trivial
 *      difference between two projects does not become a preference.
 *   2. Pairwise flows, which make the rank-reversal check and the add/drop
 *      test meaningful tests rather than tautologies.
 *   3. A per-criterion decomposition of WHY one project outranks another,
 *      which the report generator needs in order to justify a decision.
 *
 * A weighted sum is still computed and returned as `utility`, purely as a
 * familiar reference figure for the dashboard. IT DOES NOT DETERMINE THE
 * ORDER — the net flow does. Do not sort on `utility`.
 *
 * NOTE ON SINGLE-MEMBER GROUPS: a project that is the only member of its class
 * has no one to be compared against, so its net flow is 0 and its displayed
 * score is 50. That is correct, not a bug.
 */

import { buildDecisionMatrix, round } from "./normalize.js";

/**
 * Linear preference function with indifference and preference thresholds
 * (Type V in Brans' taxonomy).
 *
 * @param {number} difference d = g(a) − g(b) on the oriented scale
 * @param {number} q Indifference threshold
 * @param {number} p Preference threshold
 * @returns {number} Degree of preference in 0..1
 */
export function preferenceDegree(difference, q, p) {
  if (difference <= q) {
    return 0;
  }

  if (difference >= p) {
    return 1;
  }

  // p > q is guaranteed here: difference sits strictly between them.
  return (difference - q) / (p - q);
}

/**
 * Rank a project set with PROMETHEE II.
 *
 * @param {Object} options
 * @param {Array}  options.projects
 * @param {Array}  options.criteria Leaf criteria participating in the ranking.
 * @param {Object} options.criterionWeights Criterion code → weight.
 * @param {Object} [options.thresholds] Criterion code → `{ q, p }` override.
 * @returns {Object}
 */
export function rankByPromethee({
  projects,
  criteria,
  criterionWeights,
  thresholds = {}
}) {
  const { matrix, fallbacks, missing } = buildDecisionMatrix(projects, criteria);
  const ids = projects.map(project => String(project.id));
  const count = ids.length;

  if (count === 0) {
    return {
      ranking: [],
      dataQuality: { fallbacks, missing },
      pairwise: []
    };
  }

  const weightTotal = criteria.reduce(
    (sum, criterion) => sum + (criterionWeights[criterion.code] ?? 0),
    0
  );

  if (!(weightTotal > 0)) {
    throw new RangeError("مجموع وزن معیارهای شرکت‌کننده در رتبه‌بندی صفر است.");
  }

  // Aggregated preference index π(a, b) for every ordered pair, plus the
  // per-criterion contributions that explain it.
  const preference = new Map();
  const contributions = new Map();

  ids.forEach(left => {
    preference.set(left, new Map());
    contributions.set(left, new Map());

    ids.forEach(right => {
      if (left === right) {
        preference.get(left).set(right, 0);

        return;
      }

      let aggregate = 0;
      const byCriterion = {};

      criteria.forEach(criterion => {
        const weight = criterionWeights[criterion.code] ?? 0;

        if (weight === 0) {
          return;
        }

        const leftValue = matrix.get(left).get(criterion.code);
        const rightValue = matrix.get(right).get(criterion.code);

        if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
          return;
        }

        const override = thresholds[criterion.code] ?? {};
        const q = Number.isFinite(override.q) ? override.q : criterion.q;
        const rawP = Number.isFinite(override.p) ? override.p : criterion.p;
        // A preference threshold at or below the indifference threshold would
        // divide by zero; nudge it into a strict inequality instead of failing.
        const p = rawP > q ? rawP : q + Number.EPSILON;

        const degree = preferenceDegree(leftValue - rightValue, q, p);

        if (degree > 0) {
          const contribution = (weight / weightTotal) * degree;

          aggregate += contribution;
          byCriterion[criterion.code] = round(contribution, 6);
        }
      });

      preference.get(left).set(right, aggregate);
      contributions.get(left).set(right, byCriterion);
    });
  });

  // Positive, negative and net flows. With a single project the flows are
  // undefined, so it is reported with zero flow rather than dividing by zero.
  const divisor = count > 1 ? count - 1 : 1;

  const flows = ids.map(id => {
    let positive = 0;
    let negative = 0;

    ids.forEach(other => {
      if (other === id) {
        return;
      }

      positive += preference.get(id).get(other);
      negative += preference.get(other).get(id);
    });

    return {
      id,
      positiveFlow: positive / divisor,
      negativeFlow: negative / divisor
    };
  });

  const byId = new Map(projects.map(project => [String(project.id), project]));

  const ranking = flows
    .map(flow => {
      const project = byId.get(flow.id);
      const netFlow = flow.positiveFlow - flow.negativeFlow;

      // Reference weighted-sum utility on the same oriented matrix.
      let utility = 0;

      criteria.forEach(criterion => {
        const weight = criterionWeights[criterion.code] ?? 0;
        const value = matrix.get(flow.id).get(criterion.code);

        if (Number.isFinite(value)) {
          utility += (weight / weightTotal) * value;
        }
      });

      return {
        ...project,
        positiveFlow: round(flow.positiveFlow, 6),
        negativeFlow: round(flow.negativeFlow, 6),
        netFlow: round(netFlow, 6),
        // 0..100 presentation of the net flow, which lives in −1..1.
        finalScore: round(((netFlow + 1) / 2) * 100, 4),
        utility: round(utility, 4)
      };
    })
    .sort(
      (left, right) =>
        right.netFlow - left.netFlow ||
        String(left.id).localeCompare(String(right.id))
    )
    .map((project, index) => ({ ...project, rank: index + 1 }));

  return {
    ranking,
    dataQuality: { fallbacks, missing },
    pairwise: ids.map(left => ({
      projectId: left,
      outranks: Object.fromEntries(
        ids
          .filter(right => right !== left)
          .map(right => [right, round(preference.get(left).get(right), 6)])
      )
    })),
    contributions
  };
}

/**
 * Explain why one project outranks another, in terms of the criteria that
 * actually produced the preference.
 *
 * @param {Object} prometheeResult
 * @param {string} leftId
 * @param {string} rightId
 * @param {Array} criteria
 * @param {number} [limit]
 * @returns {Array}
 */
export function explainPair(prometheeResult, leftId, rightId, criteria, limit = 5) {
  const byCriterion =
    prometheeResult.contributions?.get(String(leftId))?.get(String(rightId)) ?? {};
  const labels = new Map(criteria.map(criterion => [criterion.code, criterion.label]));

  return Object.entries(byCriterion)
    .sort(([, left], [, right]) => right - left)
    .slice(0, limit)
    .map(([code, contribution]) => ({
      code,
      label: labels.get(code) ?? code,
      contribution
    }));
}
