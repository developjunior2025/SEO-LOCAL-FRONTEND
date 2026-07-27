import type { UserRole } from '@/types';

export { AUTH_STORAGE_KEY } from '@/lib/apiConfig';

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getDashboardPathForRole(role: UserRole) {
  if (role === 'client') return '/herramientas/auditorias?tab=summary';
  return '/dashboard';
}

export function mapBackendRoleToFrontend(roleCode?: string | null): UserRole {
  if (!roleCode) return 'admin';
  const code = roleCode.toLowerCase();
  if (code === 'client' || code === 'customer') return 'client';
  if (code === 'sales_operator' || code === 'seller' || code === 'vendor') return 'seller';
  return 'admin';
}
