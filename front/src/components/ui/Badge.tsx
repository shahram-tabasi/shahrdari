import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { ProjectStatus } from '../../types';

type Tone = 'navy' | 'amber' | 'green' | 'red' | 'neutral' | 'violet';

const tones: Record<Tone, string> = {
  navy: 'bg-navy-800/10 text-navy-800 dark:bg-navy-300/15 dark:text-navy-100',
  amber: 'bg-amber-500/12 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400',
  green: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  red: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  violet: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  neutral: 'bg-ink-500/10 text-ink-700 dark:bg-white/10 dark:text-white/60'
};

export function Badge({
  children,
  tone = 'neutral',
  className




}: {children: React.ReactNode;tone?: Tone;className?: string;}) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}

const statusTone: Record<ProjectStatus, Tone> = {
  'در حال اجرا': 'navy',
  'تایید شده': 'green',
  'مطالعه': 'violet',
  'متوقف': 'red'
};

export function StatusBadge({ status }: {status: ProjectStatus;}) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}