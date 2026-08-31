import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuitIcon,
  CheckCircle2Icon,
  CpuIcon,
  FileTextIcon,
  LeafIcon,
  RouteIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TagIcon,
  UploadCloudIcon } from
'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfidenceMeter } from '../components/intake/ConfidenceMeter';
import { faNum, faPercent } from '../utils/format';
import { runAiTask } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const SAMPLE = `احداث تقاطع غیرهمسطح در محل برخورد بلوار جمهوری و خیابان شهید کامیاب با هدف کاهش گره ترافیکی ورودی شرقی شهر کرمان. حجم تردد روزانه بیش از ۸۰ هزار سفر برآورد شده و طبق مطالعات مهندسی ترافیک، تاخیر متوسط در ساعات اوج ۴.۲ دقیقه است. پروژه شامل تملک ۱٬۲۰۰ مترمربع، جابجایی تاسیسات آب و برق و اجرای دو رمپ دسترسی است. مدت اجرا ۲۴ ماه و اعتبار پیش‌بینی‌شده ۹۴۰ میلیارد تومان از محل اوراق مشارکت شهرداری. ملاحظات پدافند غیرعامل و مسیر امداد بیمارستان باهنر لحاظ شده است.`;

const tags = [
{ label: '#ترافیک_شهری', tone: 'navy' as const, weight: 0.94 },
{ label: '#منطقه_۲', tone: 'violet' as const, weight: 0.99 },
{ label: '#پدافند_غیرعامل', tone: 'amber' as const, weight: 0.71 },
{ label: '#تملک_املاک', tone: 'red' as const, weight: 0.83 },
{ label: '#اوراق_مشارکت', tone: 'green' as const, weight: 0.88 },
{ label: '#مسیر_امداد', tone: 'navy' as const, weight: 0.65 }];


const extracted = [
{ label: 'برآورد اعتبار', value: '۹۴۰ میلیارد تومان' },
{ label: 'مدت اجرا', value: '۲۴ ماه' },
{ label: 'جمعیت بهره‌مند', value: '۸۰٬۰۰۰ سفر روزانه' },
{ label: 'دسته‌بندی پروژه', value: 'حمل‌ونقل و ترافیک' },
{ label: 'ریسک شناسایی‌شده', value: 'تملک و جابجایی تاسیسات' }];


const goals = [
{ id: 'mobility', label: 'شهر روان', icon: RouteIcon, matched: true },
{ id: 'resilient', label: 'شهر تاب‌آور', icon: ShieldCheckIcon, matched: true },
{ id: 'smart', label: 'شهر هوشمند', icon: CpuIcon, matched: true },
{ id: 'green', label: 'شهر سبز', icon: LeafIcon, matched: false },
{ id: 'equity', label: 'شهر عادلانه', icon: ScaleIcon, matched: false }];


export function SmartIntake() {
  const [text, setText] = useState(SAMPLE);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState<string | null>(null);
  /** The pending-review notice that must accompany every model output. */
  const [notice, setNotice] = useState<string | null>(null);

  const analyze = async () => {
    setPhase('loading');
    setError(null);

    try {
      const result = await runAiTask({
        // «شناسایی تعارض یا نقص در شناسنامه پروژه» — the model flags what is
        // missing or contradictory. It does not score the project and does not
        // fill in the gaps it finds; both are forbidden without human approval.
        task: 'detectConflicts',
        message: `شرح پروژه زیر را بررسی کن و اطلاعات کلیدی، نواقص شناسنامه، تعارض‌ها و ریسک‌های آن را فهرست کن. برای هیچ داده مفقودی مقدار حدس نزن؛ فقط مشخص کن چه چیزی ثبت نشده است:\n\n${text}`
      });

      setAnalysis(result.output);
      setNotice(result.notice ?? null);
      setPhase('done');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تحلیل پروژه ناموفق بود.');
      setPhase('idle');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_600px]">
      {/* ——— Input panel (60%) ——— */}
      <Card className="flex flex-col">
        <CardHeader
          title="شرح پروژه را وارد کنید"
          subtitle="متن پیشنهاد پروژه، مصوبه شورا یا گزارش کارشناسی را بچسبانید یا فایل را رها کنید"
          icon={<FileTextIcon size={17} />}
          action={<Badge tone="green">اتصال LLM فعال</Badge>} />
        

        <div className="px-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            className={[
            'relative rounded-xl border-2 border-dashed transition',
            dragging ?
            'border-amber-500 bg-amber-500/5' :
            'border-navy-800/12 dark:border-white/12'].
            join(' ')}>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              aria-label="شرح پروژه"
              className="thin-scroll w-full resize-none rounded-xl bg-transparent p-6 text-sm leading-8 text-ink-900 outline-none placeholder:text-ink-300 dark:text-white/85"
              placeholder="مثال: احداث پارک محله‌ای در محله سرآسیاب با اعتبار ۲۲۰ میلیارد تومان…" />
            
            <div className="flex items-center justify-between gap-4 border-t border-navy-800/8 px-6 py-3 dark:border-white/8">
              <button
                type="button"
                className="flex items-center gap-2 text-[11px] font-semibold text-ink-500 transition hover:text-amber-600 dark:text-white/45">
                
                <UploadCloudIcon size={15} />
                بارگذاری فایل (PDF / Word / Excel) — یا Drag & Drop
              </button>
              <span className="text-[11px] text-ink-300 dark:text-white/30">
                {faNum(text.length)} کاراکتر
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={phase === 'loading'}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-amber-500 py-4 text-sm font-extrabold text-navy-900 shadow-glow transition hover:bg-amber-400 disabled:opacity-70">
            
            <SparklesIcon
              size={18}
              className={phase === 'loading' ? 'animate-spin' : ''} />
            
            {phase === 'loading' ? 'در حال تحلیل هوشمند متن…' : 'تحلیل هوشمند'}
          </button>
          {error ? <p className="mt-3 text-center text-xs text-rose-600">{error}</p> : null}
          <p className="mt-3 text-center text-[11px] text-ink-500 dark:text-white/40">
            مدل زبانی، شاخص‌ها و ریسک‌های پروژه را استخراج و امتیاز اولیه معیارها را
            پیشنهاد می‌دهد.
          </p>
        </div>
      </Card>

      {/* ——— AI extraction panel (40%) ——— */}
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="پنل استخراج هوش مصنوعی"
            subtitle="شاخص‌ها و تگ‌های شناسایی‌شده از متن"
            icon={<BrainCircuitIcon size={17} />} />
          
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {phase !== 'done' ?
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3">
                
                  {[100, 88, 94, 72, 80].map((w, i) =>
                <div
                  key={i}
                  className={[
                  'h-8 rounded-lg bg-navy-800/6 dark:bg-white/6',
                  phase === 'loading' ? 'animate-pulse' : ''].
                  join(' ')}
                  style={{ width: `${w}%` }} />

                )}
                  <p className="pt-2 text-[11px] text-ink-500 dark:text-white/40">
                    {phase === 'loading' ?
                  'استخراج موجودیت‌ها و تطبیق با معیارهای MCDM…' :
                  'در انتظار اجرای تحلیل.'}
                  </p>
                </motion.div> :

              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6">
                  <div className="rounded-lg bg-canvas p-4 dark:bg-white/5">
                    <MarkdownRenderer content={analysis} />
                    {notice ? (
                      <p className="mt-3 rounded-lg bg-amber-500/10 px-4 py-2.5 text-[11px] leading-6 text-amber-700 dark:text-amber-400">
                        {notice}
                      </p>
                    ) : null}
                  </div>
                
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 space-y-2.5">
                      {extracted.map((row) =>
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3.5 py-2.5 dark:bg-white/5">
                      
                          <span className="text-[11px] text-ink-500 dark:text-white/45">
                            {row.label}
                          </span>
                          <span className="text-[11px] font-bold text-ink-900 dark:text-white/85">
                            {row.value}
                          </span>
                        </div>
                    )}
                    </div>
                    <ConfidenceMeter value={92} />
                  </div>

                  <div>
                    <p className="mb-2.5 flex items-center gap-2 text-xs font-bold text-ink-900 dark:text-white/85">
                      <TagIcon size={15} className="text-amber-500" />
                      تگ‌های استخراج‌شده
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) =>
                    <motion.span
                      key={tag.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}>
                      
                          <Badge tone={tag.tone}>
                            {tag.label}
                            <span className="opacity-60">
                              {faPercent(tag.weight * 100)}
                            </span>
                          </Badge>
                        </motion.span>
                    )}
                    </div>
                  </div>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="انطباق استراتژیک"
            subtitle="همسویی با اهداف برنامه ۵ ساله شهرداری کرمان"
            icon={<ScaleIcon size={17} />}
            action={
            phase === 'done' ?
            <Badge tone="amber">۳ از ۵ هدف</Badge> :

            <Badge tone="neutral">در انتظار تحلیل</Badge>

            } />
          
          <div className="grid grid-cols-5 gap-3 px-6 pb-6">
            {goals.map((goal, i) => {
              const on = phase === 'done' && goal.matched;
              return (
                <motion.div
                  key={goal.id}
                  animate={
                  on ? { scale: [0.94, 1.04, 1] } : { scale: 1 }
                  }
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className={[
                  'flex flex-col items-center gap-2 rounded-lg border px-2 py-4 text-center transition',
                  on ?
                  'border-amber-500 bg-amber-500/8 text-amber-600 dark:text-amber-400' :
                  'border-navy-800/8 text-ink-300 dark:border-white/8 dark:text-white/25'].
                  join(' ')}>
                  
                  <goal.icon size={22} />
                  <span className="text-[10px] font-bold leading-4">{goal.label}</span>
                  {on ? <CheckCircle2Icon size={13} /> : null}
                </motion.div>);

            })}
          </div>
        </Card>
      </div>
    </div>);

}
