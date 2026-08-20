import React, { useMemo, useState } from 'react';
import { WeightSliders } from '../components/mcdm/WeightSliders';
import { RankingTable } from '../components/mcdm/RankingTable';
import { RadarPanel } from '../components/mcdm/RadarPanel';
import { AuditTrailPanel } from '../components/mcdm/AuditTrailPanel';
import { ExpertModeModal } from '../components/mcdm/ExpertModeModal';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useData } from '../contexts/DataContext';
import type { CriterionKey } from '../types';
import {
  rankProjects,
  rebalanceWeights,
  type RankedProject } from
'../utils/scoring';
import { faNum, faPercent } from '../utils/format';

export function McdmEngine() {
  const { criteria, projects } = useData();
  const [weights, setWeights] = useState<Record<CriterionKey, number>>(() =>
    criteria.reduce(
      (acc, criterion) => ({ ...acc, [criterion.key]: criterion.weight }),
      {} as Record<CriterionKey, number>
    )
  );
  const [manualOrder, setManualOrder] = useState<string[]>([]);
  const [radarProject, setRadarProject] = useState<RankedProject | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [expertOpen, setExpertOpen] = useState(false);

  const rows = useMemo(
    () => rankProjects(projects, weights, manualOrder),
    [projects, weights, manualOrder]
  );

  const toggleCompare = (id: string) =>
  setCompareIds((prev) =>
  prev.includes(id) ?
  prev.filter((x) => x !== id) :
  prev.length >= 2 ?
  [prev[1], id] :
  [...prev, id]
  );

  const [a, b] = compareIds.map((id) => rows.find((r) => r.id === id) ?? null);

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
        `${radarProject.id} • ${radarProject.district} • رتبه ${faNum(radarProject.rank)} • امتیاز نهایی ${faNum(radarProject.finalScore, 1)}` :
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
                      رتبه {faNum(p.rank)}
                    </Badge>
                    <span className="text-sm font-extrabold text-ink-900 dark:text-white/90">
                      {faNum(p.finalScore, 1)}
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
                اختلاف امتیاز نهایی: <b>{faNum(Math.abs(a.finalScore - b.finalScore), 1)}</b>{' '}
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

      <ExpertModeModal open={expertOpen} onClose={() => setExpertOpen(false)} />
    </div>);

}
