import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, getApiBaseUrl, isDemoAuthEnabled, isDemoDataEnabled, apiFetch, clearApiSession } from '@/lib/apiConfig';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('VITE_API_URL', '');
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
    vi.stubEnv('NODE_ENV', 'development');
    expect(getApiBaseUrl()).toBe('http://localhost:4001/api/v1');
  });

  it('detecta flags de demo correctamente', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'true');
    vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'true');
    expect(isDemoAuthEnabled()).toBe(true);
    expect(isDemoDataEnabled()).toBe(true);

    vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'false');
    expect(isDemoAuthEnabled()).toBe(false);
  });

  it('limpia tokens de sesión', () => {
    localStorage.setItem('seo_local_dashboard_token', 'x');
    localStorage.setItem('seo_local_dashboard_api_base', 'y');
    clearApiSession();
    expect(localStorage.getItem('seo_local_dashboard_token')).toBeNull();
    expect(localStorage.getItem('seo_local_dashboard_api_base')).toBeNull();
  });

  it('classifica error 401 como unauthorized', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Unauthorized' }),
    });

    await expect(apiFetch('/test')).rejects.toThrow(ApiError);
    try {
      await apiFetch('/test');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('unauthorized');
    }
    expect(localStorage.getItem('seo_local_dashboard_token')).toBeNull();
  });
});
