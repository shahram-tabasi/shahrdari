/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * BRANDING — SINGLE SOURCE OF TRUTH (FRONTEND).
 *
 * EDIT HERE, NOWHERE ELSE. The sidebar, the report header, the page title and
 * the export filename all read from this file.
 *
 * This mirrors `backend/src/config/branding.js`. Keep the two in sync: the
 * backend copy brands server-generated PDF/Excel/PowerPoint reports, this one
 * brands the UI. They are deliberately separate files so the frontend can be
 * built and deployed without the backend source present.
 *
 * BILINGUAL BY DESIGN: every user-visible label carries both `fa` and `en`.
 * The product is bilingual and must stay that way — when you add a label, add
 * BOTH forms, and never replace a `fa` value with an English string.
 */

export type Locale = 'fa' | 'en';

/** The vendor: the company that authored and owns this software. */
export const company = {
  fa: 'شرکت سیمرغ فناوری هوشمند ایرانیان',
  en: 'Simorgh Iranian Smart Technology Co.',
  shortFa: 'سیمرغ فناوری هوشمند ایرانیان',
  shortEn: 'Simorgh Smart Technology'
} as const;

/** The client. Change these two lines for a different municipality. */
export const client = {
  fa: 'شهرداری کرمان',
  en: 'Kerman Municipality'
} as const;

/** The product. */
export const product = {
  fa: 'سامانه مدیریت سبد پروژه',
  en: 'Project Portfolio Management System',
  fullFa: 'سامانه پشتیبان تصمیم مدیریت سبد پروژه شهرداری کرمان',
  fullEn: 'Kerman Municipality Project Portfolio Decision Support System',
  version: '1.0.0'
} as const;

/**
 * Slug used when naming a downloaded report file.
 *
 * ASCII only and no spaces on purpose: this string ends up in a filename, and
 * Persian characters or spaces there break downloads on some Windows setups.
 */
export const reportFileSlug = 'Simorgh-Portfolio-Report';

/**
 * Copyright line.
 */
export function copyright(locale: Locale = 'fa'): string {
  const year = new Date().getFullYear();

  return locale === 'en'
    ? `Copyright (c) ${year} ${company.en}. All rights reserved.`
    : `کلیه حقوق این نرم‌افزار متعلق به ${company.fa} است. © ${year}`;
}

/**
 * "Powered by" line for the sidebar footer and report header.
 */
export function poweredBy(locale: Locale = 'fa'): string {
  return locale === 'en'
    ? `Developed by ${company.en}`
    : `توسعه‌یافته توسط ${company.fa}`;
}

export default { company, client, product, reportFileSlug, copyright, poweredBy };
