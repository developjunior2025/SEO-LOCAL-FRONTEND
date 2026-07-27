import { describe, expect, it } from 'vitest';
import {
  mapBackendRoleToFrontend,
  normalizeEmail,
  getDashboardPathForRole,
} from '@/state/authHelpers';

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

  it('deriva dashboard path por rol', () => {
    expect(getDashboardPathForRole('client')).toBe('/herramientas/auditorias?tab=summary');
    expect(getDashboardPathForRole('admin')).toBe('/dashboard');
    expect(getDashboardPathForRole('seller')).toBe('/dashboard');
  });
});
