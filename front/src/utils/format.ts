/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** Convert every Latin digit in a string to its Persian equivalent. */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** Number with thousands separators, rendered in Persian digits. */
export function faNum(value: number, fractionDigits = 0): string {
  const fixed = value.toFixed(fractionDigits);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return fa(dec ? `${grouped}.${dec}` : grouped);
}

export function faPercent(value: number, fractionDigits = 0): string {
  return `${faNum(value, fractionDigits)}٪`;
}

/** Formats a figure in billion Toman, the unit used throughout the system. */
export function faBudget(value: number): string {
  return `${faNum(value)} میلیارد تومان`;
}

export function faShortBudget(value: number): string {
  return `${faNum(value)} م.ت`;
}