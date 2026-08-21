const DEFAULT_DEV_API_URL = 'http://localhost:4001/api/v1';

export const DASHBOARD_TOKEN_KEY = 'seo_local_dashboard_token';
export const REFRESH_TOKEN_KEY = 'seo_local_dashboard_refresh_token';
export const AUTH_STORAGE_KEY = 'seolocal_user_v1';

export function getApiTimeout(): number {
  const configured = import.meta.env.VITE_API_TIMEOUT;
  if (configured) {
    const parsed = Number(configured);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return 15000;
}

export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'server'
  | 'unknown'
  | 'credentials'
  | 'json';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ApiErrorCode,
    public readonly status?: number,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return String(configured).replace(/\/$/, '');
  if (import.meta.env.PROD) {
    throw new ApiError(
      'VITE_API_URL es obligatoria en producción',
      'unknown'
    );
  }
  return DEFAULT_DEV_API_URL;
}

export function isDemoAuthEnabled(): boolean {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true');
}

export function isDemoDataEnabled(): boolean {
  return Boolean(import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true');
}

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(DASHBOARD_TOKEN_KEY);
}

function readStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DASHBOARD_TOKEN_KEY, accessToken);
  if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(base: string): Promise<string | null> {
  const refreshToken = readStoredRefreshToken();
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${base}/admin/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return null;
      const payload = await response.json() as { token?: string; refreshToken?: string };
      if (!payload.token) return null;
      storeTokens(payload.token, payload.refreshToken);
      return payload.token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DASHBOARD_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function emitLogoutEvent(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('seo-dashboard-logout'));
}

export function clearApiSession(): void {
  clearStoredAuth();
  emitLogoutEvent();
}

// V5386_API_ERROR_DETAIL_PRESERVATION
function extractApiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const message = record.message;
    if (Array.isArray(message)) {
      const details = message.map((item) => String(item)).filter(Boolean);
      if (details.length) return details.join(' · ');
    }
    if (typeof message === 'string' && message.trim()) return message.trim();
    const error = record.error;
    if (typeof error === 'string' && error.trim()) return error.trim();
  }
  return `HTTP ${status}`;
}

function classifyError(error: unknown, status?: number): ApiErrorCode {
  if (error instanceof ApiError) return error.code;
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status && status >= 500) return 'server';
  if (status && status >= 400) return 'credentials';
  if (error instanceof TypeError || (error instanceof Error && /fetch|network/i.test(error.message))) {
    return 'timeout';
  }
  return 'unknown';
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: { token?: string; signal?: AbortSignal; retryAuth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;
  // SEOLOCAL_LOCAL_VISIBILITY_TIMEOUT_POLICY_V1
  // Long-running tools may opt into a larger timeout without changing the global default.
  const timeout = options.timeoutMs ?? getApiTimeout();

  const headers = new Headers(init.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = options.token ?? readStoredToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  const externalSignals: AbortSignal[] = [controller.signal];
  if (options.signal) externalSignals.push(options.signal);
  if (init.signal) externalSignals.push(init.signal as AbortSignal);

  const signal =
    externalSignals.length === 1
      ? controller.signal
      : AbortSignal.any(externalSignals);

  try {
    const response = await fetch(url, { ...init, headers, signal });
    window.clearTimeout(timeoutId);

    const authEndpoint = /\/admin\/auth\/(login|refresh|logout|logout-refresh)$/.test(path);
    if (response.status === 401 && !options.retryAuth && !authEndpoint) {
      const refreshedToken = await refreshAccessToken(base);
      if (refreshedToken) {
        return apiFetch<T>(path, init, { ...options, token: refreshedToken, retryAuth: true });
      }
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    let payload: unknown = null;
    try {
      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = text ? { message: text } : null;
      }
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = extractApiErrorMessage(payload, response.status);
      const code = classifyError(new Error(message), response.status);
      if (code === 'unauthorized') {
        clearStoredAuth();
        emitLogoutEvent();
      }
      throw new ApiError(message, code, response.status, payload);
    }

    return payload as T;
  } catch (error: unknown) {
    window.clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    const code = error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network';
    throw new ApiError(
      code === 'timeout' ? 'La petición tardó demasiado' : 'No se pudo conectar con el servidor',
      code
    );
  }
}
