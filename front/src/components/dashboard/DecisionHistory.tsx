import React from 'react';
import { HistoryIcon } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { useData } from '../../contexts/DataContext';

export function DecisionHistory() {
  const { system: { decisionHistory } } = useData();
  return (
    <Card>
      <CardHeader
        title="تاریخچه تصمیمات"
        subtitle="سابقه اولویت‌بندی‌های انجام‌شده برای تکرارپذیری و پاسخ‌گویی"
        icon={<HistoryIcon size={17} />} />
      
      <ol className="grid gap-6 px-6 pb-6 md:grid-cols-4">
        {decisionHistory.map((h, i) =>
        <li key={h.id} className="relative ps-5">
            <span className="absolute top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ltr:left-0 rtl:right-0" />
            {i < decisionHistory.length - 1 ?
          <span className="absolute top-4 bottom-0 w-px bg-navy-800/10 ltr:left-1 rtl:right-1 dark:bg-white/10" /> :
          null}
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {h.date}
            </p>
            <p className="mt-1.5 text-xs font-bold text-ink-900 dark:text-white/85">
              {h.title}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-white/45">
              {h.detail}
            </p>
          </li>
        )}
      </ol>
    </Card>);

}
