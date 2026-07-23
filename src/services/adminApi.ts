import { apiFetch, clearApiSession } from '@/lib/apiConfig';

const TOKEN_KEY = 'seo_local_dashboard_token';

export type DashboardUser = {
  id: number;
  login: string;
  name: string;
  baseRole: string;
  roleCode: string;
  roleName: string;
  agencyPartnerId?: number | null;
  permissions: string[];
};

export type DashboardSession = {
  token: string;
  user: DashboardUser;
};

export type AdminListResponse<T = Record<string, unknown>> = {
  items: T[];
  meta?: Record<string, unknown>;
};

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  clearApiSession();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, init, { token: getToken() });
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}
function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
}
function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export const adminApi = {
  get token() { return getToken(); },

  async login(login: string, password: string) {
    const payload = await post<DashboardSession>('/admin/auth/login', { login, password });
    setToken(payload.token);
    return payload;
  },
  me: () => request<DashboardSession>('/admin/auth/me'),
  logout: () => clearAdminToken(),

  summary: () => request<Record<string, unknown>>('/admin/dashboard/summary'),
  reports: () => request<Record<string, unknown>>('/admin/reports/operational'),
  roles: () => request<AdminListResponse>('/admin/roles'),
  permissions: () => request<AdminListResponse>('/admin/permissions'),

  users: () => request<AdminListResponse>('/admin/users'),
  createUser: (data: Record<string, unknown>) => post('/admin/users', data),
  updateUser: (id: number, data: Record<string, unknown>) => put(`/admin/users/${id}`, data),
  resetUserPassword: (id: number, password: string) => post(`/admin/users/${id}/reset-password`, { password }),

  agencies: () => request<AdminListResponse>('/admin/agencies'),
  createAgency: (data: Record<string, unknown>) => post('/admin/agencies', data),
  updateAgency: (id: number, data: Record<string, unknown>) => put(`/admin/agencies/${id}`, data),
  updateAgencyStatus: (id: number, status: string) => post(`/admin/agencies/${id}/status`, { status }),
  agencyModules: (id: number) => request<Record<string, unknown>>(`/admin/agencies/${id}/modules`),
  upsertAgencyModule: (id: number, module: string, data: unknown) => put(`/admin/agencies/${id}/modules/${module}`, data),

  agencyServices: (agencyId?: number) => request<AdminListResponse>(`/admin/agency-services${agencyId ? `?agencyId=${agencyId}` : ''}`),
  assignAgencyService: (data: Record<string, unknown>) => post('/admin/agency-services', data),
  updateAgencyService: (id: number, data: Record<string, unknown>) => put(`/admin/agency-services/${id}`, data),
  deleteAgencyService: (id: number) => del(`/admin/agency-services/${id}`),

  services: () => request<AdminListResponse>('/admin/services'),
  createService: (data: Record<string, unknown>) => post('/admin/services', data),
  updateService: (id: number, data: Record<string, unknown>) => put(`/admin/services/${id}`, data),
  duplicateService: (id: number) => post(`/admin/services/${id}/duplicate`, {}),

  leads: () => request<AdminListResponse>('/admin/leads'),
  createLead: (data: Record<string, unknown>) => post('/admin/leads', data),
  updateLead: (id: number, data: Record<string, unknown>) => put(`/admin/leads/${id}`, data),
  addLeadNote: (id: number, note: string) => post(`/admin/leads/${id}/notes`, { note }),
  stages: () => request<AdminListResponse>('/admin/leads/stages'),

  reviews: () => request<AdminListResponse>('/admin/reviews'),
  createReview: (data: Record<string, unknown>) => post('/admin/reviews', data),
  updateReview: (id: number, data: Record<string, unknown>) => put(`/admin/reviews/${id}`, data),
  moderateReview: (id: number, action: string, data: Record<string, unknown> = {}) => post(`/admin/reviews/${id}/moderate`, { action, ...data }),

  plans: () => request<AdminListResponse>('/admin/plans'),
  createPlan: (data: Record<string, unknown>) => post('/admin/plans', data),
  updatePlan: (id: number, data: Record<string, unknown>) => put(`/admin/plans/${id}`, data),
  subscriptions: () => request<AdminListResponse>('/admin/subscriptions'),
  assignSubscription: (data: Record<string, unknown>) => post('/admin/subscriptions', data),
  updateSubscription: (id: number, data: Record<string, unknown>) => put(`/admin/subscriptions/${id}`, data),

  categories: () => request<AdminListResponse>('/admin/categories'),
  createCategory: (data: Record<string, unknown>) => post('/admin/categories', data),
  updateCategory: (id: number, data: Record<string, unknown>) => put(`/admin/categories/${id}`, data),

  activity: () => request<AdminListResponse>('/admin/activity'),
};
