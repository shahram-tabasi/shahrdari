import React from 'react';
import { motion } from 'framer-motion';
import { faPercent } from '../../utils/format';

export function ConfidenceMeter({
  value,
  size = 152



}: {value: number;size?: number;}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-navy-800/10 dark:stroke-white/10" />
        
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FF8F00"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }} />
        
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-extrabold text-ink-900 dark:text-white/90">
          {faPercent(value)}
        </p>
        <p className="mt-0.5 text-[10px] text-ink-500 dark:text-white/45">
          اطمینان مدل
        </p>
      </div>
    </div>);

}