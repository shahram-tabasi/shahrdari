/*
 * Simorgh Iranian Smart Technology Co.
 * شرکت سیمرغ فناوری هوشمند ایرانیان
 *
 * Municipal Project Portfolio Management System
 * Copyright (c) 2025 Simorgh Iranian Smart Technology Co. All rights reserved.
 */

import { reportFileSlug } from '../config/branding';
import type {
  AiStatus,
  AiSuggestion,
  AuditEntryRecord,
  CriteriaModel,
  CurrentUser,
  DashboardData,
  EvaluationResult,
  PortfolioRequest,
  PortfolioResult,
  RankingRequest,
  RankingResult,
  SensitivityResult,
  SessionInfo
} from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Array<{ field?: string; message: string }> | null;
  meta: unknown;
}

const CONFIGURED_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace(/\/$/, '');

/**
 * API base URL.
 *
 * The normal path is the relative `/api/v1`, which `front/vite.config.ts`
 * proxies to the backend in development and the reverse proxy serves in
 * production. Relative is preferred because the browser then makes a
 * same-origin request and CORS never enters the picture.
 */
const API_BASE_URL = CONFIGURED_BASE_URL ?? '/api/v1';

/**
 * Development fallback for when the proxy is not in effect.
 *
 * A dev server started outside the `front` directory never reads
 * `front/vite.config.ts`, so the `/api` proxy is not installed. Vite then
 * handles `/api/v1/...` itself: its SPA fallback only rewrites requests that
 * accept HTML, and these requests ask for JSON, so every one of them comes
 * back as a bare 404 that has nothing to do with the backend.
 *
 * Rather than leave the application dead in that state, the first such 404
 * switches to the backend's own origin for the rest of the session. The
 * backend's CORS allowlist covers the ports Vite uses in development, so the
 * cross-origin request is accepted. Setting VITE_API_BASE_URL disables this
 * entirely — an explicit configuration is never second-guessed.
 */
const DEV_FALLBACK_BASE_URL = 'http://127.0.0.1:4000/api/v1';

let activeBaseUrl = API_BASE_URL;

/** True while the relative path is still worth trying. */
function canFallBack(): boolean {
  return (
    import.meta.env.DEV &&
    CONFIGURED_BASE_URL === undefined &&
    activeBaseUrl !== DEV_FALLBACK_BASE_URL
  );
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Session token.
 *
 * Held in memory rather than in localStorage: a token in localStorage is
 * readable by any script that ends up running on the page, and survives long
 * after the user has walked away from the machine. Keeping it in a module
 * variable means a reload requires a fresh session, which is the correct
 * trade-off for a municipal decision system.
 */
let sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
  sessionToken = token;
}

export function hasSession() {
  return sessionToken !== null;
}

function authHeaders(): Record<string, string> {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
}

/**
 * Perform a single attempt at the request.
 *
 * Throws a special `RetryableApiError` when the failure looks transient
 * (network error, or a non-JSON body) rather than a genuine backend error.
 * A well-behaved backend response is ALWAYS valid JSON here — both the
 * success path and every error path (notFoundMiddleware, errorMiddleware)
 * return JSON — so a non-JSON body means something *outside* our own
 * server intercepted the request (e.g. antivirus/security software that
 * injects itself into local page traffic and occasionally answers dev
 * requests instead of letting them through). Those are safe to retry.
 */
class RetryableApiError extends Error {}

/**
 * The request provably never reached the backend, so nothing was submitted.
 *
 * This is safe to retry for ANY method, including POST: the usual reason not
 * to retry a POST is that it may have been applied server-side before the
 * response was mangled, and that cannot have happened here.
 */
class UnreachedBackendError extends RetryableApiError {}

async function attemptRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${activeBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...init?.headers
      }
    });
  } catch {
    throw new UnreachedBackendError(
      'اتصال به بکند برقرار نشد. مطمئن شوید سرور بکند روی پورت ۴۰۰۰ در حال اجرا است.'
    );
  }

  const responseText = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as ApiEnvelope<T>;
    } catch {
      throw new RetryableApiError(
        `بکند پاسخ معتبر JSON ارسال نکرد (HTTP ${response.status}).`
      );
    }
  }

  /*
   * A 404 that is not one of our own JSON envelopes did not come from the
   * backend — the request never reached it. In development that means the
   * proxy is missing, so switch to the backend's origin and let the retry
   * wrapper try again there.
   */
  if (response.status === 404 && !payload?.success && !payload?.message) {
    if (canFallBack()) {
      activeBaseUrl = DEV_FALLBACK_BASE_URL;

      throw new UnreachedBackendError(
        'درخواست به بکند نرسید؛ اتصال مستقیم به سرور بکند آزمایش می‌شود.'
      );
    }

    throw new UnreachedBackendError(
      `درخواست «${path}» به بکند نرسید (HTTP 404). اگر سرور توسعه را از پوشه‌ای غیر از front اجرا کرده‌اید، پروکسی /api فعال نمی‌شود.`
    );
  }

  if (!payload) {
    throw new RetryableApiError(
      `پاسخ بکند خالی بود (HTTP ${response.status}). وضعیت سرور بکند را بررسی کنید.`
    );
  }

  if (!response.ok || !payload.success) {
    // Authentication and authorisation failures are not transient and are not
    // the user's typo — they need their own message so the UI can prompt for a
    // session rather than showing a generic failure.
    if (response.status === 401) {
      sessionToken = null;
      throw new Error('نشست شما معتبر نیست یا منقضی شده است؛ دوباره وارد شوید.');
    }

    if (response.status === 403) {
      throw new Error('دسترسی لازم برای این عملیات را ندارید.');
    }

    const details = payload.errors?.map(error => error.message).join(' ');
    // A real, well-formed error response from our own backend — not a
    // transient glitch, so no point retrying it.
    throw new Error(details || payload.message || 'The server request failed.');
  }

  return payload.data;
}

/**
 * Retry wrapper.
 *
 * Some environments intermittently break individual localhost requests
 * (most commonly antivirus/security software that injects itself into
 * web traffic — e.g. Kaspersky's page-interaction script — and randomly
 * answers a dev-server request with a bogus non-JSON 404 instead of
 * letting it reach Vite's proxy). A single such glitch shouldn't surface
 * as a hard error to the user, so we transparently retry a few times
 * before giving up.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only GET requests are safe to silently retry — retrying a POST that
  // may have already reached the server (but whose response got mangled)
  // risks double-submitting it (e.g. duplicate AI chat calls).
  const isIdempotent = !init?.method || init.method.toUpperCase() === 'GET';
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptRequest<T>(path, init);
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      // A request that never reached the backend is safe to repeat whatever
      // its method was. Anything else is only repeated when it is idempotent.
      const safeToRepeat =
        error instanceof UnreachedBackendError ||
        (isIdempotent && error instanceof RetryableApiError);

      if (!safeToRepeat) {
        break;
      }

      await wait(300 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('The server request failed.');
}

export function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>('/dashboard');
}

/**
 * Open a session.
 *
 * In production the backend rejects this route and the token comes from the
 * municipality's OIDC provider; this is the development path only.
 */
export async function openSession(input: {
  userId: string;
  name: string;
  role: string;
  districts?: string[];
}): Promise<SessionInfo> {
  const session = await request<SessionInfo>('/auth/session', {
    method: 'POST',
    body: JSON.stringify(input)
  });

  setSessionToken(session.token);

  return session;
}

export function getCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>('/auth/me');
}

/**
 * The full criteria model: eight dimensions, thirty-seven preferential
 * criteria and the mandatory gates of filter 1.
 */
export function getCriteriaModel(): Promise<CriteriaModel> {
  return request<CriteriaModel>('/criteria/model');
}

/** EVALUATION — screening, data quality and life-cycle assessment. */
export function evaluateProjects(projectIds?: string[]) {
  return request<EvaluationResult>('/decisions/evaluations', {
    method: 'POST',
    body: JSON.stringify(projectIds ? { projectIds } : {})
  });
}

/** FILTER 2 — ranking. Weights may be given directly or via an AHP matrix. */
export function createRanking(input: RankingRequest = {}) {
  return request<RankingResult>('/decisions/rankings', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** FILTER 3 — portfolio construction under the full constraint set. */
export function optimizePortfolio(input: PortfolioRequest) {
  return request<PortfolioResult>('/decisions/portfolio', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Sensitivity and stability analysis. */
export function analyzeSensitivity(input: PortfolioRequest & { scenarios?: number }) {
  return request<SensitivityResult>('/decisions/sensitivity', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Whether the language model is available, and what it is allowed to do. */
export function getAiStatus() {
  return request<AiStatus>('/ai/status');
}

/**
 * Run an assistive AI task.
 *
 * The response is a *suggestion*: it carries `reviewStatus` and
 * `appliedToDecision` and has no effect on any score or portfolio until an
 * authorised expert accepts it.
 */
export function runAiTask(input: {
  task: string;
  message: string;
  projectIds?: string[];
}) {
  return request<AiSuggestion>('/ai/tasks', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Expert review — accept or reject a model suggestion. */
export function reviewAiSuggestion(
  id: string,
  input: { status: 'accepted' | 'rejected'; reason: string; correctedOutput?: string }
) {
  return request<AiSuggestion>(`/ai/suggestions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function listAiSuggestions(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return request<AiSuggestion[]>(`/ai/suggestions${query}`);
}

/** Audit trail. */
export function getAuditTrail(limit = 100) {
  return request<AuditEntryRecord[]>(`/audit?limit=${limit}`);
}
/**
 * Export report file
 *
 * Downloads PDF, Excel or PowerPoint reports
 * from backend export service.
 */
export async function exportReport(
  type: 'pdf' | 'excel' | 'pptx',
  payload: unknown
) {

  const response = await fetch(
    `${API_BASE_URL}/export/${type}`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },

      body: JSON.stringify(payload)
    }
  );


  if (!response.ok) {

    throw new Error(
      `Export failed: ${response.status}`
    );

  }


  const blob =
    await response.blob();


  const url =
    window.URL.createObjectURL(blob);


  const link =
    document.createElement('a');


  link.href = url;


  const extension =
    type === 'excel'
      ? 'xlsx'
      : type;


  // Filename slug is ASCII-only on purpose — Persian characters in a
  // download filename break on some Windows/browser combinations.
  link.download =
    `${reportFileSlug}-${Date.now()}.${extension}`;


  document.body.appendChild(link);


  link.click();


  link.remove();


  window.URL.revokeObjectURL(url);

}
