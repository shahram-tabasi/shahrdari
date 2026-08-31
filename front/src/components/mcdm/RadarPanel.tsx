/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip } from
'recharts';
import { useData } from '../../contexts/DataContext';
import type { Project } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { faNum } from '../../utils/format';

interface Props {
  /**
   * The project to plot. Optional on purpose: callers render this panel inside
   * a report or a comparison view whose ranking may not have been fetched yet,
   * and an unfinished fetch must show an empty state rather than crash.
   */
  primary?: Project | null;
  compare?: Project | null;
  height?: number;
}

export function RadarPanel({ primary, compare, height = 320 }: Props) {
  const { criteria } = useData();
  const { t, theme } = useApp();
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(26,35,126,0.12)';
  const axis = theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#3A4066';

  // Nothing to plot yet — the caller's ranking has not arrived.
  if (!primary) {
    return (
      <div
        style={{ height }}
        className="grid place-items-center rounded-xl border border-dashed border-navy-800/12 text-xs text-ink-500 dark:border-white/12 dark:text-white/50"
      >
        {t('هنوز پروژه‌ای برای نمایش انتخاب نشده است.', 'No project selected yet.')}
      </div>
    );
  }

  // A criterion the project carries no score for plots as zero rather than as
  // a gap in the polygon.
  const data = criteria.map((c) => ({
    criterion: c.label,
    primary: primary.scores[c.key] ?? 0,
    compare: compare ? compare.scores[c.key] ?? 0 : undefined
  }));

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={grid} />
            <PolarAngleAxis
              dataKey="criterion"
              tick={{ fontSize: 11, fill: axis }} />
            
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: axis }}
              tickFormatter={(v) => faNum(v)}
              stroke={grid} />
            
            <Radar
              name={primary.name}
              dataKey="primary"
              stroke="#1A237E"
              fill="#1A237E"
              fillOpacity={0.28}
              strokeWidth={2} />
            
            {compare ?
            <Radar
              name={compare.name}
              dataKey="compare"
              stroke="#FF8F00"
              fill="#FF8F00"
              fillOpacity={0.24}
              strokeWidth={2} /> :

            null}
            <Tooltip
              formatter={(v: number) => faNum(v)}
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                fontSize: 11,
                boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
                backgroundColor: theme === 'dark' ? '#2A2E38' : '#fff',
                color: theme === 'dark' ? '#fff' : '#0F1535'
              }} />
            
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-semibold">
        <span className="flex items-center gap-2 text-ink-700 dark:text-white/70">
          <span className="h-2.5 w-2.5 rounded-full bg-navy-800 dark:bg-navy-300" />
          {primary.name}
        </span>
        {compare ?
        <span className="flex items-center gap-2 text-ink-700 dark:text-white/70">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            {compare.name}
          </span> :
        null}
      </div>
    </div>);

}
