import type { Criterion } from '../types';

export const criteria: Criterion[] = [
{
  key: 'social',
  label: 'تاثیر اجتماعی',
  hint: 'جمعیت بهره‌مند و ارتقای کیفیت زندگی',
  weight: 22
},
{
  key: 'economic',
  label: 'توجیه اقتصادی',
  hint: 'نسبت فایده به هزینه و بازگشت سرمایه',
  weight: 20
},
{
  key: 'urgency',
  label: 'فوریت فنی',
  hint: 'فرسودگی، ایمنی و ضرورت اجرای فوری',
  weight: 18
},
{
  key: 'justice',
  label: 'عدالت فضایی',
  hint: 'تمرکز بر محلات کم‌برخوردار',
  weight: 16
},
{
  key: 'strategy',
  label: 'انطباق استراتژیک',
  hint: 'همسویی با برنامه ۵ ساله شهرداری',
  weight: 14
},
{
  key: 'risk',
  label: 'ریسک اجرا (معکوس)',
  hint: 'ریسک حقوقی، تملک و پیمانکاری',
  weight: 10
}];


export const strategicGoals = [
{ id: 'mobility', label: 'شهر روان', icon: 'Route' },
{ id: 'green', label: 'شهر سبز', icon: 'Leaf' },
{ id: 'resilient', label: 'شهر تاب‌آور', icon: 'ShieldCheck' },
{ id: 'equity', label: 'شهر عادلانه', icon: 'Scale' },
{ id: 'smart', label: 'شهر هوشمند', icon: 'Cpu' }];