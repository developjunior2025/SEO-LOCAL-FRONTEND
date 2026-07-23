import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  mapBackendRoleToFrontend,
  normalizeEmail,
  tryDemoLogin,
  getDashboardPathForRole,
} from '@/state/authHelpers';

beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'true');
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
    expect(tryDemoLogin('cliente@clinicasonrisa.com', 'Demo1234')).toBeTruthy();
    expect(tryDemoLogin('cliente@clinicasonrisa.com', 'wrong')).toBeNull();
    expect(tryDemoLogin('unknown@example.com', 'Demo1234')).toBeNull();
  });

  it('bloquea login demo cuando el flag está desactivado', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_AUTH', 'false');
    expect(tryDemoLogin('cliente@clinicasonrisa.com', 'Demo1234')).toBeNull();
  });

  it('deriva dashboard path por rol', () => {
    expect(getDashboardPathForRole('client')).toBe('/herramientas/auditorias?tab=summary');
    expect(getDashboardPathForRole('admin')).toBe('/dashboard');
    expect(getDashboardPathForRole('seller')).toBe('/dashboard');
  });
});
