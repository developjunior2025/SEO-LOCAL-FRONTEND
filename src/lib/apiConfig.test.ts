import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiError,
  getApiBaseUrl,
  getApiTimeout,
  isDemoAuthEnabled,
  isDemoDataEnabled,
  apiFetch,
  clearApiSession,
  DASHBOARD_TOKEN_KEY,
  AUTH_STORAGE_KEY,
} from '@/lib/apiConfig';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('VITE_API_URL', '');
  vi.stubEnv('VITE_API_TIMEOUT', '');
  vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'false');
  vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'false');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('apiConfig', () => {
  it('devuelve VITE_API_URL cuando está configurada', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/api/v1');
    expect(getApiBaseUrl()).toBe('https://api.example.com/api/v1');
  });

  it('en desarrollo hace fallback a localhost:4001', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(getApiBaseUrl()).toBe('http://localhost:4001/api/v1');
  });

  it('lee VITE_API_TIMEOUT con fallback 15000', () => {
    expect(getApiTimeout()).toBe(15000);
    vi.stubEnv('VITE_API_TIMEOUT', '8000');
    expect(getApiTimeout()).toBe(8000);
  });

  it('detecta flags de demo correctamente', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'true');
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'true');
    expect(isDemoAuthEnabled()).toBe(true);
    expect(isDemoDataEnabled()).toBe(true);

    vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'false');
    expect(isDemoAuthEnabled()).toBe(false);
  });

  it('limpia tokens de sesión y emite evento de logout', () => {
    const listener = vi.fn();
    window.addEventListener('seo-dashboard-logout', listener);
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'x');
    localStorage.setItem(AUTH_STORAGE_KEY, 'y');
    clearApiSession();
    expect(localStorage.getItem(DASHBOARD_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(listener).toHaveBeenCalled();
    window.removeEventListener('seo-dashboard-logout', listener);
  });

  it('añade automáticamente Bearer desde localStorage', async () => {
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'stored-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    });
    globalThis.fetch = fetchMock;

    await apiFetch('/test');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get('Authorization')).toBe('Bearer stored-token');
  });

  it('classifica error 401 como unauthorized y limpia sesión', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Unauthorized' }),
    });
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'token');
    localStorage.setItem(AUTH_STORAGE_KEY, 'user');

    await expect(apiFetch('/test')).rejects.toThrow(ApiError);
    try {
      await apiFetch('/test');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('unauthorized');
    }
    expect(localStorage.getItem(DASHBOARD_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('classifica error 403 como forbidden y limpia sesión', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Forbidden' }),
    });
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'token');

    await expect(apiFetch('/test')).rejects.toThrow(ApiError);
    try {
      await apiFetch('/test');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('forbidden');
    }
    expect(localStorage.getItem(DASHBOARD_TOKEN_KEY)).toBeNull();
  });
});
