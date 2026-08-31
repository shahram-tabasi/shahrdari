/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React from 'react';
import { AlertTriangleIcon, ChevronLeftIcon } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { useData } from '../../contexts/DataContext';
import { faNum, faPercent, faShortBudget } from '../../utils/format';

export function CriticalProjects() {
  const { projects } = useData();
  const critical = [...projects]
    .filter((project) => project.risk >= 40 || project.deviation >= 18)
    .sort((left, right) => right.deviation - left.deviation);
  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader
        title="پروژه‌های بحرانی"
        subtitle="ریسک بالا یا انحراف بودجه بیش از ۱۸٪"
        icon={<AlertTriangleIcon size={17} />}
        action={
        <span className="rounded-lg bg-rose-500/12 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
            {faNum(critical.length)} مورد
          </span>
        } />
      
      <ul className="min-h-0 flex-1 space-y-3 overflow-auto px-6 pb-6 thin-scroll">
        {critical.map((p) =>
        <li key={p.id}>
            <button
            type="button"
            className="group w-full rounded-lg border border-navy-800/8 p-4 text-right transition hover:border-amber-500/60 hover:shadow-card dark:border-white/8 dark:hover:border-amber-400/50">
            
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold leading-5 text-ink-900 dark:text-white/85">
                  {p.name}
                </p>
                <ChevronLeftIcon
                size={16}
                className="mt-0.5 shrink-0 text-ink-300 transition group-hover:text-amber-500 rtl:rotate-0 ltr:rotate-180" />
              
              </div>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={p.status} />
                <span className="text-[10px] text-ink-500 dark:text-white/40">
                  {p.district} • {faShortBudget(p.budget)}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[10px] text-ink-500 dark:text-white/40">
                    انحراف بودجه
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-800/8 dark:bg-white/10">
                      <span
                      className="block h-full rounded-full bg-rose-500"
                      style={{ width: `${Math.min(p.deviation * 2.5, 100)}%` }} />
                    
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                      {faPercent(p.deviation)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-ink-500 dark:text-white/40">
                    ریسک اجرا
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-800/8 dark:bg-white/10">
                      <span
                      className="block h-full rounded-full bg-amber-500"
                      style={{ width: `${p.risk}%` }} />
                    
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {faPercent(p.risk)}
                    </span>
                  </dd>
                </div>
              </dl>
            </button>
          </li>
        )}
      </ul>
    </Card>);

}
