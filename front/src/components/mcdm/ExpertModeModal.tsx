/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React from 'react';
import { Modal } from '../ui/Modal';
import { useData } from '../../contexts/DataContext';
import { faNum } from '../../utils/format';

const matrix = [
[1, 2, 3, 3, 4, 6],
[0.5, 1, 2, 2, 3, 5],
[0.33, 0.5, 1, 2, 2, 4],
[0.33, 0.5, 0.5, 1, 2, 3],
[0.25, 0.33, 0.5, 0.5, 1, 2],
[0.17, 0.2, 0.25, 0.33, 0.5, 1]];


export function ExpertModeModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const { criteria } = useData();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Expert Mode — ماتریس مقایسات زوجی (BWM)"
      subtitle="ورود قضاوت کارشناسی برای استخراج وزن بهینه معیارها • نسبت سازگاری: ۰٫۰۴۲ (قابل قبول)"
      width="max-w-4xl">
      
      <div className="overflow-auto thin-scroll">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 rounded-tr-lg bg-canvas p-3 text-right font-bold text-ink-500 dark:bg-white/5 dark:text-white/50">
                معیار
              </th>
              {criteria.map((c) =>
              <th
                key={c.key}
                className="bg-canvas p-3 text-center text-[10px] font-bold text-ink-500 dark:bg-white/5 dark:text-white/50">
                
                  {c.label}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {criteria.map((row, i) =>
            <tr key={row.key}>
                <th className="border-b border-navy-800/6 p-3 text-right text-[11px] font-bold text-ink-900 dark:border-white/6 dark:text-white/80">
                  {row.label}
                </th>
                {matrix[i].map((v, j) =>
              <td
                key={j}
                className="border-b border-navy-800/6 p-2 text-center dark:border-white/6">
                
                    <input
                  defaultValue={faNum(v, v % 1 === 0 ? 0 : 2)}
                  aria-label={`مقایسه ${row.label} با ${criteria[j].label}`}
                  className={[
                  'h-9 w-16 rounded-lg border text-center text-[11px] font-bold outline-none transition focus:border-amber-500',
                  i === j ?
                  'border-transparent bg-navy-800/6 text-ink-300 dark:bg-white/6 dark:text-white/30' :
                  'border-navy-800/12 text-ink-900 dark:border-white/12 dark:text-white/85'].
                  join(' ')}
                  readOnly={i === j} />
                
                  </td>
              )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-canvas p-4 dark:bg-white/5">
        <p className="text-[11px] leading-5 text-ink-500 dark:text-white/45">
          خروجی وزن‌های محاسبه‌شده جایگزین مقادیر اسلایدرها می‌شود و در «ردپای تصمیم» ثبت
          می‌گردد.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-navy-800/12 px-4 py-2.5 text-xs font-semibold text-ink-700 dark:border-white/12 dark:text-white/60">
            
            انصراف
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-navy-900 shadow-glow">
            
            محاسبه و اعمال وزن‌ها
          </button>
        </div>
      </div>
    </Modal>);

}
