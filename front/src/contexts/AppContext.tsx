/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState } from
'react';

type Theme = 'light' | 'dark';
type Lang = 'fa' | 'en';

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: 'rtl' | 'ltr';
  presentation: boolean;
  togglePresentation: () => void;
  t: (fa: string, en: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setTheme] = useState<Theme>('light');
  const [lang, setLang] = useState<Lang>('fa');
  const [presentation, setPresentation] = useState(false);

  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('dir', dir);
    root.setAttribute('lang', lang);
  }, [theme, dir, lang]);

  const toggleTheme = useCallback(
    () => setTheme((v) => v === 'light' ? 'dark' : 'light'),
    []
  );
  const togglePresentation = useCallback(() => setPresentation((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresentation(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      lang,
      setLang,
      dir,
      presentation,
      togglePresentation,
      t: (faText: string, enText: string) => lang === 'fa' ? faText : enText
    }),
    [theme, toggleTheme, lang, dir, presentation, togglePresentation]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}