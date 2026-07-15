import type { User, UserRole } from '@/types';

export const AUTH_STORAGE_KEY = 'seolocal_user_v1';

export const DEMO_USERS: User[] = [
  { id: 'client-1', email: 'cliente@clinicasonrisa.com', name: 'Carlos Martínez', role: 'client' },
  { id: 'seller-1', email: 'vendedor@seolocal.com', name: 'Laura Gómez', role: 'seller' },
  { id: 'admin-1', email: 'admin@seolocal.com', name: 'Andrés Torres', role: 'admin' },
];

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function getDashboardPathForRole(role: UserRole) {
  if (role === 'client') return '/herramientas/auditorias?tab=summary';
  return '/dashboard';
}
