import React from 'react';
import { motion } from 'framer-motion';
import { faNum, faPercent } from '../../utils/format';

interface Props {
  used: number;
  total: number;
}

export function BudgetDonut({ used, total }: Props) {
  const size = 190;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(used / (total || 1), 1);
  const remaining = Math.max(total - used, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-navy-800/8 dark:stroke-white/8" />
          
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ratio > 0.92 ? '#E53935' : '#FF8F00'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: c * (1 - ratio) }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
          
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <p className="text-[10px] text-ink-500 dark:text-white/45">
            مصرف بودجه
          </p>
          <p className="text-2xl font-extrabold text-ink-900 dark:text-white/90">
            {faPercent(ratio * 100)}
          </p>
          <p className="mt-1 text-[10px] text-ink-500 dark:text-white/45">
            باقیمانده {faNum(remaining)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-canvas px-3 py-2.5 dark:bg-white/5">
          <p className="text-[10px] text-ink-500 dark:text-white/45">تخصیص‌یافته</p>
          <p className="mt-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
            {faNum(used)}
          </p>
        </div>
        <div className="rounded-lg bg-canvas px-3 py-2.5 dark:bg-white/5">
          <p className="text-[10px] text-ink-500 dark:text-white/45">سقف بودجه</p>
          <p className="mt-1 text-xs font-extrabold text-ink-900 dark:text-white/85">
            {faNum(total)}
          </p>
        </div>
      </div>
    </div>);

}