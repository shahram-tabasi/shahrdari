import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileSpreadsheetIcon,
  FileTextIcon,
  PresentationIcon,
  SendIcon,
  SettingsIcon,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { RadarPanel } from '../components/mcdm/RadarPanel';
import { useData } from '../contexts/DataContext';
import type { CriterionKey } from '../types';
import { rankProjects } from '../utils/scoring';
import { faNum, faShortBudget } from '../utils/format';
import { chatWithAi, exportReport } from '../services/api';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

const sections = [
  { id: 'summary', label: 'خلاصه مدیریتی', hint: 'یک پاراگراف جمع‌بندی' },
  { id: 'table', label: 'جدول رتبه‌بندی MCDM', hint: '۱۰ پروژه نخست' },
  { id: 'radar', label: 'نمودار راداری پروژه برتر', hint: 'شش معیار اصلی' },
  { id: 'ai', label: 'تحلیل هوش مصنوعی', hint: 'تفسیر متنی سبد' },
  { id: 'justice', label: 'شاخص عدالت فضایی', hint: 'توزیع محله‌ای' },
  { id: 'audit', label: 'ردپای تصمیم', hint: 'تاریخچه تغییر وزن‌ها' },
];

const exportButtons = [
  { label: 'PDF', icon: FileTextIcon, color: '#E53935', hint: 'گزارش رسمی A۴' },
  { label: 'Excel', icon: FileSpreadsheetIcon, color: '#00A86B', hint: 'داده خام و امتیازها' },
  { label: 'PowerPoint', icon: PresentationIcon, color: '#FF8F00', hint: 'ارائه شورای شهر' },
];

export function ReportingCenter() {
  const { criteria, projects, neighborhoods, system } = useData();
  const ranked = useMemo(() => {
    const weights = criteria.reduce(
      (acc, criterion) => ({ ...acc, [criterion.key]: criterion.weight }),
      {} as Record<CriterionKey, number>
    );
    return rankProjects(projects, weights);
  }, [criteria, projects]);

  const totalBudget = useMemo(
    () => projects.reduce((sum, project) => sum + project.budget, 0),
    [projects]
  );

  const deprivedNeighborhoods = useMemo(
    () => neighborhoods.filter((neighborhood) => neighborhood.deprivation >= 0.6),
    [neighborhoods]
  );

  const [enabled, setEnabled] = useState<string[]>([
    'summary',
    'table',
    'radar',
    'ai',
  ]);
  const [sent, setSent] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null); // <-- اضافه شد
  const [exportLoading, setExportLoading] = useState<string | null>(null); // <-- فقط یک بار تعریف شد

  const on = (id: string) => enabled.includes(id);

  const handleExport = async (type: 'pdf' | 'excel' | 'pptx') => {
    try {
      setExportLoading(type);
      const payload = {
        title: 'Smart-VAP Municipality Report',
        projects,
        ranking: ranked,
        criteria,
        neighborhoods,
        audit: system.auditTrail,
        aiAnalysis,
        enabledSections: enabled,
      };
      await exportReport(type, payload);
    } catch (error) {
      console.error('Export error:', error);
      alert('خطا در ساخت فایل خروجی');
    } finally {
      setExportLoading(null);
    }
  };

  const generateReportAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await chatWithAi(
        'برای گزارش رسمی مدیریت، با استفاده از تمام داده‌های فعلی سامانه یک تحلیل دقیق از رتبه‌بندی، بودجه، ریسک و عدالت فضایی سبد پروژه‌ها تهیه کن. پاسخ فارسی، مستند به اعداد و مناسب درج مستقیم در گزارش باشد.'
      );
      setAiAnalysis(result.response.output);
    } catch (requestError) {
      setAiError(
        requestError instanceof Error ? requestError.message : 'تولید تحلیل گزارش ناموفق بود.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      {/* ——— تنظیمات گزارش ——— */}
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="تنظیمات گزارش"
            subtitle="بخش‌های مورد نظر برای درج در سند رسمی"
            icon={<SettingsIcon size={17} />}
          />
          <ul className="space-y-2.5 px-6 pb-6">
            {sections.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-navy-800/8 p-3.5 transition hover:border-amber-500/60 dark:border-white/8">
                  <input
                    type="checkbox"
                    checked={on(s.id)}
                    onChange={() =>
                      setEnabled((prev) =>
                        prev.includes(s.id)
                          ? prev.filter((x) => x !== s.id)
                          : [...prev, s.id]
                      )
                    }
                    className="mt-0.5 h-4 w-4 accent-[#FF8F00]"
                  />
                  <span>
                    <span className="block text-xs font-bold text-ink-900 dark:text-white/85">
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-ink-500 dark:text-white/40">
                      {s.hint}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="خروجی‌ها" subtitle="فرمت مورد نیاز را انتخاب کنید" />
          <div className="space-y-3 px-6 pb-6">
            {exportButtons.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() =>
                  handleExport(
                    b.label === 'PDF' ? 'pdf' : b.label === 'Excel' ? 'excel' : 'pptx'
                  )
                }
                disabled={exportLoading !== null}
                className="flex w-full items-center gap-3 rounded-xl border border-navy-800/8 p-4 text-right transition hover:shadow-card dark:border-white/8"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                  style={{
                    backgroundColor: `${b.color}1A`,
                    color: b.color,
                  }}
                >
                  <b.icon size={20} />
                </span>
                <span>
                  <span className="block text-xs font-extrabold text-ink-900 dark:text-white/85">
                    خروجی {b.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-ink-500 dark:text-white/40">
                    {exportLoading !== null ? 'در حال ساخت فایل...' : b.hint}
                  </span>
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSent(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-navy-800 py-4 text-xs font-extrabold text-white transition hover:bg-navy-700 dark:bg-navy-500"
            >
              <SendIcon size={17} />
              {sent ? 'ارسال شد — در انتظار تایید شهردار' : 'ارسال مستقیم به کارتابل شهردار'}
            </button>
            {sent && (
              <p className="text-center text-[10px] text-emerald-600 dark:text-emerald-400">
                شماره پیگیری: {faNum(140405120871)}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ——— پیش‌نمایش A4 ——— */}
      <Card className="p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-ink-900 dark:text-white/90">
              پیش‌نمایش زنده سند
            </h2>
            <p className="mt-1 text-xs text-ink-500 dark:text-white/45">
              قالب A۴ • شهرداری کرمان • سامانه Smart-VAP
            </p>
          </div>
          <Badge tone="amber">{faNum(enabled.length)} بخش فعال</Badge>
        </div>

        <div className="mx-auto w-full max-w-[760px] rounded-lg bg-white p-10 shadow-lift ring-1 ring-navy-800/5">
          {/* سرصفحه سند */}
          <div className="flex items-start justify-between border-b-2 border-[#1A237E] pb-5">
            <div>
              <p className="text-[13px] font-extrabold text-[#1A237E]">
                گزارش اولویت‌بندی پروژه‌های عمرانی
              </p>
              <p className="mt-1 text-[10px] text-ink-500">
                دوره مالی ۱۴۰۴ • معاونت فنی و عمرانی شهرداری کرمان
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-ink-700">۱۴۰۴/۰۵/۱۲</p>
              <p className="text-[9px] text-ink-500">شماره: ع/۱۴۰۴/۸۷۱</p>
            </div>
          </div>

          {on('summary') && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-[11px] font-extrabold text-[#1A237E]">
                ۱. خلاصه مدیریتی
              </h3>
              <p className="mt-2 text-[10px] leading-6 text-ink-700">
                بر پایه داده‌های جاری بکند، {faNum(projects.length)} پروژه با بودجه مجموع{' '}
                {faShortBudget(totalBudget)} ارزیابی شده‌اند. پروژه دارای بالاترین رتبه{' '}
                «{ranked[0]?.name}» با امتیاز {faNum(ranked[0]?.finalScore ?? 0, 1)} است.
              </p>
            </motion.section>
          )}

          {on('table') && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-[11px] font-extrabold text-[#1A237E]">
                ۲. جدول رتبه‌بندی MCDM
              </h3>
              <table className="mt-2 w-full text-[9px]">
                <thead>
                  <tr className="bg-[#F5F7FA] text-ink-700">
                    <th className="p-2 text-center font-bold">رتبه</th>
                    <th className="p-2 text-right font-bold">پروژه</th>
                    <th className="p-2 text-center font-bold">امتیاز</th>
                    <th className="p-2 text-center font-bold">عدالت</th>
                    <th className="p-2 text-center font-bold">بودجه</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.slice(0, 8).map((p) => (
                    <tr key={p.id} className="border-b border-ink-300/25">
                      <td className="p-2 text-center font-bold text-ink-900">
                        {faNum(p.rank)}
                      </td>
                      <td className="p-2 text-right text-ink-700">{p.name}</td>
                      <td className="p-2 text-center font-bold text-ink-900">
                        {faNum(p.finalScore, 1)}
                      </td>
                      <td className="p-2 text-center text-ink-700">
                        {faNum(p.justice, 2)}
                      </td>
                      <td className="p-2 text-center text-ink-700">
                        {faShortBudget(p.budget)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.section>
          )}

          {on('radar') && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-[11px] font-extrabold text-[#1A237E]">
                ۳. پروفایل معیارهای پروژه برتر
              </h3>
              <div className="mt-1 [&_text]:fill-ink-700">
                <RadarPanel primary={ranked[0]} height={240} />
              </div>
            </motion.section>
          )}

         {on('ai') && (
  <motion.section
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-6"
  >
    <h3 className="text-[11px] font-extrabold text-[#1A237E]">
      ۴. تحلیل هوش مصنوعی
    </h3>

    {aiAnalysis ? (
      <div className="mt-2 rounded-lg border-r-4 border-[#FF8F00] bg-[#FFF8E1] p-3 text-ink-700">
        <MarkdownRenderer content={aiAnalysis} />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => void generateReportAnalysis()}
        disabled={aiLoading}
        className="mt-2 rounded-lg border border-[#FF8F00] px-4 py-2 text-[10px] font-bold text-[#B45309] disabled:opacity-60"
      >
        {aiLoading ? 'در حال تحلیل تمام داده‌های سامانه…' : 'تولید تحلیل زنده گزارش'}
      </button>
    )}

    {aiError && <p className="mt-2 text-[10px] text-rose-600">{aiError}</p>}
  </motion.section>
)}

          {on('justice') && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-[11px] font-extrabold text-[#1A237E]">
                ۵. شاخص عدالت فضایی
              </h3>
              <p className="mt-2 text-[10px] leading-6 text-ink-700">
                از {faNum(neighborhoods.length)} محله بررسی‌شده،{' '}
                {faNum(deprivedNeighborhoods.length)} محله ضریب محرومیت حداقل ۰٫۶ دارند و{' '}
                {faNum(
                  deprivedNeighborhoods.reduce((sum, neighborhood) => sum + neighborhood.projects, 0)
                )}{' '}
                پروژه در آن‌ها ثبت شده است.
              </p>
            </motion.section>
          )}

          {on('audit') && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-[11px] font-extrabold text-[#1A237E]">
                ۶. ردپای تصمیم
              </h3>
              <p className="mt-2 text-[10px] leading-6 text-ink-700">
                {system.auditTrail[0]
                  ? `آخرین رویداد ثبت‌شده: ${system.auditTrail[0].action} — ${system.auditTrail[0].actor} در ${system.auditTrail[0].date}`
                  : 'رویدادی در ردپای تصمیم ثبت نشده است.'}
              </p>
            </motion.section>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-ink-300/40 pt-4 text-[9px] text-ink-500">
            <span>سامانه هوشمند اولویت‌بندی Smart-VAP</span>
            <span>صفحه ۱ از ۴</span>
          </div>
        </div>
      </Card>
    </div>
  );
}