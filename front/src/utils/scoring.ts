import type { CriterionKey, Project } from '../types';

export interface RankedProject extends Project {
  finalScore: number;
  rank: number;
}

/** امتیاز وزنی نهایی پروژه بر اساس وزن معیارها (مجموع وزن‌ها = ۱۰۰) */
export function weightedScore(
project: Project,
weights: Record<CriterionKey, number>)
: number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const sum = (Object.keys(weights) as CriterionKey[]).reduce(
    (acc, key) => acc + project.scores[key] * weights[key],
    0
  );
  return sum / total;
}

export function rankProjects(
projects: Project[],
weights: Record<CriterionKey, number>,
manualOrder?: string[])
: RankedProject[] {
  const scored = projects.map((p) => ({
    ...p,
    finalScore: weightedScore(p, weights),
    rank: 0
  }));

  if (manualOrder && manualOrder.length) {
    scored.sort((a, b) => manualOrder.indexOf(a.id) - manualOrder.indexOf(b.id));
  } else {
    scored.sort((a, b) => b.finalScore - a.finalScore);
  }

  return scored.map((p, i) => ({ ...p, rank: i + 1 }));
}

/** توزیع مجدد وزن‌ها به‌گونه‌ای که مجموع همیشه ۱۰۰ بماند */
export function rebalanceWeights(
weights: Record<CriterionKey, number>,
key: CriterionKey,
next: number)
: Record<CriterionKey, number> {
  const keys = Object.keys(weights) as CriterionKey[];
  const others = keys.filter((k) => k !== key);
  const clamped = Math.max(0, Math.min(60, next));
  const remaining = 100 - clamped;
  const othersTotal = others.reduce((a, k) => a + weights[k], 0);

  const result = { ...weights, [key]: clamped } as Record<CriterionKey, number>;
  others.forEach((k) => {
    result[k] =
    othersTotal > 0 ?
    weights[k] / othersTotal * remaining :
    remaining / others.length;
  });
  return result;
}