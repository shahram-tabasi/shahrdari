import type { DashboardData } from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Array<{ field?: string; message: string }> | null;
  meta: unknown;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.replace(/\/$/, '') ?? '/api/v1';

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function attemptRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers
      }
    });
  } catch {
    throw new RetryableApiError(
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

  if (!payload) {
    throw new RetryableApiError(
      `پاسخ بکند خالی بود (HTTP ${response.status}). وضعیت سرور بکند را بررسی کنید.`
    );
  }

  if (!response.ok || !payload.success) {
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
  const isRetryable = !init?.method || init.method.toUpperCase() === 'GET';
  const maxAttempts = isRetryable ? 3 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptRequest<T>(path, init);
    } catch (error) {
      lastError = error;

      if (!(error instanceof RetryableApiError) || attempt === maxAttempts) {
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

export function chatWithAi(message: string) {
  return request<{
    context: unknown;
    response: {
      id: string;
      model: string;
      output: string;
      usage: unknown;
      createdAt: string;
    };
  }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

export function createRanking(weights?: Record<string, number>) {
  return request<{ weights: Record<string, number>; projectCount: number; projects: unknown[] }>(
    '/decisions/rankings',
    { method: 'POST', body: JSON.stringify(weights ? { weights } : {}) }
  );
}

export function optimizePortfolio(input: {
  budget: number;
  weights?: Record<string, number>;
  includeProjectIds?: string[];
  excludeProjectIds?: string[];
}) {
  return request('/decisions/portfolio', {
    method: 'POST',
    body: JSON.stringify(input)
  });
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
        'Content-Type': 'application/json'
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


  link.download =
    `Smart-VAP-Report-${Date.now()}.${extension}`;


  document.body.appendChild(link);


  link.click();


  link.remove();


  window.URL.revokeObjectURL(url);

}
