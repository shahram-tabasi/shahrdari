/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React from 'react';
import { FingerprintIcon } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useData } from '../../contexts/DataContext';

export function AuditTrailPanel() {
  const { system: { auditTrail } } = useData();
  return (
    <Card>
      <CardHeader
        title="ردپای تصمیم (Audit Trail)"
        subtitle="هر تغییر در معیارها و وزن‌ها با نام کاربر، نقش و زمان ثبت می‌شود"
        icon={<FingerprintIcon size={17} />}
        action={<Badge tone="green">شفافیت کامل • غیرقابل حذف</Badge>} />
      
      <ul className="divide-y divide-navy-800/6 px-6 pb-4 dark:divide-white/6">
        {auditTrail.map((row) =>
        <li key={row.id} className="flex items-center gap-4 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-800/8 text-[10px] font-bold text-navy-800 dark:bg-white/10 dark:text-navy-100">
              {row.actor.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-ink-900 dark:text-white/85">
                {row.actor}
                <span className="ms-2 font-normal text-ink-500 dark:text-white/40">
                  {row.role}
                </span>
              </p>
              <p className="mt-0.5 truncate text-[11px] text-ink-500 dark:text-white/45">
                {row.action}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-ink-300 dark:text-white/30">
              {row.date} — {row.time}
            </span>
          </li>
        )}
      </ul>
    </Card>);

}
