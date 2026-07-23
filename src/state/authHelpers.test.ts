import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mapBackendRoleToFrontend,
  normalizeEmail,
  tryDemoLogin,
  getDashboardPathForRole,
  getDemoPassword,
} from '@/state/authHelpers';

beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'true');
  vi.stubEnv('VITE_DEMO_AUTH_PASSWORD', 'dev-demo-password');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('authHelpers', () => {
  it('normaliza emails correctamente', () => {
    expect(normalizeEmail('  Test@Email.COM ')).toBe('test@email.com');
  });

  it('mapea roles del backend a roles del frontend', () => {
    expect(mapBackendRoleToFrontend('client')).toBe('client');
    expect(mapBackendRoleToFrontend('sales_operator')).toBe('seller');
    expect(mapBackendRoleToFrontend('superadmin')).toBe('admin');
    expect(mapBackendRoleToFrontend('marketplace_admin')).toBe('admin');
    expect(mapBackendRoleToFrontend(null)).toBe('admin');
  });

  it('permite login demo solo cuando el flag está activo', () => {
    const password = getDemoPassword();
    expect(tryDemoLogin('cliente-demo@local.dev', password)).toBeTruthy();
    expect(tryDemoLogin('cliente-demo@local.dev', 'wrong')).toBeNull();
    expect(tryDemoLogin('unknown@example.com', password)).toBeNull();
  });

  it('bloquea login demo cuando el flag está desactivado', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'false');
    expect(tryDemoLogin('cliente-demo@local.dev', getDemoPassword())).toBeNull();
  });

  it('deriva dashboard path por rol', () => {
    expect(getDashboardPathForRole('client')).toBe('/herramientas/auditorias?tab=summary');
    expect(getDashboardPathForRole('admin')).toBe('/dashboard');
    expect(getDashboardPathForRole('seller')).toBe('/dashboard');
  });
});
