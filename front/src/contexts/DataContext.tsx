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
  useState
} from 'react';
import { AlertTriangleIcon, LoaderCircleIcon, RefreshCwIcon } from 'lucide-react';
import { getDashboard } from '../services/api';
import type { DashboardData } from '../types';
import { useApp } from './AppContext';

interface DataContextValue extends DashboardData {
  categoryColors: Record<string, string>;
  refresh: () => Promise<void>;
}

const CATEGORY_PALETTE = ['#2979FF', '#00A86B', '#8E24AA', '#FF8F00', '#00838F'];

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { t } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await getDashboard());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t('دریافت داده‌های سامانه ممکن نشد.', 'Unable to load application data.')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => data ? {
      ...data,
      categoryColors: Object.fromEntries(
        [...new Set(data.projects.map(project => project.category))]
          .map((category, index) => [
            category,
            CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
          ])
      ),
      refresh
    } : null,
    [data, refresh]
  );

  if (loading && !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas dark:bg-night-900">
        <div className="text-center text-navy-800 dark:text-white">
          <LoaderCircleIcon className="mx-auto animate-spin" size={36} />
          <p className="mt-4 text-sm font-bold">
            {t('در حال دریافت داده‌ها از سرور…', 'Loading data from the server…')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !value) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6 dark:bg-night-900">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lift dark:bg-night-700">
          <AlertTriangleIcon className="mx-auto text-rose-500" size={36} />
          <p className="mt-4 text-sm font-bold text-ink-900 dark:text-white">
            {t('دریافت داده‌ها از سرور ناموفق بود', 'Could not load data from the server')}
          </p>
          <p className="mt-2 text-xs text-ink-500 dark:text-white/50">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-800 px-5 py-3 text-xs font-bold text-white"
          >
            <RefreshCwIcon size={15} />
            {t('تلاش دوباره', 'Try again')}
          </button>
        </div>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useData must be used inside DataProvider.');
  }

  return context;
}
