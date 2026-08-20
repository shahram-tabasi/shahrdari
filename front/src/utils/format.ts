const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل تمام ارقام لاتین یک رشته به ارقام فارسی */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد با جداکننده هزارگان و ارقام فارسی */
export function faNum(value: number, fractionDigits = 0): string {
  const fixed = value.toFixed(fractionDigits);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return fa(dec ? `${grouped}.${dec}` : grouped);
}

export function faPercent(value: number, fractionDigits = 0): string {
  return `${faNum(value, fractionDigits)}٪`;
}

/** میلیارد تومان */
export function faBudget(value: number): string {
  return `${faNum(value)} میلیارد تومان`;
}

export function faShortBudget(value: number): string {
  return `${faNum(value)} م.ت`;
}