/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

/**
 * BRANDING — SINGLE SOURCE OF TRUTH.
 *
 * EDIT HERE, NOWHERE ELSE. Every place the vendor or product name appears —
 * the startup banner, the API root response, PDF/Excel/PowerPoint report
 * covers and footers, the AI system prompt — reads from this file. Change a
 * value here and it changes everywhere, so you never have to hunt for a
 * hardcoded name across the codebase.
 *
 * BILINGUAL BY DESIGN: every user-visible label has both a `fa` and an `en`
 * form. The product is bilingual and must stay that way — when you add a new
 * label, add BOTH forms. Never replace the `fa` value with an English string.
 *
 * Note on code comments: comments throughout this codebase are written in
 * English so they are easy to edit. Persian appears only in (a) values that
 * are shown to users, and (b) short bracketed references to the شیوه‌نامه,
 * which are kept in Persian so you can find the matching clause in the
 * original PDF.
 */

/**
 * The vendor. This is the company that authored and owns the software.
 */
export const company = Object.freeze({
  fa: "شرکت سیمرغ فناوری هوشمند ایرانیان",
  en: "Simorgh Iranian Smart Technology Co.",
  /** Short form, used where space is tight (report footers, page headers). */
  shortFa: "سیمرغ فناوری هوشمند ایرانیان",
  shortEn: "Simorgh Smart Technology",
  /**
   * Optional contact details printed on formal reports. Leave a field empty
   * and it is simply omitted from the output — nothing breaks.
   */
  website: "",
  email: "",
  phone: ""
});

/**
 * The client this deployment is delivered to. Change these two lines when the
 * same platform is deployed for a different municipality.
 */
export const client = Object.freeze({
  fa: "شهرداری کرمان",
  en: "Kerman Municipality"
});

/**
 * The product itself.
 */
export const product = Object.freeze({
  fa: "سامانه مدیریت سبد پروژه",
  en: "Project Portfolio Management System",
  /** Full name including the client, for report covers and the API banner. */
  fullFa: "سامانه پشتیبان تصمیم مدیریت سبد پروژه شهرداری کرمان",
  fullEn: "Kerman Municipality Project Portfolio Decision Support System",
  version: "1.0.0",
  /**
   * The methodology this system implements. Quoted on formal reports so a
   * reader can trace any number back to its governing document.
   */
  basisFa:
    "شیوه‌نامه شناسایی، انتخاب، اولویت‌بندی و تعریف سبد پروژه — ویرایش پنجم",
  basisEn:
    "Project Identification, Selection, Prioritisation and Portfolio Definition Directive, 5th edition"
});

const currentYear = new Date().getFullYear();

/**
 * Copyright line, in both languages.
 *
 * @param {"fa"|"en"} [locale]
 * @returns {string}
 */
export function copyright(locale = "fa") {
  return locale === "en"
    ? `Copyright (c) ${currentYear} ${company.en}. All rights reserved.`
    : `کلیه حقوق این نرم‌افزار متعلق به ${company.fa} است. © ${currentYear}`;
}

/**
 * One-line attribution for report covers and footers.
 *
 * This replaces the previous generic "Municipality AI Decision Support
 * Platform" wording: a formal report delivered to a municipality should name
 * the company accountable for it, not a product category.
 *
 * @param {"fa"|"en"} [locale]
 * @returns {string}
 */
export function attribution(locale = "fa") {
  return locale === "en"
    ? `Produced by ${product.fullEn}, developed by ${company.en}.`
    : `این گزارش توسط ${product.fullFa}، محصول ${company.fa}، تهیه شده است.`;
}

/**
 * Contact lines that are actually filled in. Empty fields are dropped rather
 * than printed as blanks.
 *
 * @returns {string[]}
 */
export function contactLines() {
  return [company.website, company.email, company.phone].filter(Boolean);
}

export default { company, client, product, copyright, attribution, contactLines };
