import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MinimizeIcon } from 'lucide-react';
import { Sidebar, navItems } from './Sidebar';
import { TopBar } from './TopBar';
import { useApp } from '../../contexts/AppContext';

const subtitles: Record<string, {fa: string;en: string;}> = {
  '/': {
    fa: 'نمای کلان سبد پروژه‌های عمرانی • دوره ۱۴۰۴',
    en: 'Portfolio overview • FY 1404'
  },
  '/intake': {
    fa: 'تحلیل متنی پروژه‌ها با مدل زبانی و استخراج شاخص‌ها',
    en: 'LLM-based project understanding'
  },
  '/mcdm': {
    fa: 'وزن‌دهی معیارها، رتبه‌بندی و ردپای تصمیم',
    en: 'Criteria weighting, ranking & audit trail'
  },
  '/optimizer': {
    fa: 'شبیه‌سازی تخصیص بودجه و مقایسه سناریوها',
    en: 'Budget allocation simulation'
  },
  '/map': {
    fa: 'توزیع فضایی پروژه‌ها و ضریب محرومیت محلات کرمان',
    en: 'Spatial distribution & deprivation index'
  },
  '/reports': {
    fa: 'مستندسازی و خروجی رسمی برای کارتابل مدیران',
    en: 'Documentation & official exports'
  }
};

export function AppShell() {
  const { pathname } = useLocation();
  const { presentation, togglePresentation, t } = useApp();
  const active = navItems.find((n) => n.to === pathname) ?? navItems[0];
  const sub = subtitles[pathname] ?? subtitles['/'];

  return (
    <div className="min-h-screen w-full bg-canvas text-ink-900 dark:bg-night-900 dark:text-white/85">
      {!presentation ? <Sidebar /> : null}

      <div className={presentation ? '' : 'ltr:pl-70 rtl:pr-70'}>
        {!presentation ?
        <TopBar title={t(active.fa, active.en)} subtitle={t(sub.fa, sub.en)} /> :
        null}

        <main className={presentation ? 'p-8' : 'p-8'}>
          <Outlet />
        </main>
      </div>

      {presentation ?
      <button
        type="button"
        onClick={togglePresentation}
        className="fixed bottom-8 z-40 flex items-center gap-2 rounded-xl bg-navy-800 px-4 py-3 text-xs font-bold text-white shadow-lift ltr:right-8 rtl:left-8">
        
          <MinimizeIcon size={15} />
          {t('خروج از حالت ارائه (Esc)', 'Exit presentation (Esc)')}
        </button> :
      null}
    </div>);

}