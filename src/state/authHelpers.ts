import type { UserRole } from '@/types';

export const AUTH_STORAGE_KEY = 'seolocal_user_v1';

export function getDashboardPathForRole(role: UserRole) {
  if (role === 'client') return '/herramientas/auditorias?tab=summary';
  return '/dashboard';
}
