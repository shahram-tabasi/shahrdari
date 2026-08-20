import React from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis } from
'recharts';
import { InfoIcon } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useData } from '../../contexts/DataContext';
import { useApp } from '../../contexts/AppContext';
import { faBudget, faNum } from '../../utils/format';

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="w-56 rounded-xl border border-navy-800/10 bg-surface p-4 shadow-lift dark:border-white/10 dark:bg-night-600">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-ink-500 dark:text-white/45">
          رتبه {faNum(p.rank)}
        </span>
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: `${p.categoryColor}1F`,
            color: p.categoryColor
          }}>
          
          {p.category}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-ink-900 dark:text-white/90">
        {p.name}
      </p>
      <dl className="mt-3 space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-white/45">هزینه</dt>
          <dd className="font-bold text-ink-900 dark:text-white/85">
            {faBudget(p.budget)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-white/45">امتیاز ارزش</dt>
          <dd className="font-bold text-ink-900 dark:text-white/85">
            {faNum(p.score)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500 dark:text-white/45">ضریب عدالت</dt>
          <dd className="font-bold text-ink-900 dark:text-white/85">
            {faNum(p.justice, 2)}
          </dd>
        </div>
      </dl>
    </div>);

}

export function ValueScatter() {
  const { theme } = useApp();
  const { projects, categoryColors } = useData();
  const ranked = [...projects]
    .sort((left, right) => right.score - left.score)
    .map((project, index) => ({
      ...project,
      rank: index + 1,
      categoryColor: categoryColors[project.category]
    }));
  const grid = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(26,35,126,0.08)';
  const axis = theme === 'dark' ? 'rgba(255,255,255,0.45)' : '#6B7290';

  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader
        title="نمودار تحلیل ارزش — هزینه"
        subtitle="هر دایره یک پروژه است؛ اندازه دایره بیانگر ضریب عدالت آن است"
        icon={<InfoIcon size={17} />}
        action={
        <div className="flex flex-wrap items-center justify-end gap-2">
            {Object.entries(categoryColors).map(([label, color]) =>
          <span
            key={label}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-500 dark:text-white/45">
            
                <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }} />
            
                {label}
              </span>
          )}
          </div>
        } />
      
      <div className="min-h-0 flex-1 px-4 pb-5">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid stroke={grid} strokeDasharray="4 4" />
            <XAxis
              type="number"
              dataKey="budget"
              name="هزینه"
              tick={{ fontSize: 11, fill: axis }}
              tickFormatter={(v) => faNum(v)}
              stroke={grid}
              label={{
                value: 'هزینه (میلیارد تومان)',
                position: 'insideBottom',
                offset: -16,
                fontSize: 11,
                fill: axis
              }} />
            
            <YAxis
              type="number"
              dataKey="score"
              name="ارزش"
              domain={[40, 100]}
              tick={{ fontSize: 11, fill: axis }}
              tickFormatter={(v) => faNum(v)}
              stroke={grid}
              orientation="right"
              label={{
                value: 'امتیاز ارزش',
                angle: -90,
                position: 'insideLeft',
                fontSize: 11,
                fill: axis
              }} />
            
            <ZAxis type="number" dataKey="justice" range={[90, 420]} />
            <Tooltip content={<ScatterTooltip />} />
            {Object.keys(categoryColors).map((cat) =>
            <Scatter
              key={cat}
              name={cat}
              data={ranked.filter((p) => p.category === cat)}
              fill={categoryColors[cat]}
              fillOpacity={0.78}
              stroke={categoryColors[cat]}
              strokeWidth={1.5} />

            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 border-t border-navy-800/8 px-6 py-3 dark:border-white/8">
        <Badge tone="amber">ناحیه طلایی</Badge>
        <p className="text-[11px] text-ink-500 dark:text-white/45">
          پروژه‌های بالا-چپ: ارزش بالا با هزینه کم — اولویت تخصیص بودجه
        </p>
      </div>
    </Card>);

}
