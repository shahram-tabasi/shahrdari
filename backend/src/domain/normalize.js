/**
 * Score resolution and normalisation.
 *
 * These are pure functions with no I/O, so the decision model can be unit
 * tested independently of the HTTP layer — a requirement of «دفترچه مدل
 * تصمیم‌گیری و فرمول‌ها» among the deliverables.
 */

import { DIRECTION } from "../data/criteria.js";

/**
 * The scale every criterion score is expressed on.
 */
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/**
 * Resolve the raw score of one criterion for one project.
 *
 * Resolution order:
 *   1. `project.criterionScores[code]` — the authoritative, criterion-level value.
 *   2. `project.scores[dimension]`     — the dimension-level fallback.
 *
 * The fallback is deliberately reported rather than hidden: a portfolio
 * decision defended with a number nobody entered is exactly the failure mode
 * «کنترل کیفیت داده» exists to prevent.
 *
 * @param {Object} project
 * @param {Object} criterion
 * @returns {{ value: number|null, source: "criterion"|"dimension"|"missing" }}
 */
export function resolveScore(project, criterion) {
  const direct = project.criterionScores?.[criterion.code];

  if (Number.isFinite(direct)) {
    return { value: direct, source: "criterion" };
  }

  const fallback = project.scores?.[criterion.dimension];

  if (Number.isFinite(fallback)) {
    return { value: fallback, source: "dimension" };
  }

  return { value: null, source: "missing" };
}

/**
 * Orient a raw score so that a higher number always means "better".
 *
 * Cost criteria (هزینه، ریسک، مدت زمان، بدهی…) are inverted here rather than
 * in the dataset, so the direction lives in the criteria model where it can be
 * reviewed, and a data-entry mistake cannot silently flip a preference.
 *
 * @param {number} value
 * @param {string} direction
 * @returns {number}
 */
export function orient(value, direction) {
  return direction === DIRECTION.COST
    ? SCORE_MAX - (value - SCORE_MIN)
    : value;
}

/**
 * Clamp a value into the score scale.
 *
 * @param {number} value
 * @returns {number}
 */
export function clampScore(value) {
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, value));
}

/**
 * Build the oriented decision matrix for a set of projects and criteria.
 *
 * @param {Array} projects
 * @param {Array} criteria
 * @returns {{ matrix: Map<string, Map<string, number>>, fallbacks: Array, missing: Array }}
 */
export function buildDecisionMatrix(projects, criteria) {
  const matrix = new Map();
  const fallbacks = [];
  const missing = [];

  projects.forEach(project => {
    const row = new Map();

    criteria.forEach(criterion => {
      const { value, source } = resolveScore(project, criterion);

      if (source === "missing") {
        missing.push({ projectId: project.id, criterion: criterion.code });
        row.set(criterion.code, null);

        return;
      }

      if (source === "dimension") {
        fallbacks.push({ projectId: project.id, criterion: criterion.code });
      }

      row.set(criterion.code, clampScore(orient(value, criterion.direction)));
    });

    matrix.set(String(project.id), row);
  });

  return { matrix, fallbacks, missing };
}

/**
 * Min-max normalise a list of numbers onto 0..1.
 *
 * A degenerate range (every value identical) maps to 0.5 rather than 0 or 1,
 * so a criterion on which no project differs contributes nothing to the
 * ordering instead of arbitrarily favouring one end.
 *
 * @param {number[]} values
 * @returns {number[]}
 */
export function minMaxNormalize(values) {
  const finite = values.filter(value => Number.isFinite(value));

  if (finite.length === 0) {
    return values.map(() => 0);
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min;

  return values.map(value => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return range === 0 ? 0.5 : (value - min) / range;
  });
}

/**
 * Round to a fixed precision without the floating point noise `toFixed`
 * leaves behind when the result is fed back into arithmetic.
 *
 * @param {number} value
 * @param {number} precision
 * @returns {number}
 */
export function round(value, precision = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
}
