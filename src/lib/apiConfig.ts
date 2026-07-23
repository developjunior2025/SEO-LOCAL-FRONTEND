const DEFAULT_DEV_API_URL = 'http://localhost:4001/api/v1';

export const DASHBOARD_TOKEN_KEY = 'seo_local_dashboard_token';
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

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DASHBOARD_TOKEN_KEY);
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
  options: { token?: string; signal?: AbortSignal } = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;
  const timeout = getApiTimeout();

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
      const message =
        (payload && typeof payload === 'object' && ('error' in payload || 'message' in payload)
          ? String((payload as Record<string, unknown>).error || (payload as Record<string, unknown>).message)
          : null) || `HTTP ${response.status}`;
      const code = classifyError(new Error(message), response.status);
      if (code === 'unauthorized' || code === 'forbidden') {
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
