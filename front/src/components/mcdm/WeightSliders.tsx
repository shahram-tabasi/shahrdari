import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcwIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useData } from '../../contexts/DataContext';
import type { CriterionKey } from '../../types';
import { faNum } from '../../utils/format';

interface Props {
  weights: Record<CriterionKey, number>;
  onChange: (key: CriterionKey, value: number) => void;
  onReset: () => void;
  onExpertMode: () => void;
}

export function WeightSliders({ weights, onChange, onReset, onExpertMode }: Props) {
  const { criteria } = useData();
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader
        title="وزن‌دهی معیارها"
        subtitle="مجموع وزن‌ها همیشه ۱۰۰ باقی می‌ماند؛ با افزایش یک معیار، بقیه به تناسب کاهش می‌یابند"
        icon={<SlidersHorizontalIcon size={17} />}
        action={
        <div className="flex items-center gap-2">
            <Badge tone={Math.round(total) === 100 ? 'green' : 'red'}>
              مجموع: {faNum(Math.round(total))}
            </Badge>
            <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-navy-800/10 px-3 py-2 text-[11px] font-semibold text-ink-700 transition hover:border-amber-500 hover:text-amber-600 dark:border-white/10 dark:text-white/60">
            
              <RotateCcwIcon size={13} />
              بازنشانی
            </button>
            <button
            type="button"
            onClick={onExpertMode}
            className="rounded-lg bg-navy-800 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-navy-700 dark:bg-navy-500">
            
              Expert Mode — ماتریس BWM
            </button>
          </div>
        } />
      

      <div className="grid gap-6 px-6 pb-6 md:grid-cols-2 xl:grid-cols-3">
        {criteria.map((c) => {
          const value = weights[c.key];
          return (
            <div key={c.key} className="rounded-lg bg-canvas p-4 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-ink-900 dark:text-white/85">
                    {c.label}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-ink-500 dark:text-white/40">
                    {c.hint}
                  </p>
                </div>
                <motion.span
                  key={Math.round(value)}
                  initial={{ scale: 1.25, color: '#FF8F00' }}
                  animate={{ scale: 1 }}
                  className="shrink-0 text-lg font-extrabold text-ink-900 dark:text-white/85">
                  
                  {faNum(Math.round(value))}
                </motion.span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={Math.round(value)}
                onChange={(e) => onChange(c.key, Number(e.target.value))}
                aria-label={`وزن ${c.label}`}
                className="mt-4 w-full" />
              
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-800/8 dark:bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-navy-800 dark:bg-navy-300"
                  animate={{ width: `${value / 60 * 100}%` }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }} />
                
              </div>
            </div>);

        })}
      </div>
    </Card>);

}
