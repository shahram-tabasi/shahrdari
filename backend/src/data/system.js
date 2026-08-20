export const notifications = [
{
  id: 'n1',
  title: 'تحلیل هوشمند تکمیل شد',
  body: 'تحلیل متنی پروژه «بازآفرینی بافت تاریخی محله شهر» با اطمینان ۹۲٪ به پایان رسید.',
  time: '۱۲ دقیقه پیش',
  kind: 'ai',
  unread: true
},
{
  id: 'n2',
  title: 'هشدار انحراف بودجه',
  body: 'پروژه خط دوم BRT از سقف مصوب ۳۴٪ عبور کرده است.',
  time: '۱ ساعت پیش',
  kind: 'budget',
  unread: true
},
{
  id: 'n3',
  title: 'تغییر وزن معیارها',
  body: 'کارشناس برنامه‌ریزی وزن «عدالت فضایی» را از ۱۴ به ۱۶ افزایش داد.',
  time: '۳ ساعت پیش',
  kind: 'system',
  unread: true
},
{
  id: 'n4',
  title: 'همگام‌سازی مالی',
  body: 'داده‌های سامانه مالی شهرداری با موفقیت به‌روزرسانی شد.',
  time: 'دیروز',
  kind: 'system',
  unread: false
}];


export const auditTrail = [
{ id: 'a1', actor: 'مهندس رضوانی', role: 'کارشناس برنامه‌ریزی', action: 'وزن معیار «عدالت فضایی» از ۱۴ به ۱۶ تغییر کرد', date: '۱۴۰۴/۰۵/۱۲', time: '۱۰:۲۴' },
{ id: 'a2', actor: 'دکتر امیری', role: 'مدیر فنی', action: 'ماتریس مقایسات زوجی BWM بازنگری شد', date: '۱۴۰۴/۰۵/۱۱', time: '۱۶:۰۵' },
{ id: 'a3', actor: 'سامانه هوشمند', role: 'موتور AI', action: 'رتبه پروژه P-۱۰۵۲ پس از تحلیل حساسیت یک پله ارتقا یافت', date: '۱۴۰۴/۰۵/۱۱', time: '۰۹:۴۰' },
{ id: 'a4', actor: 'خانم موسوی', role: 'ناظر', action: 'وضعیت پروژه سالن ورزشی ابوذر به «متوقف» تغییر کرد', date: '۱۴۰۴/۰۵/۰۹', time: '۱۳:۱۸' },
{ id: 'a5', actor: 'مهندس رضوانی', role: 'کارشناس برنامه‌ریزی', action: 'سناریوی «توسعه سریع» ذخیره شد', date: '۱۴۰۴/۰۵/۰۸', time: '۱۱:۰۲' }];


export const savedScenarios = [
{ id: 's1', name: 'سناریوی انقباضی', budget: 2200, projects: 6, coverage: 41, justice: 0.78 },
{ id: 's2', name: 'سناریوی متعادل', budget: 3600, projects: 8, coverage: 63, justice: 0.72 },
{ id: 's3', name: 'سناریوی توسعه سریع', budget: 5200, projects: 11, coverage: 88, justice: 0.66 }];


export const decisionHistory = [
{ id: 'h1', date: '۱۴۰۴/۰۵/۱۲', title: 'اولویت‌بندی نهایی فصل تابستان', detail: '۱۲ پروژه با وزن‌های بازنگری‌شده رتبه‌بندی شد' },
{ id: 'h2', date: '۱۴۰۴/۰۴/۲۸', title: 'تصویب سناریوی متعادل', detail: 'سقف بودجه ۳٬۶۰۰ میلیارد تومان تایید شد' },
{ id: 'h3', date: '۱۴۰۴/۰۴/۱۵', title: 'ورود ۴ پروژه جدید', detail: 'تحلیل متنی توسط LLM و تخصیص تگ‌های استراتژیک' },
{ id: 'h4', date: '۱۴۰۴/۰۳/۳۰', title: 'بازنگری معیارهای عدالت', detail: 'ضریب محرومیت محلات با داده‌های سرشماری به‌روز شد' }];

export default {
  notifications,
  auditTrail,
  savedScenarios,
  decisionHistory
};
