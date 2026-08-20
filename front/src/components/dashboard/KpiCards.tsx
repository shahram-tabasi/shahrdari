import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  LayersIcon,
  ScaleIcon,
  TrendingUpIcon,
  WalletIcon
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Sparkline } from '../ui/Sparkline';
import { useData } from '../../contexts/DataContext';
import { faNum, faPercent } from '../../utils/format';

function runningSeries(values: number[], mode: 'sum' | 'average'): number[] {
  return values.map((_, index) => {
    const segment = values.slice(0, index + 1);
    const total = segment.reduce((sum, value) => sum + value, 0);
    return mode === 'sum' ? total : total / segment.length;
  });
}

function changePercent(series: number[]): number {
  const current = series.at(-1) ?? 0;
  const previous = series.at(-2) ?? current;
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
}

export function KpiCards() {
  const { projects } = useData();
  const kpis = useMemo(() => {
    const ordered = [...projects].sort((left, right) => left.id.localeCompare(right.id));
    const projectTrend = ordered.map((_, index) => index + 1);
    const budgetTrend = runningSeries(ordered.map(project => project.budget), 'sum');
    const scoreTrend = runningSeries(ordered.map(project => project.score), 'average');
    const justiceTrend = runningSeries(ordered.map(project => project.justice), 'average');

    return [
      {
        id: 'projects',
        label: 'پروژه‌های موجود',
        value: faNum(projects.length),
        unit: 'پروژه',
        delta: changePercent(projectTrend),
        icon: LayersIcon,
        color: '#1A237E',
        trend: projectTrend
      },
      {
        id: 'budget',
        label: 'مجموع بودجه پروژه‌ها',
        value: faNum(budgetTrend.at(-1) ?? 0),
        unit: 'میلیارد تومان',
        delta: changePercent(budgetTrend),
        icon: WalletIcon,
        color: '#FF8F00',
        trend: budgetTrend
      },
      {
        id: 'value',
        label: 'میانگین امتیاز ارزش',
        value: faNum(scoreTrend.at(-1) ?? 0, 1),
        unit: 'از ۱۰۰',
        delta: changePercent(scoreTrend),
        icon: TrendingUpIcon,
        color: '#00A86B',
        trend: scoreTrend
      },
      {
        id: 'justice',
        label: 'میانگین ضریب عدالت',
        value: faNum(justiceTrend.at(-1) ?? 0, 2),
        unit: 'ضریب عدالت فضایی',
        delta: changePercent(justiceTrend),
        icon: ScaleIcon,
        color: '#8E24AA',
        trend: justiceTrend
      }
    ];
  }, [projects]);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, index) => {
        const up = kpi.delta >= 0;

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
          >
            <Card className="h-[120px] px-6 py-4">
              <div className="flex h-full items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: `${kpi.color}14`, color: kpi.color }}>
                      <kpi.icon size={15} />
                    </span>
                    <p className="truncate text-xs font-semibold text-ink-500 dark:text-white/50">{kpi.label}</p>
                  </div>
                  <p className="mt-2.5 text-3xl font-extrabold leading-none text-ink-900 dark:text-white/90">{kpi.value}</p>
                  <p className="mt-1.5 text-[10px] text-ink-300 dark:text-white/35">{kpi.unit}</p>
                </div>
                <div className="flex flex-col items-end justify-between self-stretch">
                  <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${up ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/12 text-rose-700 dark:text-rose-300'}`}>
                    {up ? <ArrowUpRightIcon size={13} /> : <ArrowDownRightIcon size={13} />}
                    {faPercent(Math.abs(kpi.delta), 1)}
                  </span>
                  <Sparkline data={kpi.trend} color={kpi.color} />
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
