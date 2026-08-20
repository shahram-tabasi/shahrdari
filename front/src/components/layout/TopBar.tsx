import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellIcon,
  BrainIcon,
  ChevronDownIcon,
  CircleDollarSignIcon,
  LogOutIcon,
  MaximizeIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SunIcon,
  UserIcon } from
'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useData } from '../../contexts/DataContext';
import { fa } from '../../utils/format';

const kindIcon = {
  ai: BrainIcon,
  budget: CircleDollarSignIcon,
  system: ShieldIcon
};

export function TopBar({ title, subtitle }: {title: string;subtitle: string;}) {
  const { theme, toggleTheme, lang, setLang, t, togglePresentation } = useApp();
  const { system: { notifications } } = useData();
  const [openPanel, setOpenPanel] = useState<'bell' | 'user' | null>(null);
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-20 flex h-18 items-center gap-6 border-b border-navy-800/8 bg-surface/85 px-8 backdrop-blur-md dark:border-white/8 dark:bg-night-800/85">
      <div className="min-w-0">
        <h1 className="truncate text-base font-extrabold text-ink-900 dark:text-white/90">
          {title}
        </h1>
        <p className="truncate text-[11px] text-ink-500 dark:text-white/45">
          {subtitle}
        </p>
      </div>

      {/* Smart search — 500px */}
      <div className="mx-auto hidden w-[500px] lg:block">
        <div className="group flex h-11 items-center gap-3 rounded-xl border border-navy-800/10 bg-canvas px-4 transition focus-within:border-amber-500 focus-within:bg-surface dark:border-white/10 dark:bg-night-700 dark:focus-within:bg-night-600">
          <SearchIcon size={17} className="text-ink-500 dark:text-white/40" />
          <input
            type="search"
            placeholder={t(
              'جستجوی پروژه، شاخص یا نام محله…',
              'Search projects, criteria or neighborhoods…'
            )}
            className="h-full w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300 dark:text-white/85 dark:placeholder:text-white/30"
            aria-label={t('جستجوی هوشمند', 'Smart search')} />
          
          <kbd className="rounded-md bg-navy-800/8 px-2 py-0.5 text-[10px] font-bold text-ink-500 dark:bg-white/10 dark:text-white/45">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePresentation}
          className="hidden items-center gap-2 rounded-lg border border-navy-800/10 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-amber-500 hover:text-amber-600 md:flex dark:border-white/10 dark:text-white/60 dark:hover:text-amber-400">
          
          <MaximizeIcon size={15} />
          {t('حالت ارائه', 'Present')}
        </button>

        {/* Language */}
        <div className="flex items-center rounded-lg border border-navy-800/10 p-0.5 dark:border-white/10">
          {(['fa', 'en'] as const).map((code) =>
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={[
            'rounded-md px-2.5 py-1.5 text-[11px] font-bold transition',
            lang === code ?
            'bg-navy-800 text-white dark:bg-white/15' :
            'text-ink-500 hover:text-navy-800 dark:text-white/45'].
            join(' ')}>
            
              {code === 'fa' ? '🇮🇷 فا' : '🇬🇧 EN'}
            </button>
          )}
        </div>

        {/* Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t('تغییر حالت شب و روز', 'Toggle theme')}
          className="grid h-10 w-10 place-items-center rounded-lg border border-navy-800/10 text-ink-700 transition hover:border-amber-500 hover:text-amber-600 dark:border-white/10 dark:text-white/70">
          
          {theme === 'light' ? <MoonIcon size={17} /> : <SunIcon size={17} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'bell' ? null : 'bell')}
            aria-label={t('اعلان‌ها', 'Notifications')}
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-navy-800/10 text-ink-700 transition hover:border-amber-500 hover:text-amber-600 dark:border-white/10 dark:text-white/70">
            
            <BellIcon size={17} />
            {unread > 0 ?
            <span className="absolute -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-navy-900 ltr:-right-1.5 rtl:-left-1.5">
                {fa(unread)}
              </span> :
            null}
          </button>
          <AnimatePresence>
            {openPanel === 'bell' ?
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-12 w-[22rem] overflow-hidden rounded-xl border border-navy-800/8 bg-surface shadow-lift ltr:left-0 rtl:right-0 dark:border-white/10 dark:bg-night-700">
              
                <p className="border-b border-navy-800/8 px-5 py-3.5 text-sm font-bold text-ink-900 dark:border-white/8 dark:text-white/85">
                  {t('اعلان‌ها', 'Notifications')}
                </p>
                <ul className="max-h-80 divide-y divide-navy-800/6 overflow-auto thin-scroll dark:divide-white/6">
                  {notifications.map((n) => {
                  const Icon = kindIcon[n.kind];
                  return (
                    <li
                      key={n.id}
                      className="flex gap-3 px-5 py-3.5 transition hover:bg-canvas dark:hover:bg-white/5">
                      
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-800/8 text-navy-800 dark:bg-white/10 dark:text-navy-100">
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink-900 dark:text-white/85">
                            {n.title}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-white/45">
                            {n.body}
                          </p>
                          <p className="mt-1 text-[10px] text-ink-300 dark:text-white/30">
                            {n.time}
                          </p>
                        </div>
                      </li>);

                })}
                </ul>
              </motion.div> :
            null}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'user' ? null : 'user')}
            className="flex items-center gap-2 rounded-lg py-1 ltr:pr-2 rtl:pl-2">
            
            <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-800 text-sm font-bold text-white dark:bg-navy-500">
              م‌ر
            </span>
            <span className="hidden text-right leading-tight xl:block">
              <span className="block text-xs font-bold text-ink-900 dark:text-white/85">
                مهندس رضوانی
              </span>
              <span className="block text-[10px] text-ink-500 dark:text-white/45">
                {t('معاون فنی و عمرانی', 'Deputy of Development')}
              </span>
            </span>
            <ChevronDownIcon size={15} className="text-ink-500 dark:text-white/40" />
          </button>
          <AnimatePresence>
            {openPanel === 'user' ?
            <motion.ul
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-[3.25rem] w-60 overflow-hidden rounded-xl border border-navy-800/8 bg-surface py-2 shadow-lift ltr:left-0 rtl:right-0 dark:border-white/10 dark:bg-night-700">
              
                {[
              { icon: UserIcon, fa: 'تنظیمات حساب', en: 'Account settings' },
              { icon: ShieldIcon, fa: 'مدیریت کاربران و دسترسی', en: 'Users & roles' },
              { icon: SettingsIcon, fa: 'تنظیمات API مالی', en: 'Finance API' },
              { icon: LogOutIcon, fa: 'خروج از سامانه', en: 'Sign out' }].
              map((row) =>
              <li key={row.en}>
                    <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-xs font-semibold text-ink-700 transition hover:bg-canvas dark:text-white/70 dark:hover:bg-white/5">
                  
                      <row.icon size={15} className="text-ink-500 dark:text-white/40" />
                      {t(row.fa, row.en)}
                    </button>
                  </li>
              )}
              </motion.ul> :
            null}
          </AnimatePresence>
        </div>
      </div>
    </header>);

}
