import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookmarkPlusIcon,
  CheckIcon,
  LayersIcon,
  SaveIcon,
  ScaleIcon,
  StarIcon,
  WalletIcon } from
'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BudgetDonut } from '../components/optimizer/BudgetDonut';
import { useData } from '../contexts/DataContext';
import type { ConstraintViolation, CriterionKey, PortfolioResult } from '../types';
import { optimizePortfolio } from '../services/api';
import { faNum, faPercent, faShortBudget } from '../utils/format';

export function PortfolioOptimizer() {
  const {
    projects,
    criteria,
    categoryColors,
    system: { savedScenarios }
  } = useData();
  const weights = useMemo(
    () => criteria.reduce(
      (acc, criterion) => ({ ...acc, [criterion.key]: criterion.weight }),
      {} as Record<CriterionKey, number>
    ),
    [criteria]
  );
  const totalPool = useMemo(
    () => projects.reduce((sum, project) => sum + project.budget, 0),
    [projects]
  );
  const [cap, setCap] = useState(3600);
  const [forced, setForced] = useState<Record<string, boolean>>({});
  const [activeScenario, setActiveScenario] = useState('s2');

  /**
   * The portfolio comes from the backend optimiser, never from a client-side
   * greedy walk down the ranking.
   *
   * This page used to fill the budget by taking projects in rank order until
   * the money ran out. پیوست شماره دو rules that out explicitly — «رتبه بالاتر
   * یک پروژه الزاماً به معنای عضویت آن در سبد نهایی نیست» — because a greedy
   * pass cannot honour dependencies, regional equity, execution capacity or
   * the policy minimums, and cannot notice that two cheaper projects beat one
   * expensive higher-ranked one.
   */
  const [portfolio, setPortfolio] = useState<PortfolioResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);

  const runOptimizer = useCallback(async () => {
    setOptimizing(true);
    setOptimizeError(null);

    try {
      const include = Object.entries(forced)
        .filter(([, pinned]) => pinned === true)
        .map(([id]) => id);
      const exclude = Object.entries(forced)
        .filter(([, pinned]) => pinned === false)
        .map(([id]) => id);

      setPortfolio(
        await optimizePortfolio({
          budget: cap,
          weights,
          includeProjectIds: include,
          excludeProjectIds: exclude
        })
      );
    } catch (error) {
      setOptimizeError(
        error instanceof Error ? error.message : 'بهینه‌سازی سبد ناموفق بود.'
      );
      setPortfolio(null);
    } finally {
      setOptimizing(false);
    }
  }, [cap, weights, forced]);

  useEffect(() => {
    const timer = setTimeout(() => void runOptimizer(), 400);

    return () => clearTimeout(timer);
  }, [runOptimizer]);

  const ranked = useMemo(
    () => portfolio?.projects ?? [],
    [portfolio]
  );

  const selected = useMemo(
    () => new Set((portfolio?.projects ?? []).map((project) => project.id)),
    [portfolio]
  );

  const used = portfolio?.usedBudget ?? 0;

  const justiceAvg = portfolio?.equity.equityScore ?? 0;

  /** Constraints the current budget cannot satisfy. */
  const violations: ConstraintViolation[] =
    portfolio?.optimization.violations ?? [];

  return (
    <div className="space-y-6">
      {/* ——— Budget slider ——— */}
      <Card className="px-8 py-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-ink-500 dark:text-white/50">
              <WalletIcon size={16} className="text-amber-500" />
              سقف بودجه قابل تخصیص (میلیارد تومان)
            </p>
            <p className="mt-2 text-4xl font-extrabold leading-none text-ink-900 dark:text-white/90">
              {faNum(cap)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="navy">
              <LayersIcon size={13} />
              {faNum(selected.size)} پروژه در سبد
            </Badge>
            <Badge tone={portfolio?.equity.satisfied ? 'green' : 'amber'}>
              <ScaleIcon size={13} />
              سهم مناطق هدف {faPercent(portfolio?.equity.actualSharePercent ?? 0)}
            </Badge>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-navy-900 shadow-glow">
              
              <SaveIcon size={15} />
              ذخیره سناریو
            </button>
          </div>
        </div>

        <input
          type="range"
          min={800}
          max={totalPool}
          step={100}
          value={cap}
          onChange={(e) => setCap(Number(e.target.value))}
          aria-label="سقف بودجه"
          className="budget mt-6 w-full" />
        
        <div className="mt-2 flex justify-between text-[10px] font-semibold text-ink-300 dark:text-white/30">
          <span>{faNum(800)}</span>
          <span>{faNum(totalPool)}</span>
        </div>

        {optimizing ? (
          <p className="mt-4 text-[11px] font-bold text-ink-500 dark:text-white/45">
            در حال تشکیل سبد تحت محدودیت‌ها…
          </p>
        ) : null}

        {optimizeError ? (
          <p className="mt-4 rounded-lg bg-rose-500/10 px-4 py-2.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            {optimizeError}
          </p>
        ) : null}

        {portfolio?.status === 'infeasible' ? (
          <div className="mt-4 rounded-lg bg-rose-500/10 px-4 py-3">
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              با این سقف بودجه هیچ سبد سازگاری وجود ندارد؛ فهرست زیر صرفاً
              تشخیصی است و پیشنهاد اجرا نیست.
            </p>
            {portfolio.optimization.infeasibility ? (
              <p className="mt-1.5 text-[11px] leading-6 text-ink-700 dark:text-white/70">
                {portfolio.optimization.infeasibility.message}
              </p>
            ) : null}
            <ul className="mt-2 space-y-1">
              {violations.map((violation) => (
                <li
                  key={violation.rule}
                  className="text-[10px] leading-5 text-ink-700 dark:text-white/60">
                  • {violation.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        {/* ——— Scenarios ——— */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="سناریوها"
              subtitle="ذخیره و مقایسه ترکیب‌های مختلف بودجه"
              icon={<BookmarkPlusIcon size={17} />} />
            
            <ul className="space-y-3 px-6 pb-6">
              {savedScenarios.map((s) => {
                const active = activeScenario === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveScenario(s.id);
                        setCap(s.budget);
                        setForced({});
                      }}
                      className={[
                      'w-full rounded-lg border p-4 text-right transition',
                      active ?
                      'border-amber-500 bg-amber-500/6' :
                      'border-navy-800/8 hover:border-navy-800/20 dark:border-white/8'].
                      join(' ')}>
                      
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-ink-900 dark:text-white/85">
                          {s.name}
                        </span>
                        {active ?
                        <CheckIcon size={15} className="text-amber-500" /> :
                        null}
                      </div>
                      <p className="mt-1.5 text-[10px] text-ink-500 dark:text-white/40">
                        {faShortBudget(s.budget)} • {faNum(s.projects)} پروژه
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-md bg-canvas px-2 py-1.5 dark:bg-white/5">
                          <dt className="text-ink-500 dark:text-white/40">پوشش نیاز</dt>
                          <dd className="mt-0.5 font-bold text-ink-900 dark:text-white/80">
                            {faPercent(s.coverage)}
                          </dd>
                        </div>
                        <div className="rounded-md bg-canvas px-2 py-1.5 dark:bg-white/5">
                          <dt className="text-ink-500 dark:text-white/40">عدالت</dt>
                          <dd className="mt-0.5 font-bold text-ink-900 dark:text-white/80">
                            {faNum(s.justice, 2)}
                          </dd>
                        </div>
                      </dl>
                    </button>
                  </li>);

              })}
            </ul>
          </Card>

          <Card className="p-6">
            <p className="mb-4 text-xs font-bold text-ink-900 dark:text-white/85">
              نمودار پیشرفت بودجه (Burn-down)
            </p>
            <BudgetDonut used={used} total={cap} />
          </Card>
        </div>

        {/* ——— Project grid ——— */}
        <Card>
          <CardHeader
            title="شبکه پروژه‌ها"
            subtitle="پروژه‌های داخل سقف بودجه رنگی و بقیه خاکستری هستند؛ با کلیک می‌توانید دستی وارد یا خارج کنید"
            icon={<LayersIcon size={17} />}
            action={
            <Badge tone="neutral">
                {faNum(portfolio?.rejected.length ?? 0)} پروژه خارج از سبد
              </Badge>
            } />
          
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 px-6 pb-6">
            {ranked.map((p) => {
              const inBudget = selected.has(p.id);
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  layout
                  onClick={() =>
                  setForced((prev) => ({ ...prev, [p.id]: !inBudget }))
                  }
                  animate={{
                    filter: inBudget ? 'grayscale(0)' : 'grayscale(1)',
                    opacity: inBudget ? 1 : 0.55
                  }}
                  transition={{ duration: 0.35 }}
                  className={[
                  'h-[150px] rounded-xl border p-4 text-right transition',
                  inBudget ?
                  'border-navy-800/10 bg-surface shadow-card dark:border-white/10 dark:bg-night-600' :
                  'border-dashed border-navy-800/12 bg-canvas dark:border-white/10 dark:bg-white/5'].
                  join(' ')}>
                  
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${categoryColors[p.category]}1F`,
                        color: categoryColors[p.category]
                      }}>
                      
                      {p.category}
                    </span>
                    <span className="flex items-center gap-1">
                      {p.aiRecommended ?
                      <StarIcon size={12} className="text-amber-500" fill="currentColor" /> :
                      null}
                      <span className="text-[10px] font-bold text-ink-500 dark:text-white/40">
                        {p.rank === null ? 'مسیر مستقل' : `رتبه ${faNum(p.rank)}`}
                      </span>
                    </span>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-xs font-bold leading-5 text-ink-900 dark:text-white/85">
                    {p.name}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-ink-500 dark:text-white/40">بودجه</p>
                      <p className="text-xs font-extrabold text-ink-900 dark:text-white/85">
                        {faShortBudget(p.budget)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-ink-500 dark:text-white/40">امتیاز</p>
                      <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {p.finalScore === null ? '—' : faNum(p.finalScore, 1)}
                      </p>
                    </div>
                  </div>
                </motion.button>);

            })}
          </div>
        </Card>
      </div>
    </div>);

}
