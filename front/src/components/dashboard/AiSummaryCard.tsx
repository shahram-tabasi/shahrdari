import React, { useState } from 'react';
import { RefreshCwIcon, SparklesIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { chatWithAi } from '../../services/api';

export function AiSummaryCard() {
  const [state, setState] = useState<'idle' | 'thinking' | 'done'>('idle');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setState('thinking');
    setError(null);

    try {
      const result = await chatWithAi(
        'با استفاده از تمام داده‌های فعلی سامانه، وضعیت سبد پروژه‌ها، بودجه، ریسک، عدالت فضایی و مهم‌ترین اقدامات پیشنهادی را به فارسی و با اعداد دقیق تحلیل کن.'
      );
      setSummary(result.response.output);
      setState('done');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تحلیل هوشمند ناموفق بود.');
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
            <h2 className="text-sm font-extrabold">تحلیل هوشمند سبد</h2>
            <p className="mt-0.5 text-[11px] text-white/50">
              تحلیل زنده بر اساس تمام داده‌های پروژه‌ها، معیارها، محله‌ها و سوابق سامانه
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="amber" className="bg-amber-500/20 text-amber-300">OpenAI</Badge>
          <button
            type="button"
            onClick={() => void run()}
            disabled={state === 'thinking'}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-navy-900 shadow-glow transition hover:bg-amber-400 disabled:opacity-70"
          >
            {state === 'thinking'
              ? <RefreshCwIcon size={15} className="animate-spin" />
              : <SparklesIcon size={15} />}
            {state === 'thinking' ? 'در حال تحلیل…' : state === 'done' ? 'تحلیل مجدد' : 'تولید تحلیل هوشمند'}
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
          <p className="whitespace-pre-wrap rounded-lg bg-white/6 px-5 py-5 text-xs leading-7 text-white/80">
            {summary}
          </p>
        ) : (
          <p className="rounded-lg border border-dashed border-white/15 px-5 py-6 text-xs leading-6 text-white/45">
            برای دریافت تحلیل زنده مبتنی بر تمام داده‌های بکند، دکمه تولید تحلیل هوشمند را بزنید.
          </p>
        )}
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </div>
    </Card>
  );
}
