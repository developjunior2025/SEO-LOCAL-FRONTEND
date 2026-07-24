import type { User, UserRole } from '@/types';
import { isDemoAuthEnabled } from '@/lib/apiConfig';

export { AUTH_STORAGE_KEY } from '@/lib/apiConfig';

const DEMO_USERS: User[] = [
  { id: 'client-1', email: 'cliente-demo@local.dev', name: 'Carlos Martínez', role: 'client' },
  { id: 'seller-1', email: 'vendedor-demo@local.dev', name: 'Laura Gómez', role: 'seller' },
  { id: 'admin-1', email: 'admin-demo@local.dev', name: 'Andrés Torres', role: 'admin' },
];

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

export function getDemoPassword(): string {
  // Only used when VITE_ENABLE_DEMO_AUTH=true in development.
  return import.meta.env.VITE_DEMO_AUTH_PASSWORD || 'dev-demo-password';
}

export function tryDemoLogin(email: string, password: string): User | null {
  if (!isDemoAuthEnabled()) return null;
  const normalized = normalizeEmail(email);
  const found = DEMO_USERS.find((u) => normalizeEmail(u.email) === normalized);
  if (!found) return null;
  if (password !== getDemoPassword()) return null;
  return found;
}
