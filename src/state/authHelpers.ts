import type { UserRole } from '@/types';

export { AUTH_STORAGE_KEY } from '@/lib/apiConfig';

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getDashboardPathForRole(role: UserRole) {
  if (role === 'client') return '/herramientas/auditorias?tab=summary';
  if (role === 'utilidades') return '/utilidades';
  return '/dashboard?continue=1';
}

export function mapBackendRoleToFrontend(roleCode?: string | null): UserRole {
  if (!roleCode) return 'client';
  const code = roleCode.toLowerCase();
  if (code === 'client' || code === 'customer') return 'client';
  if (code === 'sales_operator' || code === 'seller' || code === 'vendor') return 'seller';
  if (code === 'utilidades') return 'utilidades';
  if ([
    'superadmin',
    'marketplace_admin',
    'agency_manager',
    'support_moderator',
    'content_manager',
    'analyst',
  ].includes(code)) return 'admin';
  // Principio de mínimo privilegio: un rol desconocido nunca se convierte en admin.
  return 'client';
}
