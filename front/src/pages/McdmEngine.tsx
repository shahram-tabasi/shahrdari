/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { WeightSliders } from '../components/mcdm/WeightSliders';
import { RankingTable } from '../components/mcdm/RankingTable';
import { RadarPanel } from '../components/mcdm/RadarPanel';
import { AuditTrailPanel } from '../components/mcdm/AuditTrailPanel';
import { ExpertModeModal } from '../components/mcdm/ExpertModeModal';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useData } from '../contexts/DataContext';
import type { CriterionKey, RankedProject } from '../types';
import { createRanking } from '../services/api';
import { previewRanking, rebalanceWeights } from '../utils/scoring';
import { faNum, faPercent } from '../utils/format';

export function McdmEngine() {
  const { criteria, projects } = useData();

  /** The directive's own default weights, as served by the backend. */
  const initialWeights = useMemo(
    () =>
      criteria.reduce(
        (acc, criterion) => ({ ...acc, [criterion.key]: criterion.weight }),
        {} as Record<CriterionKey, number>
      ),
    [criteria]
  );

  const [weights, setWeights] = useState<Record<CriterionKey, number>>(initialWeights);
  const [manualOrder, setManualOrder] = useState<string[]>([]);
  const [radarProject, setRadarProject] = useState<RankedProject | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [expertOpen, setExpertOpen] = useState(false);

  /**
   * The authoritative ranking is PROMETHEE II on the backend. While the
   * sliders move we show a local weighted-sum preview so the table responds
   * immediately, then replace it with the real ranking once the request
   * returns. The two can differ — a weighted sum has no preference thresholds
   * and no pairwise flows — so the table is labelled while a preview is shown.
   */
  const [ranked, setRanked] = useState<RankedProject[] | null>(null);
  const [ranking, setRanking] = useState(false);

  const refreshRanking = useCallback(async () => {
    setRanking(true);

    try {
      const result = await createRanking({ weights });

      setRanked(result.projects);
    } catch {
      // Fall back to the local preview; the backend error surfaces through
      // DataContext's own error handling on the next data refresh.
      setRanked(null);
    } finally {
      setRanking(false);
    }
  }, [weights]);

  useEffect(() => {
    const timer = setTimeout(() => void refreshRanking(), 350);

    return () => clearTimeout(timer);
  }, [refreshRanking]);

  const rows = useMemo(() => {
    const base =
      ranked ??
      (previewRanking(projects, weights) as unknown as RankedProject[]);

    if (manualOrder.length === 0) {
      return base;
    }

    return [...base].sort(
      (left, right) =>
        manualOrder.indexOf(left.id) - manualOrder.indexOf(right.id)
    );
  }, [ranked, projects, weights, manualOrder]);

  const toggleCompare = (id: string) =>
  setCompareIds((prev) =>
  prev.includes(id) ?
  prev.filter((x) => x !== id) :
  prev.length >= 2 ?
  [prev[1], id] :
  [...prev, id]
  );

  const [a, b] = compareIds.map(
    (id) => rows.find((row: RankedProject) => row.id === id) ?? null
  );

  return (
    <div className="space-y-6">
      <WeightSliders
        weights={weights}
        onChange={(key, value) =>
        setWeights((prev) => rebalanceWeights(prev, key, value))
        }
        onReset={() => {
          setWeights(initialWeights);
          setManualOrder([]);
        }}
        onExpertMode={() => setExpertOpen(true)} />
      

      {ranked === null ? (
        <p className="rounded-lg bg-amber-500/10 px-4 py-2.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
          نمای پیش‌نمایش (مجموع وزنی) نمایش داده می‌شود؛ رتبه‌بندی رسمی با روش
          PROMETHEE II از موتور رتبه‌بندی دریافت می‌شود{ranking ? '…' : '.'}
        </p>
      ) : null}

      <RankingTable
        rows={rows}
        compareIds={compareIds}
        onToggleCompare={toggleCompare}
        onOpenRadar={(p) => setRadarProject(p)}
        onReorder={setManualOrder}
        onCompare={() => setCompareOpen(true)} />
      

      <AuditTrailPanel />

      {/* نمودار راداری یک پروژه */}
      <Modal
        open={Boolean(radarProject)}
        onClose={() => setRadarProject(null)}
        title={radarProject?.name ?? ''}
        subtitle={
        radarProject ?
        `${radarProject.id} • ${radarProject.district} • ${
          radarProject.rank === null
            ? 'خارج از ماتریس مقایسه'
            : `رتبه ${faNum(radarProject.rank)} • امتیاز نهایی ${faNum(radarProject.finalScore ?? 0, 1)}`
        }` :
        undefined
        }>
        
        {radarProject ?
        <div className="grid gap-8 md:grid-cols-[1fr_260px]">
            <RadarPanel primary={radarProject} height={340} />
            <div className="space-y-3">
              {criteria.map((c) =>
            <div
              key={c.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3.5 py-2.5 dark:bg-white/5">
              
                  <span className="text-[11px] text-ink-500 dark:text-white/45">
                    {c.label}
                  </span>
                  <span className="text-[11px] font-bold text-ink-900 dark:text-white/85">
                    {faNum(radarProject.scores[c.key])}
                  </span>
                </div>
            )}
              <div className="rounded-lg bg-amber-500/8 p-4">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  ریسک اجرا: {faPercent(radarProject.risk)}
                </p>
                <p className="mt-1.5 text-[11px] leading-6 text-ink-700 dark:text-white/70">
                  {radarProject.explain}
                </p>
              </div>
            </div>
          </div> :
        null}
      </Modal>

      {/* نمای مقایسه‌ای */}
      <Modal
        open={compareOpen && Boolean(a && b)}
        onClose={() => setCompareOpen(false)}
        title="نمای مقایسه‌ای دو پروژه"
        subtitle="تفاوت امتیاز معیارها به‌صورت هم‌پوشان روی نمودار راداری"
        width="max-w-4xl">
        
        {a && b ?
        <div className="grid gap-8 md:grid-cols-[1fr_280px]">
            <RadarPanel primary={a} compare={b} height={380} />
            <div className="space-y-4">
              {[a, b].map((p, i) =>
            <div
              key={p.id}
              className="rounded-lg border border-navy-800/8 p-4 dark:border-white/8">
              
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={i === 0 ? 'navy' : 'amber'}>
                      {p.rank === null ? 'مسیر مستقل' : `رتبه ${faNum(p.rank)}`}
                    </Badge>
                    <span className="text-sm font-extrabold text-ink-900 dark:text-white/90">
                      {faNum(p.finalScore ?? 0, 1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-ink-900 dark:text-white/85">
                    {p.name}
                  </p>
                  <p className="mt-1 text-[10px] text-ink-500 dark:text-white/40">
                    {p.district} • ضریب عدالت {faNum(p.justice, 2)}
                  </p>
                </div>
            )}
              <div className="rounded-lg bg-canvas p-4 text-[11px] leading-6 text-ink-700 dark:bg-white/5 dark:text-white/70">
                اختلاف امتیاز نهایی:{' '}
                <b>{faNum(Math.abs((a.finalScore ?? 0) - (b.finalScore ?? 0)), 1)}</b>{' '}
                واحد — بیشترین شکاف در معیار{' '}
                <b>
                  {
                criteria.
                map((c) => ({
                  label: c.label,
                  gap: Math.abs(a.scores[c.key] - b.scores[c.key])
                })).
                sort((x, y) => y.gap - x.gap)[0].label
                }
                </b>
                .
              </div>
            </div>
          </div> :
        null}
      </Modal>

      {/* Expert mode returns AHP-derived dimension weights; applying them
          replaces the slider values and re-runs the ranking. */}
      <ExpertModeModal
        open={expertOpen}
        onClose={() => setExpertOpen(false)}
        onApply={(derived) => setWeights(derived)} />

    </div>);

}
