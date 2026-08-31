/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { RefreshCwIcon, SparklesIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useApp } from '../../contexts/AppContext';
import { getAiStatus, runAiTask } from '../../services/api';
import type { AiStatus } from '../../types';

export function AiSummaryCard() {
  const { t } = useApp();
  const [state, setState] = useState<'idle' | 'thinking' | 'done'>('idle');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  /**
   * The model's answer is a suggestion pending expert review, and the UI has
   * to say so: every language-model output is a suggestion, never a finding.
   */
  const [notice, setNotice] = useState<string | null>(null);
  /**
   * Which model is configured, asked of the backend rather than hardcoded.
   *
   * The model is a swappable, self-hosted or hosted OpenAI-compatible
   * endpoint chosen in `LLM_BASE_URL`/`LLM_MODEL`, so naming a vendor in the
   * UI would be wrong the moment the municipality points it elsewhere. When no
   * model is configured the badge says so, which is the honest state: the
   * decision engines keep working without one.
   */
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    // A failure here only means the badge stays neutral; it must not break
    // the dashboard.
    void getAiStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const run = async () => {
    setState('thinking');
    setError(null);

    try {
      const result = await runAiTask({
        // `explainResult` is one of the tasks the directive permits: the model
        // explains the engine's output, it does not produce the ranking.
        task: 'explainResult',
        message:
          'نتیجه رتبه‌بندی و وضعیت سبد پروژه‌ها را برای مدیران به زبان ساده توضیح بده: چه چیزی رتبه‌ها را تعیین کرده، کجا محدودیت‌ها اثر گذاشته‌اند و کدام موارد نیازمند توجه هستند.'
      });

      setSummary(result.output);
      setNotice(result.notice ?? null);
      setState('done');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t('تحلیل هوشمند ناموفق بود.', 'The assisted analysis failed.')
      );
      setState('idle');
    }
  };

  return (
    <Card className="overflow-hidden bg-navy-800 text-white dark:bg-night-700">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500 text-navy-900">
            <SparklesIcon size={19} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold">
              {t('تحلیل هوشمند سبد', 'Assisted portfolio analysis')}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/50">
              {t(
                'تحلیل زنده بر اساس داده‌های پروژه‌ها، معیارها، محله‌ها و سوابق سامانه',
                'Live analysis over the project, criteria, neighbourhood and history data'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="amber" className="bg-amber-500/20 text-amber-300">
            {status?.available
              ? status.model ?? t('مدل زبانی', 'Language model')
              : t('مدل زبانی پیکربندی نشده', 'No model configured')}
          </Badge>
          <button
            type="button"
            onClick={() => void run()}
            disabled={state === 'thinking'}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-navy-900 shadow-glow transition hover:bg-amber-400 disabled:opacity-70"
          >
            {state === 'thinking'
              ? <RefreshCwIcon size={15} className="animate-spin" />
              : <SparklesIcon size={15} />}
            {state === 'thinking'
              ? t('در حال تحلیل…', 'Analysing…')
              : state === 'done'
              ? t('تحلیل مجدد', 'Analyse again')
              : t('تولید تحلیل هوشمند', 'Generate analysis')}
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        {state === 'thinking' ? (
          <div className="space-y-3 rounded-lg bg-white/5 px-5 py-6">
            {[100, 92, 78].map(width => (
              <div key={width} className="h-3 animate-pulse rounded-full bg-white/12" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : summary ? (
          <div className="space-y-2">
            <p className="whitespace-pre-wrap rounded-lg bg-white/6 px-5 py-5 text-xs leading-7 text-white/80">
              {summary}
            </p>
            {notice ? (
              <p className="rounded-lg bg-amber-400/12 px-4 py-2.5 text-[11px] leading-6 text-amber-200">
                {notice}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/15 px-5 py-6 text-xs leading-6 text-white/45">
            {status && !status.available
              ? status.degradedMode
              : t(
                  'برای دریافت تحلیل زنده بر پایه داده‌های سامانه، دکمه تولید تحلیل هوشمند را بزنید.',
                  'Press “Generate analysis” for a live explanation based on the system’s data.'
                )}
          </p>
        )}
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </div>
    </Card>
  );
}
