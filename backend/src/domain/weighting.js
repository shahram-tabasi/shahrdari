/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * WEIGHTING ENGINE — computing weights and the consistency ratio.
 *
 * Three weight sources are supported, in increasing order of authority:
 *
 *   1. Rank-Order Centroid over the dimension ranks the شیوه‌نامه states.
 *      This is the default and needs no expert session.
 *   2. Direct weights supplied by an analyst (the UI sliders).
 *   3. An AHP pairwise-comparison matrix from an expert panel, which also
 *      yields the consistency ratio the شیوه‌نامه asks the module to compute.
 *
 * Whichever source is used, the result carries `source` and — for AHP — the
 * consistency ratio, so a downstream report can always state how the numbers
 * that drove a portfolio decision were obtained.
 */

import { dimensions } from "../data/criteria.js";
import { round } from "./normalize.js";

/**
 * Saaty's random consistency index, indexed by matrix order.
 * Orders 1 and 2 are always perfectly consistent.
 */
const RANDOM_INDEX = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

/**
 * The threshold above which an AHP judgement set is considered inconsistent.
 */
export const CONSISTENCY_THRESHOLD = 0.1;

/**
 * Scale a weight map so that its values sum to 100.
 *
 * @param {Object} weights
 * @returns {Object}
 */
export function normalizeWeights(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

  if (!(total > 0)) {
    throw new RangeError("مجموع وزن معیارها باید بزرگ‌تر از صفر باشد.");
  }

  return Object.fromEntries(
    entries.map(([key, weight]) => [key, round((weight / total) * 100, 6)])
  );
}

/**
 * The default dimension weights derived from the شیوه‌نامه's own ranking.
 *
 * @param {Array} [items]
 * @returns {Object}
 */
export function defaultWeights(items = dimensions) {
  return normalizeWeights(
    Object.fromEntries(items.map(item => [item.key, item.weight]))
  );
}

/**
 * Derive priority weights and the consistency ratio from an AHP pairwise
 * comparison matrix, using the normalised-column (arithmetic mean) approximation
 * of the principal eigenvector.
 *
 * `matrix[i][j]` is how many times more important item `i` is than item `j` on
 * Saaty's 1..9 scale; the caller is expected to have supplied a reciprocal
 * matrix with a unit diagonal.
 *
 * @param {string[]} keys
 * @param {number[][]} matrix
 * @returns {{ weights: Object, consistencyRatio: number, consistencyIndex: number, lambdaMax: number, consistent: boolean }}
 */
export function analyticHierarchyProcess(keys, matrix) {
  const size = keys.length;

  if (size === 0) {
    throw new RangeError("ماتریس مقایسات زوجی نمی‌تواند خالی باشد.");
  }

  if (matrix.length !== size || matrix.some(row => row.length !== size)) {
    throw new RangeError(
      `ماتریس مقایسات زوجی باید ${size}×${size} باشد.`
    );
  }

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(
          `مقدار نامعتبر در ماتریس مقایسات زوجی: سطر ${rowIndex + 1}، ستون ${columnIndex + 1}.`
        );
      }
    });
  });

  const columnTotals = Array.from({ length: size }, (unused, column) =>
    matrix.reduce((sum, row) => sum + row[column], 0)
  );

  // Normalised column matrix, then the row means give the priority vector.
  const priorities = matrix.map(row =>
    row.reduce(
      (sum, value, column) => sum + value / columnTotals[column],
      0
    ) / size
  );

  // λmax = Σ (column total × priority), which is the standard AHP estimate.
  const lambdaMax = columnTotals.reduce(
    (sum, total, index) => sum + total * priorities[index],
    0
  );

  const consistencyIndex = size > 1 ? (lambdaMax - size) / (size - 1) : 0;
  const randomIndex = RANDOM_INDEX[size] ?? RANDOM_INDEX[RANDOM_INDEX.length - 1];
  const consistencyRatio = randomIndex > 0 ? consistencyIndex / randomIndex : 0;

  return {
    weights: normalizeWeights(
      Object.fromEntries(keys.map((key, index) => [key, priorities[index]]))
    ),
    lambdaMax: round(lambdaMax, 6),
    consistencyIndex: round(consistencyIndex, 6),
    consistencyRatio: round(consistencyRatio, 6),
    consistent: consistencyRatio <= CONSISTENCY_THRESHOLD
  };
}

/**
 * Resolve the dimension weights for a request.
 *
 * @param {Object} [input]
 * @param {Object} [input.weights] Direct dimension weights.
 * @param {Object} [input.pairwise] `{ keys, matrix }` for AHP.
 * @param {Array}  [items]
 * @returns {{ weights: Object, source: string, consistencyRatio: number|null, consistent: boolean, warnings: string[] }}
 */
export function resolveDimensionWeights(input = {}, items = dimensions) {
  const knownKeys = new Set(items.map(item => item.key));
  const warnings = [];

  if (input.pairwise) {
    const { keys, matrix } = input.pairwise;
    const unknown = keys.filter(key => !knownKeys.has(key));

    if (unknown.length > 0) {
      throw new RangeError(`ابعاد ناشناخته در ماتریس: ${unknown.join("، ")}`);
    }

    const result = analyticHierarchyProcess(keys, matrix);

    if (!result.consistent) {
      warnings.push(
        `شاخص سازگاری قضاوت خبرگان (${result.consistencyRatio}) از آستانه ${CONSISTENCY_THRESHOLD} بیشتر است؛ ماتریس مقایسات زوجی باید بازنگری شود.`
      );
    }

    return {
      weights: result.weights,
      source: "ahp",
      lambdaMax: result.lambdaMax,
      consistencyIndex: result.consistencyIndex,
      consistencyRatio: result.consistencyRatio,
      consistent: result.consistent,
      warnings
    };
  }

  if (input.weights && Object.keys(input.weights).length > 0) {
    const merged = Object.fromEntries(
      items.map(item => [
        item.key,
        input.weights[item.key] ?? item.weight
      ])
    );

    return {
      weights: normalizeWeights(merged),
      source: "explicit",
      consistencyRatio: null,
      consistent: true,
      warnings
    };
  }

  return {
    weights: defaultWeights(items),
    source: "rank-order-centroid",
    consistencyRatio: null,
    consistent: true,
    warnings
  };
}

/**
 * Expand dimension-level weights down to criterion-level weights.
 *
 * A criterion's global weight is its dimension's weight multiplied by its share
 * within that dimension, so the eight dimension sliders the panel actually
 * moves stay the control surface while the thirty-seven leaf criteria remain
 * the unit of evaluation.
 *
 * @param {Object} dimensionWeights
 * @param {Array} criteria
 * @returns {Object} Criterion code → global weight (summing to 100).
 */
export function expandToCriterionWeights(dimensionWeights, criteria) {
  const localTotals = new Map();

  criteria.forEach(criterion => {
    localTotals.set(
      criterion.dimension,
      (localTotals.get(criterion.dimension) ?? 0) + criterion.localWeight
    );
  });

  const expanded = Object.fromEntries(
    criteria.map(criterion => {
      const dimensionWeight = dimensionWeights[criterion.dimension] ?? 0;
      const localTotal = localTotals.get(criterion.dimension) ?? 0;
      const share = localTotal > 0 ? criterion.localWeight / localTotal : 0;

      return [criterion.code, dimensionWeight * share];
    })
  );

  return normalizeWeights(expanded);
}
