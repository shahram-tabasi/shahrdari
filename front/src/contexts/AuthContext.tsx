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
import { AlertTriangleIcon, LoaderCircleIcon, LockIcon, RefreshCwIcon } from 'lucide-react';
import { getCurrentUser, hasSession, openSession, setSessionToken } from '../services/api';
import type { CurrentUser } from '../types';
import { useApp } from './AppContext';

/**
 * SESSION BOOTSTRAP.
 *
 * Every API route behind `/api/v1` requires an authenticated principal, so the
 * UI has to hold a session before it can fetch anything. This provider is the
 * one place that obtains one, and it behaves differently per environment on
 * purpose:
 *
 *   DEVELOPMENT — it opens a session automatically against
 *   `POST /api/v1/auth/session`, so a contributor running `npm run dev` sees
 *   the application without a login step. That route exists only in
 *   development; the backend answers it with HTTP 501 in production.
 *
 *   PRODUCTION — it does NOT authenticate anyone. It renders a
 *   "sign-in required" state and waits. Real identity comes from the
 *   municipality's OAuth 2.0 / OIDC provider, and that integration replaces
 *   `signIn()` below and nothing else: the rest of the application only ever
 *   reads `user` and `can()`.
 *
 * The token itself never lands here — `services/api.ts` keeps it in a module
 * variable, deliberately not in localStorage.
 *
 * NOTE ON PERMISSIONS: `can()` is a usability helper for hiding actions the
 * principal cannot perform. It is never the enforcement point. Enforcement is
 * server-side, in `authorize()` on each route.
 */

/**
 * The identity used to bootstrap a development session.
 *
 * `manager` is chosen so every screen is reachable while working locally.
 * Override with VITE_DEV_ROLE (for example `viewer`) to see how the UI behaves
 * for a narrower role. These values are meaningless in production because the
 * session route is disabled there.
 */
const DEV_PRINCIPAL = {
  userId: 'local.developer',
  name: 'کاربر محیط توسعه',
  role: (import.meta.env.VITE_DEV_ROLE as string | undefined) ?? 'manager',
  districts: [] as string[]
};

type AuthStatus = 'loading' | 'authenticated' | 'signInRequired' | 'error';

interface AuthContextValue {
  user: CurrentUser | null;
  permissions: ReadonlySet<string>;
  /** True when the principal holds the given permission. UI hint only. */
  can: (permission: string) => boolean;
  status: AuthStatus;
  error: string | null;
  /** Obtain (or re-obtain) a session. */
  signIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useApp();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    import.meta.env.DEV ? 'loading' : 'signInRequired'
  );
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      // Re-use a session that is still held in memory rather than asking the
      // backend for a second one on every retry.
      if (!hasSession()) {
        await openSession(DEV_PRINCIPAL);
      }

      setUser(await getCurrentUser());
      setStatus('authenticated');
    } catch (signInError) {
      // A failed bootstrap must not leave a half-valid token behind.
      setSessionToken(null);
      setUser(null);
      setError(
        signInError instanceof Error
          ? signInError.message
          : t('ورود به سامانه ناموفق بود.', 'Sign-in failed.')
      );
      setStatus('error');
    }
  }, [t]);

  useEffect(() => {
    // Only development bootstraps itself. In production the user acts first.
    if (import.meta.env.DEV) {
      void signIn();
    }
  }, [signIn]);

  const value = useMemo<AuthContextValue>(() => {
    const permissions = new Set(user?.permissions ?? []);

    return {
      user,
      permissions,
      can: (permission: string) => permissions.has(permission),
      status,
      error,
      signIn
    };
  }, [user, status, error, signIn]);

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas dark:bg-night-900">
        <div className="text-center text-navy-800 dark:text-white">
          <LoaderCircleIcon className="mx-auto animate-spin" size={36} />
          <p className="mt-4 text-sm font-bold">
            {t('در حال برقراری نشست امن…', 'Establishing a secure session…')}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'signInRequired') {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6 dark:bg-night-900">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lift dark:bg-night-700">
          <LockIcon className="mx-auto text-navy-800 dark:text-white" size={36} />
          <p className="mt-4 text-sm font-bold text-ink-900 dark:text-white">
            {t('ورود به سامانه لازم است', 'Sign-in required')}
          </p>
          <p className="mt-2 text-xs leading-6 text-ink-500 dark:text-white/50">
            {t(
              'دسترسی به این سامانه از راه سامانه احراز هویت سازمانی شهرداری انجام می‌شود.',
              'Access to this system is granted through the municipality identity provider.'
            )}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6 dark:bg-night-900">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lift dark:bg-night-700">
          <AlertTriangleIcon className="mx-auto text-rose-500" size={36} />
          <p className="mt-4 text-sm font-bold text-ink-900 dark:text-white">
            {t('برقراری نشست ناموفق بود', 'Could not establish a session')}
          </p>
          <p className="mt-2 text-xs leading-6 text-ink-500 dark:text-white/50">{error}</p>
          <button
            type="button"
            onClick={() => void signIn()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-800 px-5 py-3 text-xs font-bold text-white"
          >
            <RefreshCwIcon size={15} />
            {t('تلاش دوباره', 'Try again')}
          </button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
