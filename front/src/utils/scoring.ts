/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import type { CriterionKey, Project, RankedProject } from '../types';

/**
 * Client-side scoring helpers.
 *
 * IMPORTANT — the authoritative ranking is PROMETHEE II, computed by the
 * backend's ranking engine, and the authoritative portfolio comes from the
 * constrained optimiser. Nothing here reproduces either of them, and the UI
 * must not present these numbers as a ranking.
 *
 * What these functions are for is the interactive preview: while an analyst
 * drags a weight slider, recomputing a weighted-sum indicator locally gives
 * immediate feedback without a round trip per pixel. When the slider is
 * released, the UI calls `createRanking` and shows the real result.
 *
 * The two will not always agree, and that is expected rather than a bug: a
 * weighted sum has no preference thresholds and no pairwise flows, which is
 * precisely why the directive's ranking module is not a weighted sum.
 */

/**
 * Weighted-sum indicator over the eight dimensions — a preview only.
 */
export function weightedScore(
  project: Project,
  weights: Partial<Record<CriterionKey, number>>
): number {
  const entries = Object.entries(weights) as Array<[CriterionKey, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

  if (total <= 0) {
    return 0;
  }

  const sum = entries.reduce(
    (accumulator, [key, weight]) =>
      accumulator + (project.scores[key] ?? 0) * weight,
    0
  );

  return sum / total;
}

/**
 * Provisional ordering for the slider preview.
 *
 * Returns `finalScore` and `rank` so it is shape-compatible with the backend's
 * ranked projects, but callers should label the result as provisional.
 */
export function previewRanking(
  projects: Project[],
  weights: Partial<Record<CriterionKey, number>>
): Array<Project & { finalScore: number; rank: number }> {
  return projects
    .map(project => ({ ...project, finalScore: weightedScore(project, weights) }))
    .sort(
      (left, right) =>
        right.finalScore - left.finalScore || left.id.localeCompare(right.id)
    )
    .map((project, index) => ({ ...project, rank: index + 1 }));
}

/**
 * Sort projects by the backend's net flow.
 *
 * Projects on the separate track (statutory, emergency) carry a null rank
 * because they are never ranked against the other classes; they are kept at the
 * end of the list rather than being dropped or given a fabricated position.
 */
export function sortByNetFlow(projects: RankedProject[]): RankedProject[] {
  return [...projects].sort((left, right) => {
    if (left.rank === null && right.rank === null) {
      return left.id.localeCompare(right.id);
    }

    if (left.rank === null) {
      return 1;
    }

    if (right.rank === null) {
      return -1;
    }

    return left.rank - right.rank;
  });
}

/**
 * Redistribute weights so the total stays at 100 when one slider moves.
 *
 * The cap of 60 on a single dimension is a UI guard rail: letting one
 * dimension absorb the entire weight collapses the model to a single criterion
 * and makes the ranking meaningless.
 */
export function rebalanceWeights(
  weights: Record<CriterionKey, number>,
  key: CriterionKey,
  next: number
): Record<CriterionKey, number> {
  const keys = Object.keys(weights) as CriterionKey[];
  const others = keys.filter(entry => entry !== key);
  const clamped = Math.max(0, Math.min(60, next));
  const remaining = 100 - clamped;
  const othersTotal = others.reduce((sum, entry) => sum + weights[entry], 0);

  const result = { ...weights, [key]: clamped } as Record<CriterionKey, number>;

  others.forEach(entry => {
    result[entry] =
      othersTotal > 0
        ? (weights[entry] / othersTotal) * remaining
        : remaining / others.length;
  });

  return result;
}
