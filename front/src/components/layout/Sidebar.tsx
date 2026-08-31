/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../../assets/logo.png';
import {
  BrainCircuitIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MapIcon,
  SlidersHorizontalIcon,
  WalletIcon,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { exportReport } from '../../services/api';
import { client, product } from '../../config/branding';

export const navItems = [
  { to: '/', fa: 'میز کار', en: 'Dashboard', icon: LayoutDashboardIcon, hint: 'نمای کلی سبد' },
  { to: '/intake', fa: 'ورودی هوشمند', en: 'Smart Intake', icon: BrainCircuitIcon, hint: 'تحلیل متنی LLM' },
  { to: '/mcdm', fa: 'موتور اولویت‌بندی', en: 'MCDM Engine', icon: SlidersHorizontalIcon, hint: 'وزن‌دهی و رتبه‌بندی' },
  { to: '/optimizer', fa: 'بهینه‌ساز سبد', en: 'Optimizer', icon: WalletIcon, hint: 'شبیه‌سازی بودجه' },
  { to: '/map', fa: 'نقشه عدالت', en: 'Justice Map', icon: MapIcon, hint: 'توزیع فضایی' },
  { to: '/reports', fa: 'مرکز گزارش‌گیری', en: 'Reporting', icon: FileTextIcon, hint: 'خروجی رسمی' },
];


export function Sidebar() {
  const { t } = useApp();
  const { projects, criteria, neighborhoods, system } = useData();

  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);


  const quickExport = async (type: 'pdf' | 'excel') => {
    try {
      setExporting(type);

      const payload = {
        // Report title follows the UI language, so an English session
        // produces an English-titled report.
        title: `${t(product.fullFa, product.fullEn)} — ${t(client.fa, client.en)}`,
        projects,
        ranking: [],
        criteria,
        neighborhoods,
        audit: system.auditTrail,
        aiAnalysis: '',
        enabledSections: [
          'summary',
          'table',
          'radar',
          'ai',
          'justice',
          'audit',
        ],
      };

      await exportReport(type, payload);

    } catch (error) {
      console.error('Quick export error:', error);
      alert('خطا در ساخت فایل خروجی');

    } finally {
      setExporting(null);
    }
  };


  return (
    <aside
      className="fixed top-0 bottom-0 z-30 flex w-70 flex-col bg-navy-800 text-white ltr:left-0 rtl:right-0"
      aria-label="ناوبری اصلی"
    >

      {/* Brand */}
      <div className="flex h-18 items-center gap-3 px-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-lift overflow-hidden">
          <img
            src={logo}
            alt="Kerman Municipality"
            className="h-full h-full object-contain"
          />
        </span>

        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight">
            {t(product.fa, product.en)}
          </p>

          <p className="text-[11px] text-white/55">
            {t('شهرداری کرمان', 'Kerman Municipality')}
          </p>
        </div>
      </div>


      <div className="mx-6 h-px bg-white/10" />


      {/* Nav */}
      <nav className="mt-5 flex-1 space-y-1.5 overflow-y-auto px-4 thin-scroll">

        <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-white/35">
          {t('سامانه اولویت‌بندی', 'PRIORITIZATION')}
        </p>


        {navItems.map((item) => (

          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-white/12 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white',
              ].join(' ')
            }
          >

            {({ isActive }) => (
              <>

                <span
                  className={[
                    'absolute inset-y-2 w-1 rounded-full transition-all ltr:left-0 rtl:right-0',
                    isActive ? 'bg-amber-500' : 'bg-transparent',
                  ].join(' ')}
                />


                <item.icon
                  size={19}
                  strokeWidth={2}
                  className="shrink-0"
                />

                <span className="flex-1">
                  {t(item.fa, item.en)}
                </span>

              </>
            )}

          </NavLink>

        ))}

      </nav>



      {/* Footer */}
      <div className="space-y-3 border-t border-white/10 p-4">

        <p className="px-2 text-[10px] font-bold tracking-widest text-white/35">
          {t('خروجی سریع', 'QUICK EXPORT')}
        </p>


        <div className="grid grid-cols-2 gap-2">


          <button
            type="button"
            onClick={() => quickExport('pdf')}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 rounded-lg bg-white/8 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/14 disabled:opacity-50"
          >

            <FileTextIcon
              size={15}
              className="text-rose-400"
            />

            {exporting === 'pdf'
              ? 'در حال ساخت...'
              : 'PDF'}

          </button>



          <button
            type="button"
            onClick={() => quickExport('excel')}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 rounded-lg bg-white/8 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/14 disabled:opacity-50"
          >

            <FileSpreadsheetIcon
              size={15}
              className="text-emerald-400"
            />

            {exporting === 'excel'
              ? 'در حال ساخت...'
              : 'Excel'}

          </button>


        </div>



        <div className="flex items-center gap-2.5 rounded-lg bg-white/6 px-3 py-3">

          <span className="relative grid h-2.5 w-2.5 place-items-center">
            <span className="live-dot absolute inset-0 rounded-full bg-emerald-400" />
          </span>


          <div className="leading-tight">

            <p className="text-[11px] font-bold text-emerald-300">
              {t('اتصال زنده به دیتابیس', 'Live database link')}
            </p>


            <p className="text-[10px] text-white/45">
              {t('سامانه مالی شهرداری • همگام', 'Finance API • synced')}
            </p>

          </div>

        </div>


      </div>


    </aside>
  );
}