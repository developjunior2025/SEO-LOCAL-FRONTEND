import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { adminApi } from '@/services/adminApi';
import { DASHBOARD_TOKEN_KEY, AUTH_STORAGE_KEY } from '@/lib/apiConfig';

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('VITE_API_URL', 'http://localhost:4001/api/v1');
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('adminApi.logout', () => {
  it('llama POST /admin/auth/logout y limpia sesión local', async () => {
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'valid-token');
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ id: '1', email: 'a@b.com' }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    });
    globalThis.fetch = fetchMock;

    await adminApi.logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/admin/auth/logout');
    expect((init as RequestInit).method).toBe('POST');
    expect(localStorage.getItem(DASHBOARD_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('limpia sesión local incluso si el logout remoto falla', async () => {
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'valid-token');
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ id: '1', email: 'a@b.com' }));

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Server error' }),
    });

    await adminApi.logout();

    expect(localStorage.getItem(DASHBOARD_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});

describe('adminApi authentication contracts', () => {
  it('normaliza displayName y baseRole en login', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        token: 'token-1',
        refreshToken: 'refresh-1',
        user: {
          id: 1,
          login: 'superadmin@seolocal.local',
          displayName: 'Superadministrador SEOLOCAL',
          roleCode: 'superadmin',
          roleName: 'Superadministrador',
          permissions: ['users.read'],
        },
      }),
    });

    const session = await adminApi.login('superadmin@seolocal.local', 'password');
    expect(session.user.name).toBe('Superadministrador SEOLOCAL');
    expect(session.user.baseRole).toBe('superadmin');
    expect(localStorage.getItem(DASHBOARD_TOKEN_KEY)).toBe('token-1');
  });

  it('restaura /me aunque el backend no repita el token', async () => {
    localStorage.setItem(DASHBOARD_TOKEN_KEY, 'stored-token');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        user: {
          id: 2,
          login: 'cliente@seolocal.local',
          name: 'Cliente SEOLOCAL',
          baseRole: 'client',
          roleCode: 'client',
          roleName: 'Cliente',
          permissions: [],
        },
      }),
    });

    const session = await adminApi.me();
    expect(session.token).toBe('stored-token');
    expect(session.user.baseRole).toBe('client');
  });
});
