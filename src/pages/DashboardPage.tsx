import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  adminApi,
  clearAdminToken,
  DashboardSession,
  DashboardUser,
} from '@/services/adminApi';
import { ApiError } from '@/lib/apiConfig';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Building2,
  ClipboardList,
  Database,
  Edit3,
  FolderKanban,
  KeyRound,
  Layers3,
  Lock,
  LogOut,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Tags,
  UserCog,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type ModuleKey =
  | 'overview'
  | 'users'
  | 'agencies'
  | 'agencyProfile'
  | 'agencyServices'
  | 'services'
  | 'leads'
  | 'reviews'
  | 'plans'
  | 'categories'
  | 'reports'
  | 'activity';

type AdminRecord = Record<string, unknown>;

type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'password';

type FieldDef = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  permission?: string;
  placeholder?: string;
};

type ModuleDef = {
  key: ModuleKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  readPermission?: string;
  managePermission?: string;
  listMethod?: string;
  createMethod?: string;
  updateMethod?: string;
  fields?: FieldDef[];
  idKey?: string;
  createLabel?: string;
  emptyLabel?: string;
};

const modules: ModuleDef[] = [
  {
    key: 'overview',
    title: 'Panel general',
    subtitle: 'Resumen ejecutivo, salud comercial y accesos rápidos.',
    icon: BarChart3,
    readPermission: 'reports.read',
  },
  {
    key: 'users',
    title: 'Autenticación, usuarios y roles',
    subtitle: 'Usuarios internos, usuarios de agencia, roles, permisos, activación y reset de contraseña.',
    icon: KeyRound,
    readPermission: 'users.read',
    managePermission: 'users.manage',
    listMethod: 'users',
    createMethod: 'createUser',
    updateMethod: 'updateUser',
    idKey: 'id',
    createLabel: 'Crear usuario',
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'login', label: 'Usuario / email' },
      { key: 'email', label: 'Email' },
      { key: 'password', label: 'Clave inicial / nueva clave', type: 'password', placeholder: 'Solo llenar para crear o resetear' },
      { key: 'dashboard_role_code', label: 'Rol funcional', type: 'select', options: ['superadmin', 'marketplace_admin', 'agency_manager', 'support_moderator', 'sales_operator', 'content_manager', 'analyst'] },
      { key: 'agency_partner_id', label: 'ID agencia asignada', type: 'number' },
      { key: 'active', label: 'Activo', type: 'checkbox' },
    ],
  },
  {
    key: 'agencies',
    title: 'Dashboard dueño del marketplace',
    subtitle: 'Crear, editar, publicar, suspender y controlar agencias del marketplace.',
    icon: Building2,
    readPermission: 'agencies.read',
    managePermission: 'agencies.update',
    listMethod: 'agencies',
    createMethod: 'createAgency',
    updateMethod: 'updateAgency',
    idKey: 'id',
    createLabel: 'Crear agencia',
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'website', label: 'Website' },
      { key: 'city', label: 'Ciudad' },
      { key: 'country_code', label: 'País' },
      { key: 'logo_letter', label: 'Letra del logo' },
      { key: 'logo_bg_color', label: 'Color fondo logo' },
      { key: 'image_url', label: 'Imagen hero / perfil URL', type: 'textarea' },
      { key: 'summary', label: 'Resumen público', type: 'textarea' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'focus', label: 'Enfoque', type: 'textarea' },
      { key: 'methodology', label: 'Metodología', type: 'textarea' },
      { key: 'client_profile', label: 'Cliente ideal', type: 'textarea' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'reviews_count', label: 'N.º reseñas', type: 'number' },
      { key: 'starting_price', label: 'Precio desde', type: 'number' },
      { key: 'is_verified', label: 'Verificada', type: 'checkbox' },
      { key: 'is_top_rated', label: 'Top rated', type: 'checkbox' },
      { key: 'status', label: 'Estado', type: 'select', options: ['draft', 'review', 'published', 'suspended'] },
    ],
  },
  {
    key: 'agencyProfile',
    title: 'Gestión de perfil de agencia',
    subtitle: 'GBP, horarios, equipo, certificaciones, canales y módulos visibles del perfil.',
    icon: UserCog,
    readPermission: 'agency_profile.modules',
    managePermission: 'agency_profile.modules',
  },
  {
    key: 'agencyServices',
    title: 'Servicios FUR-S por agencia',
    subtitle: 'Asignación real de servicios a agencias, precio propio, capacidad, estado y destacado.',
    icon: ClipboardList,
    readPermission: 'agency_services.read',
    managePermission: 'agency_services.manage',
    listMethod: 'agencyServices',
    createMethod: 'assignAgencyService',
    updateMethod: 'updateAgencyService',
    idKey: 'id',
    createLabel: 'Asignar servicio a agencia',
    fields: [
      { key: 'agency_partner_id', label: 'ID agencia', type: 'number' },
      { key: 'product_tmpl_id', label: 'ID servicio FUR-S', type: 'number' },
      { key: 'title_override', label: 'Título visible' },
      { key: 'subtitle_override', label: 'Descripción visible', type: 'textarea' },
      { key: 'custom_price', label: 'Precio propio', type: 'number' },
      { key: 'delivery_days', label: 'Días entrega', type: 'number' },
      { key: 'capacity_monthly', label: 'Capacidad mensual', type: 'number' },
      { key: 'status', label: 'Estado', type: 'select', options: ['active', 'paused', 'review', 'archived'] },
      { key: 'is_featured', label: 'Destacado', type: 'checkbox' },
      { key: 'active', label: 'Activo', type: 'checkbox' },
    ],
  },
  {
    key: 'services',
    title: 'Catálogo global FUR-S',
    subtitle: 'Crear, duplicar, editar, activar/desactivar y controlar servicios globales del marketplace.',
    icon: Database,
    readPermission: 'services.read',
    managePermission: 'services.manage',
    listMethod: 'services',
    createMethod: 'createService',
    updateMethod: 'updateService',
    idKey: 'id',
    createLabel: 'Crear servicio FUR-S',
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'default_code', label: 'Código' },
      { key: 'description_sale', label: 'Descripción', type: 'textarea' },
      { key: 'seo_category_id', label: 'ID categoría', type: 'number' },
      { key: 'list_price', label: 'Precio base', type: 'number' },
      { key: 'currency_code', label: 'Moneda' },
      { key: 'delivery_days', label: 'Días entrega', type: 'number' },
      { key: 'is_popular', label: 'Popular', type: 'checkbox' },
      { key: 'active', label: 'Activo', type: 'checkbox' },
    ],
  },
  {
    key: 'leads',
    title: 'Leads y cotizaciones',
    subtitle: 'Pipeline comercial: crear, asignar, cambiar etapa, probabilidad, valor y notas.',
    icon: FolderKanban,
    readPermission: 'leads.read',
    managePermission: 'leads.manage',
    listMethod: 'leads',
    createMethod: 'createLead',
    updateMethod: 'updateLead',
    idKey: 'id',
    createLabel: 'Crear lead',
    fields: [
      { key: 'name', label: 'Título' },
      { key: 'contact_name', label: 'Contacto' },
      { key: 'email_from', label: 'Email' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'company_name', label: 'Empresa' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'target_location', label: 'Ciudad objetivo' },
      { key: 'expected_revenue', label: 'Valor esperado', type: 'number' },
      { key: 'probability', label: 'Probabilidad %', type: 'number' },
      { key: 'stage_name', label: 'Etapa', type: 'select', options: ['Nuevo', 'Contactado', 'Calificado', 'Cotización enviada', 'Negociación', 'Ganado', 'Perdido'] },
      { key: 'agency_partner_id', label: 'ID agencia asignada', type: 'number' },
    ],
  },
  {
    key: 'reviews',
    title: 'Reseñas y moderación',
    subtitle: 'Aprobar, rechazar, ocultar, verificar, destacar y responder reseñas.',
    icon: Star,
    readPermission: 'reviews.read',
    managePermission: 'reviews.moderate',
    listMethod: 'reviews',
    createMethod: 'createReview',
    updateMethod: 'updateReview',
    idKey: 'id',
    createLabel: 'Crear reseña',
    fields: [
      { key: 'agency_partner_id', label: 'ID agencia', type: 'number' },
      { key: 'author', label: 'Autor' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'title', label: 'Título' },
      { key: 'body', label: 'Comentario', type: 'textarea' },
      { key: 'status', label: 'Estado', type: 'select', options: ['pending', 'published', 'rejected', 'hidden', 'reported'] },
      { key: 'verified_purchase', label: 'Verificada', type: 'checkbox' },
      { key: 'agency_response', label: 'Respuesta agencia', type: 'textarea' },
    ],
  },
  {
    key: 'plans',
    title: 'Planes y suscripciones',
    subtitle: 'Planes comerciales, límites, badges, soporte y asignación a agencias.',
    icon: WalletCards,
    readPermission: 'plans.read',
    managePermission: 'plans.manage',
    listMethod: 'plans',
    createMethod: 'createPlan',
    updateMethod: 'updatePlan',
    idKey: 'id',
    createLabel: 'Crear plan',
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'plan_code', label: 'Código' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'monthly_price', label: 'Precio mensual', type: 'number' },
      { key: 'currency_code', label: 'Moneda' },
      { key: 'max_services', label: 'Máx. servicios', type: 'number' },
      { key: 'max_leads', label: 'Máx. leads', type: 'number' },
      { key: 'featured_listing', label: 'Listado destacado', type: 'checkbox' },
      { key: 'verified_badge', label: 'Badge verificado', type: 'checkbox' },
      { key: 'support_level', label: 'Nivel soporte', type: 'select', options: ['standard', 'priority', 'enterprise'] },
      { key: 'active', label: 'Activo', type: 'checkbox' },
    ],
  },
  {
    key: 'categories',
    title: 'Categorías y servicios',
    subtitle: 'Taxonomía, landings, orden, estado y contenido base de categorías.',
    icon: Tags,
    readPermission: 'categories.read',
    managePermission: 'categories.manage',
    listMethod: 'categories',
    createMethod: 'createCategory',
    updateMethod: 'updateCategory',
    idKey: 'id',
    createLabel: 'Crear categoría',
    fields: [
      { key: 'name', label: 'Nombre' },
      { key: 'slug', label: 'Slug' },
      { key: 'description', label: 'Descripción SEO', type: 'textarea' },
      { key: 'query_name', label: 'Query comercial' },
      { key: 'services_count', label: 'N.º servicios', type: 'number' },
      { key: 'sequence', label: 'Orden', type: 'number' },
      { key: 'active', label: 'Activo', type: 'checkbox' },
    ],
  },
  {
    key: 'reports',
    title: 'Métricas, reportes y control operativo',
    subtitle: 'Indicadores por agencia, ciudad, categoría, pipeline, contenido y calidad.',
    icon: Layers3,
    readPermission: 'reports.read',
  },
  {
    key: 'activity',
    title: 'Auditoría y actividad',
    subtitle: 'Historial de cambios reales realizados desde el dashboard.',
    icon: Activity,
    readPermission: 'audit.read',
    listMethod: 'activity',
    idKey: 'id',
  },
];

function has(user: DashboardUser | null, permission?: string) {
  if (!permission) return true;
  return Boolean(user?.permissions?.includes(permission));
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function str(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function coerceValue(field: FieldDef, value: unknown) {
  if (field.type === 'number') return value === '' || value === null || value === undefined ? null : Number(value);
  if (field.type === 'checkbox') return Boolean(value);
  return value;
}

function LoginCard() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!login.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const session = await adminApi.login(login, password);
      window.dispatchEvent(new CustomEvent('seo-dashboard-login', { detail: session }));
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('No se pudo conectar')) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[calc(100vh-90px)] bg-[#F5F5F5] flex items-start justify-center px-4 py-14">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-[34px] bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-[#333] text-white px-10 py-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4" /> Dashboard Enterprise conectado a BD
          </div>
          <h1 className="mt-7 text-4xl font-black">Gestión interna SEOLOCAL</h1>
          <p className="mt-3 text-white/80 max-w-xl">Roles reales, permisos por competencia y edición directa de agencias, servicios FUR-S, leads, reseñas, planes, categorías y reportes.</p>
        </div>
        <div className="px-10 py-9 space-y-5">
          <label className="block">
            <span className="text-xs font-black uppercase text-gray-500">Usuario</span>
            <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="usuario@empresa.com" className="mt-2 w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#D32323]" />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase text-gray-500">Contraseña</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-2 w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none focus:border-[#D32323]" />
          </label>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-[#D32323]">{error}</div>}
          <button disabled={loading} className="w-full rounded-2xl bg-[#D32323] px-5 py-4 text-white font-black shadow-lg hover:bg-[#b51d1d] disabled:opacity-60">
            {loading ? 'Validando...' : 'Entrar al dashboard'}
          </button>
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-600">
            <p className="font-black text-[#333] mb-2">Acceso interno</p>
            <p>Usa una cuenta administrativa provisionada en la base de datos. Las credenciales seed ya no se muestran en la interfaz.</p>
          </div>
        </div>
      </form>
    </section>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number | null | undefined; icon: LucideIcon }) {
  return (
    <div className="rounded-[24px] bg-white border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase text-gray-500">{label}</span>
        <Icon className="w-5 h-5 text-[#D32323]" />
      </div>
      <strong className="mt-4 block text-3xl font-black text-[#333]">{value ?? 0}</strong>
    </div>
  );
}

function EditModal({
  title,
  fields,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  fields: FieldDef[];
  initial: AdminRecord;
  onClose: () => void;
  onSave: (data: AdminRecord) => Promise<void>;
}) {
  const [form, setForm] = useState<AdminRecord>(() => ({ ...initial }));
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const data: AdminRecord = {};
    fields.forEach((field) => {
      data[field.key] = coerceValue(field, form[field.key]);
    });
    try {
      await onSave(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white shadow-2xl border border-gray-200">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-[#D32323]">Edición real en BD</p>
            <h2 className="text-2xl font-black text-[#333]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 p-2 hover:bg-gray-50"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field) => {
            const value = form[field.key];
            if (field.type === 'textarea') {
              return (
                <label key={field.key} className="md:col-span-2">
                  <span className="text-xs font-black uppercase text-gray-500">{field.label}</span>
                  <textarea value={stringify(value)} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="mt-2 w-full min-h-[110px] rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#D32323]" />
                </label>
              );
            }
            if (field.type === 'select') {
              return (
                <label key={field.key}>
                  <span className="text-xs font-black uppercase text-gray-500">{field.label}</span>
                  <select value={stringify(value)} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#D32323] bg-white">
                    <option value="">Seleccionar...</option>
                    {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              );
            }
            if (field.type === 'checkbox') {
              return (
                <label key={field.key} className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-4">
                  <input type="checkbox" checked={Boolean(value)} onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })} />
                  <span className="text-sm font-black text-[#333]">{field.label}</span>
                </label>
              );
            }
            return (
              <label key={field.key}>
                <span className="text-xs font-black uppercase text-gray-500">{field.label}</span>
                <input type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} placeholder={field.placeholder} value={stringify(value)} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#D32323]" />
              </label>
            );
          })}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-gray-200 px-5 py-3 font-black text-[#333] hover:bg-gray-50">Cancelar</button>
          <button disabled={saving} className="rounded-2xl bg-[#D32323] px-5 py-3 font-black text-white hover:bg-[#b51d1d] disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  );
}

function GenericModule({
  module,
  user,
}: {
  module: ModuleDef;
  user: DashboardUser | null;
}) {
  const [items, setItems] = useState<AdminRecord[]>([]);
  const [meta, setMeta] = useState<AdminRecord>({});
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const canManage = has(user, module.managePermission);

  const load = useCallback(async () => {
    if (!module.listMethod) return;
    setError('');
    setLoading(true);
    try {
      const api = adminApi as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
      const fn = api[module.listMethod];
      const result = (await fn()) as { items?: AdminRecord[]; meta?: AdminRecord };
      setItems(result.items || []);
      setMeta(result.meta || {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el módulo.');
    } finally {
      setLoading(false);
    }
  }, [module.listMethod]);

  /* eslint-disable react-hooks/set-state-in-effect -- Carga inicial del módulo; migrar a React Query queda fuera del alcance de esta estabilización. */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const fields = module.fields || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [items, query]);

  async function saveEdit(data: AdminRecord) {
    const id = editing?.[module.idKey || 'id'];
    const api = adminApi as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
    const fn = api[module.updateMethod || ''];
    setNotice('');
    await fn(Number(id), data);
    await load();
    setNotice('Cambios guardados correctamente.');
  }

  async function saveCreate(data: AdminRecord) {
    const api = adminApi as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
    const fn = api[module.createMethod || ''];
    setNotice('');
    await fn(data);
    await load();
    setNotice('Registro creado correctamente.');
  }

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await action();
      await load();
      setNotice(successMessage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo ejecutar la acción.');
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(() => {
    const sample = items[0] || {};
    const keys = Object.keys(sample).filter((key) => !['payload', 'description_sale', 'summary', 'body', 'description'].includes(key));
    return keys.slice(0, 7);
  }, [items]);

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#D32323]">Módulo conectado a PostgreSQL</p>
            <h2 className="mt-1 text-2xl font-black text-[#333]">{module.title}</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-3xl">{module.subtitle}</p>
            {module.key === 'agencies' && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Verde: publicada y visible</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1"><span className="w-3 h-3 rounded-full bg-amber-400" /> Amarillo: vacaciones / pausa visible</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 text-[#D32323] px-3 py-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Rojo: suspendida y oculta del homepage</span>
              </div>
            )}
            {Object.keys(meta).length > 0 && <p className="mt-2 text-xs font-bold text-gray-400">Meta: {JSON.stringify(meta)}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button disabled={loading} onClick={load} className="rounded-2xl border border-gray-200 px-4 py-3 font-black text-sm text-[#333] hover:bg-gray-50 inline-flex items-center gap-2 disabled:opacity-60"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Actualizar'}</button>
            {canManage && module.createMethod && (
              <button onClick={() => setCreating(true)} className="rounded-2xl bg-[#D32323] px-4 py-3 font-black text-sm text-white hover:bg-[#b51d1d] inline-flex items-center gap-2"><Plus className="w-4 h-4" /> {module.createLabel || 'Crear'}</button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-[#D32323]">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{notice}</div>}

      <div className="rounded-[28px] bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en este módulo..." className="w-full outline-none text-sm font-semibold" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map((col) => <th key={col} className="px-5 py-3 font-black">{col}</th>)}
                <th className="px-5 py-3 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && filtered.map((item, index) => (
                <tr key={String(item.id ?? item.external_id ?? index)} className="hover:bg-gray-50/80">
                  {columns.map((col) => <td key={col} className="px-5 py-4 max-w-[260px] truncate font-semibold text-gray-700">{stringify(item[col])}</td>)}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {module.key === 'agencies' && has(user, 'agencies.update') && (
                        <button
                          type="button"
                          title="Semáforo: verde publicada, amarillo vacaciones, rojo oculta del homepage"
                          onClick={async () => {
                            const current = String(item.status || 'draft');
                            const next = current === 'published' ? 'review' : current === 'review' ? 'suspended' : 'published';
                            await adminApi.updateAgencyStatus(Number(item.id), next);
                            await load();
                          }}
                          className={`rounded-full w-9 h-9 border-2 shadow-sm transition-all ${
                            item.status === 'published'
                              ? 'bg-emerald-500 border-emerald-600 hover:bg-amber-400 hover:border-amber-500'
                              : item.status === 'review'
                                ? 'bg-amber-400 border-amber-500 hover:bg-red-500 hover:border-red-600'
                                : 'bg-red-500 border-red-600 hover:bg-emerald-500 hover:border-emerald-600'
                          }`}
                        />
                      )}
                      {module.key === 'services' && canManage && (
                        <button
                          type="button"
                          onClick={() => runAction(() => adminApi.duplicateService(Number(item.id)).then(() => Promise.resolve()), 'Servicio duplicado como borrador.')}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-[#333] hover:border-[#0074E0] hover:text-[#0074E0]"
                        >
                          Duplicar
                        </button>
                      )}
                      {module.key === 'agencyServices' && canManage && (
                        <button
                          type="button"
                          onClick={() => runAction(() => adminApi.deleteAgencyService(Number(item.id)).then(() => Promise.resolve()), 'Asignación archivada correctamente.')}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-[#D32323] hover:bg-red-50"
                        >
                          Archivar
                        </button>
                      )}
                      {module.key === 'leads' && canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            const note = window.prompt('Escribe una nota breve para este lead:');
                            if (!note?.trim()) return;
                            void runAction(() => adminApi.addLeadNote(Number(item.id), note.trim()).then(() => Promise.resolve()), 'Nota agregada al lead.');
                          }}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-[#333] hover:border-[#0074E0] hover:text-[#0074E0]"
                        >
                          Nota
                        </button>
                      )}
                      {module.key === 'reviews' && canManage && (
                        <button
                          type="button"
                          onClick={() => runAction(() => adminApi.moderateReview(Number(item.id), 'approve').then(() => Promise.resolve()), 'Reseña aprobada correctamente.')}
                          className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                        >
                          Aprobar
                        </button>
                      )}
                      {module.key === 'reviews' && canManage && (
                        <button
                          type="button"
                          onClick={() => runAction(() => adminApi.moderateReview(Number(item.id), 'hide').then(() => Promise.resolve()), 'Reseña ocultada correctamente.')}
                          className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-50"
                        >
                          Ocultar
                        </button>
                      )}
                      {canManage && fields.length > 0 ? (
                        <button onClick={() => setEditing(item)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-[#333] hover:border-[#D32323] hover:text-[#D32323] inline-flex items-center gap-2"><Edit3 className="w-3.5 h-3.5" /> Editar</button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-gray-400"><Lock className="w-3 h-3" /> Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {loading && !filtered.length && (
                <tr>
                  <td colSpan={columns.length + 1 || 2} className="px-5 py-10 text-center text-sm font-bold text-gray-400">Cargando registros...</td>
                </tr>
              )}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={columns.length + 1 || 2} className="px-5 py-10 text-center text-sm font-bold text-gray-400">{module.emptyLabel || 'Sin registros para mostrar.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && fields.length > 0 && (
        <EditModal title={`Editar ${module.title}`} fields={fields} initial={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
      {creating && fields.length > 0 && (
        <EditModal title={module.createLabel || `Crear ${module.title}`} fields={fields} initial={{ active: true, status: 'draft' }} onClose={() => setCreating(false)} onSave={saveCreate} />
      )}
    </section>
  );
}

function Overview({ user, onNavigate }: { user: DashboardUser | null; onNavigate: (module: ModuleKey) => void }) {
  const [summary, setSummary] = useState<AdminRecord>({});
  const [reports, setReports] = useState<AdminRecord>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [summaryResult, reportResult] = await Promise.all([adminApi.summary(), adminApi.reports()]);
      setSummary(summaryResult);
      setReports(reportResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen.');
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Carga inicial del resumen; migrar a React Query queda fuera del alcance de esta estabilización. */
  useEffect(() => { load(); }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] bg-[#333] text-white p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase">
          <ShieldCheck className="w-4 h-4" /> Rol activo: {user?.roleName || user?.roleCode}
        </div>
        <h1 className="mt-5 text-4xl font-black">Centro de control SEOLOCAL</h1>
        <p className="mt-3 text-white/75 max-w-4xl">Dashboard enterprise con límites reales por rol. Las acciones visibles dependen de permisos y el backend valida cada operación sobre PostgreSQL.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-[#D32323]">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Agencias" value={num(summary.totalAgencies)} icon={Building2} />
        <StatCard label="Servicios FUR-S" value={num(summary.totalServices)} icon={ClipboardList} />
        <StatCard label="Leads" value={num(summary.totalLeads)} icon={FolderKanban} />
        <StatCard label="Rating promedio" value={num(summary.averageRating)} icon={Star} />
        <StatCard label="Categorías" value={num(summary.totalCategories)} icon={Tags} />
        <StatCard label="Reseñas" value={num(summary.totalReviews)} icon={MessageSquareText} />
        <StatCard label="Planes" value={num(summary.totalPlans)} icon={WalletCards} />
        <StatCard label="Pipeline" value={`US$ ${num(summary.pipelineValue).toLocaleString()}`} icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
          <h3 className="font-black text-[#333]">Competencias del rol</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {(user?.permissions || []).map((permission) => (
              <span key={permission} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">{permission}</span>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="font-black text-[#333]">Alertas operativas</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {((reports.alerts as AdminRecord[]) || []).map((alert: AdminRecord) => {
              const alertMap: Record<string, { module: ModuleKey; action: string }> = {
                'Agencias no publicadas': { module: 'agencies', action: 'Ir a agencias' },
                'Servicios por agencia pausados': { module: 'agencyServices', action: 'Ir a servicios por agencia' },
                'Reseñas pendientes/reportadas': { module: 'reviews', action: 'Ir a moderación' },
                'Leads abiertos': { module: 'leads', action: 'Ir a leads' },
                'Servicios sin categoría': { module: 'services', action: 'Ir a catálogo FUR-S' },
              };
              const target = alertMap[str(alert.label)] || { module: 'reports' as ModuleKey, action: 'Ver reporte' };
              const disabled = num(alert.value) <= 0;
              return (
                <button
                  key={str(alert.label)}
                  type="button"
                  disabled={disabled}
                  onClick={() => onNavigate(target.module)}
                  className={`rounded-2xl border p-4 text-left transition-all ${disabled ? 'border-gray-200 bg-gray-50 opacity-70 cursor-default' : 'border-red-100 bg-red-50/40 hover:-translate-y-0.5 hover:border-[#D32323]/40 hover:shadow-md cursor-pointer'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-black uppercase text-gray-500">{str(alert.label)}</p>
                    {!disabled && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#D32323] border border-red-100">{target.action}</span>}
                  </div>
                  <strong className="mt-2 block text-2xl font-black text-[#D32323]">{num(alert.value)}</strong>
                  <p className="mt-1 text-xs text-gray-500">{str(alert.description)}</p>
                  {!disabled && <p className="mt-3 text-xs font-black text-[#333]">Click para resolver esta alerta →</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}


function AgencyProfileModules({ user }: { user: DashboardUser | null }) {
  const [agencies, setAgencies] = useState<AdminRecord[]>([]);
  const [agencyId, setAgencyId] = useState(user?.agencyPartnerId ? String(user.agencyPartnerId) : '');
  const [data, setData] = useState<AdminRecord | null>(null);
  const [moduleKey, setModuleKey] = useState('profile');
  const [profileForm, setProfileForm] = useState<AdminRecord>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = has(user, 'agency_profile.modules') || has(user, 'agencies.update') || has(user, 'agencies.own.update');
  const selectedAgency = agencies.find((agency) => String(agency.id) === String(agencyId));

  const loadAgencies = useCallback(async () => {
    setError('');
    try {
      const result = await adminApi.agencies();
      const list = result.items || [];
      setAgencies(list);
      if (!agencyId && list.length) {
        setAgencyId(String(user?.agencyPartnerId || list[0].id));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar agencias desde la base de datos.');
    }
  }, [agencyId, user]);

  const load = useCallback(async () => {
    if (!agencyId) return;
    setError('');
    try {
      const [modulesResult, agenciesResult] = await Promise.all([adminApi.agencyModules(Number(agencyId)), adminApi.agencies()]);
      const list = (agenciesResult.items || []) as AdminRecord[];
      const agency = list.find((item) => String(item.id) === String(agencyId));
      setAgencies(list);
      setData(modulesResult);
      const detail = modulesResult?.detail as AdminRecord | undefined;
      setProfileForm({
        name: agency?.name || '',
        email: agency?.email || '',
        phone: agency?.phone || '',
        website: agency?.website || '',
        city: agency?.city || '',
        country_code: agency?.country_code || '',
        logo_letter: agency?.logo_letter || '',
        logo_bg_color: agency?.logo_bg_color || '',
        image_url: agency?.image_url || '',
        summary: agency?.summary || '',
        rating: agency?.rating || 0,
        reviews_count: agency?.reviews_count || 0,
        starting_price: agency?.starting_price || 0,
        is_verified: Boolean(agency?.is_verified),
        is_top_rated: Boolean(agency?.is_top_rated),
        status: agency?.status || 'draft',
        tagline: detail?.tagline || agency?.tagline || '',
        focus: detail?.focus || agency?.focus || '',
        methodology: detail?.methodology || agency?.methodology || '',
        client_profile: detail?.client_profile || agency?.client_profile || '',
        promise_headline: detail?.promise_headline || '',
        industries: detail?.industries || agency?.industries || [],
        identity_tags: detail?.identity_tags || agency?.identity_tags || [],
        active: detail?.active ?? true,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil modular.');
    }
  }, [agencyId]);

  /* eslint-disable react-hooks/set-state-in-effect -- Carga inicial de agencias y perfil; migrar a React Query queda fuera del alcance de esta estabilizacion. */
  useEffect(() => { loadAgencies(); }, [loadAgencies]);
  useEffect(() => { if (agencyId) load(); }, [agencyId, load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function saveProfile() {
    if (!agencyId) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.updateAgency(Number(agencyId), {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        website: profileForm.website,
        city: profileForm.city,
        country_code: profileForm.country_code,
        logo_letter: profileForm.logo_letter,
        logo_bg_color: profileForm.logo_bg_color,
        image_url: profileForm.image_url,
        summary: profileForm.summary,
        rating: Number(profileForm.rating || 0),
        reviews_count: Number(profileForm.reviews_count || 0),
        starting_price: Number(profileForm.starting_price || 0),
        is_verified: Boolean(profileForm.is_verified),
        is_top_rated: Boolean(profileForm.is_top_rated),
        status: profileForm.status,
        tagline: profileForm.tagline,
        focus: profileForm.focus,
        methodology: profileForm.methodology,
        client_profile: profileForm.client_profile,
        promise_headline: profileForm.promise_headline,
        industries: profileForm.industries || [],
        identity_tags: profileForm.identity_tags || [],
      });
      await adminApi.upsertAgencyModule(Number(agencyId), 'detail', {
        tagline: profileForm.tagline,
        focus: profileForm.focus,
        methodology: profileForm.methodology,
        client_profile: profileForm.client_profile,
        promise_headline: profileForm.promise_headline,
        industries: Array.isArray(profileForm.industries) ? profileForm.industries : String(profileForm.industries || '').split(',').map((x) => x.trim()).filter(Boolean),
        identity_tags: Array.isArray(profileForm.identity_tags) ? profileForm.identity_tags : String(profileForm.identity_tags || '').split(',').map((x) => x.trim()).filter(Boolean),
        active: true,
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil de agencia.');
    } finally {
      setSaving(false);
    }
  }

  function updateProfile(key: string, value: unknown) {
    setProfileForm((current: AdminRecord) => ({ ...current, [key]: value }));
  }

  const teamRows = Array.isArray(data?.team) ? data.team : [];
  const certificationRows = Array.isArray(data?.certifications) ? data.certifications : [];
  const hourRows = Array.isArray(data?.hours) ? data.hours : [];
  const channelRows = Array.isArray(data?.channels) ? data.channels : [];

  function updateArrayRow(collectionKey: string, index: number, key: string, value: unknown) {
    const rows = Array.isArray(data?.[collectionKey]) ? [...(data[collectionKey] as AdminRecord[])] : [];
    rows[index] = { ...rows[index], [key]: value };
    setData({ ...data, [collectionKey]: rows });
  }

  function addArrayRow(collectionKey: string, row: AdminRecord) {
    const rows = Array.isArray(data?.[collectionKey]) ? [...data[collectionKey]] : [];
    setData({ ...data, [collectionKey]: [...rows, row] });
  }

  function removeArrayRow(collectionKey: string, index: number) {
    const rows = Array.isArray(data?.[collectionKey]) ? [...(data[collectionKey] as AdminRecord[])] : [];
    rows.splice(index, 1);
    setData({ ...data, [collectionKey]: rows });
  }

  async function saveModule(key: string) {
    if (!agencyId || !data) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.upsertAgencyModule(Number(agencyId), key, data[key] || []);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `No se pudo guardar el módulo ${key}.`);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#D32323] bg-white';
  const labelClass = 'text-xs font-black uppercase tracking-wide text-gray-500';

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
        <p className="text-xs font-black uppercase text-[#D32323]">Perfil público modular conectado a BD</p>
        <h2 className="mt-1 text-2xl font-black text-[#333]">Gestión total de perfil de agencia</h2>
        <p className="mt-2 text-sm text-gray-500">Selecciona una agencia real de PostgreSQL y edita datos, imágenes, descripción, GBP, horarios, equipo, certificaciones y canales.</p>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} disabled={Boolean(user?.agencyPartnerId)} className="rounded-2xl border border-gray-200 px-4 py-3 font-semibold outline-none focus:border-[#D32323] bg-white">
            <option value="">Seleccionar agencia desde la base de datos...</option>
            {agencies.map((agency) => (
              <option key={str(agency.id)} value={str(agency.id)}>{str(agency.name)} · ID {str(agency.id)} · {str(agency.city) || 'Sin ciudad'}</option>
            ))}
          </select>
          <button onClick={load} className="rounded-2xl bg-[#333] text-white px-5 py-3 font-black inline-flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Cargar perfil</button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-[#D32323]">{error}</div>}

      {!agencyId && (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 font-bold">No hay agencia seleccionada. Carga o crea agencias desde el módulo “Dashboard dueño del marketplace”.</div>
      )}

      {agencyId && data && (
        <div className="grid grid-cols-1 xl:grid-cols-[290px_1fr] gap-5">
          <div className="rounded-[24px] bg-white border border-gray-200 p-4 shadow-sm space-y-2 h-fit sticky top-24">
            {[
              ['profile', 'Datos e imágenes'],
              ['team', 'Personal / Equipo'],
              ['certifications', 'Certificaciones'],
              ['hours', 'Horarios'],
              ['channels', 'Canales'],
              ['json', 'Vista técnica JSON'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setModuleKey(key)} className={`w-full text-left rounded-2xl px-4 py-3 text-sm font-black ${moduleKey === key ? 'bg-[#D32323] text-white' : 'hover:bg-gray-50 text-[#333]'}`}>{label}</button>
            ))}
            {selectedAgency && (
              <a href={`#/agencias/${str(selectedAgency.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`} className="block rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-[#0074E0] hover:bg-blue-50">Ver perfil público</a>
            )}
          </div>

          <div className="space-y-5">
            {moduleKey === 'profile' && (
              <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-[#D32323]">Agencia ID {agencyId}</p>
                    <h3 className="text-2xl font-black text-[#333]">Datos, imágenes y contenido principal</h3>
                    <p className="mt-1 text-sm text-gray-500">Los cambios se guardan en res_partner, seo_local_agency_profile y seo_local_agency_profile_detail.</p>
                  </div>
                  <button onClick={saveProfile} disabled={!canEdit || saving} className="rounded-2xl bg-[#D32323] px-5 py-3 text-white font-black disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar perfil completo'}</button>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                  <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
                    <div className="aspect-[4/3] rounded-[20px] bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                      {profileForm.image_url ? <img src={str(profileForm.image_url)} alt="Imagen perfil agencia" className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-gray-400">Vista previa imagen</span>}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white" style={{ backgroundColor: str(profileForm.logo_bg_color).startsWith('#') ? str(profileForm.logo_bg_color) : '#D32323' }}>{str(profileForm.logo_letter) || 'S'}</span>
                      <div>
                        <p className="font-black text-[#333]">{str(profileForm.name) || 'Agencia'}</p>
                        <p className="text-xs text-gray-500">Logo público / ficha de perfil</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label><span className={labelClass}>Nombre</span><input className={inputClass} value={str(profileForm.name)} onChange={(e) => updateProfile('name', e.target.value)} /></label>
                    <label><span className={labelClass}>Email</span><input className={inputClass} value={str(profileForm.email)} onChange={(e) => updateProfile('email', e.target.value)} /></label>
                    <label><span className={labelClass}>Teléfono</span><input className={inputClass} value={str(profileForm.phone)} onChange={(e) => updateProfile('phone', e.target.value)} /></label>
                    <label><span className={labelClass}>Website</span><input className={inputClass} value={str(profileForm.website)} onChange={(e) => updateProfile('website', e.target.value)} /></label>
                    <label><span className={labelClass}>Ciudad</span><input className={inputClass} value={str(profileForm.city)} onChange={(e) => updateProfile('city', e.target.value)} /></label>
                    <label><span className={labelClass}>País</span><input className={inputClass} value={str(profileForm.country_code)} onChange={(e) => updateProfile('country_code', e.target.value)} /></label>
                    <label><span className={labelClass}>Letra logo</span><input className={inputClass} value={str(profileForm.logo_letter)} onChange={(e) => updateProfile('logo_letter', e.target.value.toUpperCase().slice(0, 4))} /></label>
                    <label><span className={labelClass}>Color logo HEX</span><input className={inputClass} value={str(profileForm.logo_bg_color)} onChange={(e) => updateProfile('logo_bg_color', e.target.value)} placeholder="#D32323" /></label>
                    <label className="md:col-span-2"><span className={labelClass}>URL imagen hero/perfil</span><input className={inputClass} value={str(profileForm.image_url)} onChange={(e) => updateProfile('image_url', e.target.value)} /></label>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label><span className={labelClass}>Rating</span><input type="number" className={inputClass} value={num(profileForm.rating)} onChange={(e) => updateProfile('rating', e.target.value)} /></label>
                  <label><span className={labelClass}>Reseñas</span><input type="number" className={inputClass} value={num(profileForm.reviews_count)} onChange={(e) => updateProfile('reviews_count', e.target.value)} /></label>
                  <label><span className={labelClass}>Precio desde</span><input type="number" className={inputClass} value={num(profileForm.starting_price)} onChange={(e) => updateProfile('starting_price', e.target.value)} /></label>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="rounded-2xl border border-gray-200 p-4 flex items-center gap-3"><input type="checkbox" checked={Boolean(profileForm.is_verified)} onChange={(e) => updateProfile('is_verified', e.target.checked)} /><span className="font-black text-sm">Agencia verificada</span></label>
                  <label className="rounded-2xl border border-gray-200 p-4 flex items-center gap-3"><input type="checkbox" checked={Boolean(profileForm.is_top_rated)} onChange={(e) => updateProfile('is_top_rated', e.target.checked)} /><span className="font-black text-sm">Top Rated</span></label>
                  <label><span className={labelClass}>Estado</span><select className={inputClass} value={str(profileForm.status, 'draft')} onChange={(e) => updateProfile('status', e.target.value)}><option value="draft">draft</option><option value="review">review</option><option value="published">published</option><option value="suspended">suspended</option></select></label>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4">
                  <label><span className={labelClass}>Resumen público</span><textarea className={`${inputClass} min-h-[110px]`} value={str(profileForm.summary)} onChange={(e) => updateProfile('summary', e.target.value)} /></label>
                  <label><span className={labelClass}>Tagline</span><input className={inputClass} value={str(profileForm.tagline)} onChange={(e) => updateProfile('tagline', e.target.value)} /></label>
                  <label><span className={labelClass}>Enfoque</span><textarea className={`${inputClass} min-h-[90px]`} value={str(profileForm.focus)} onChange={(e) => updateProfile('focus', e.target.value)} /></label>
                  <label><span className={labelClass}>Metodología</span><textarea className={`${inputClass} min-h-[90px]`} value={str(profileForm.methodology)} onChange={(e) => updateProfile('methodology', e.target.value)} /></label>
                  <label><span className={labelClass}>Cliente ideal</span><textarea className={`${inputClass} min-h-[90px]`} value={str(profileForm.client_profile)} onChange={(e) => updateProfile('client_profile', e.target.value)} /></label>
                  <label><span className={labelClass}>Promesa principal</span><input className={inputClass} value={str(profileForm.promise_headline)} onChange={(e) => updateProfile('promise_headline', e.target.value)} /></label>
                </div>
              </div>
            )}

            {moduleKey === 'team' && (
              <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-xs font-black uppercase text-[#D32323]">Personal en base de datos</p><h3 className="text-2xl font-black text-[#333]">Equipo técnico / consultores</h3></div>
                  <div className="flex gap-3"><button onClick={() => addArrayRow('team', { name: 'Nuevo consultor', role_title: 'Especialista SEO Local', bio: '', avatar_url: '', specialty: '', active: true, sequence: teamRows.length + 1 })} className="rounded-2xl border border-gray-200 px-4 py-3 font-black text-sm"><Plus className="inline w-4 h-4 mr-1" /> Añadir personal</button><button onClick={() => saveModule('team')} disabled={!canEdit || saving} className="rounded-2xl bg-[#D32323] px-5 py-3 text-white font-black disabled:opacity-50">Guardar personal</button></div>
                </div>
                <div className="mt-5 space-y-4">
                  {teamRows.map((row: AdminRecord, index: number) => (
                    <div key={index} className="rounded-[24px] border border-gray-200 bg-gray-50 p-4 grid grid-cols-1 lg:grid-cols-[96px_1fr_auto] gap-4">
                      <div className="w-24 h-24 rounded-2xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center">{row.avatar_url ? <img src={str(row.avatar_url)} className="w-full h-full object-cover" /> : <Users className="w-8 h-8 text-gray-300" />}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label><span className={labelClass}>Nombre</span><input className={inputClass} value={str(row.name)} onChange={(e) => updateArrayRow('team', index, 'name', e.target.value)} /></label>
                        <label><span className={labelClass}>Cargo</span><input className={inputClass} value={str(row.role_title)} onChange={(e) => updateArrayRow('team', index, 'role_title', e.target.value)} /></label>
                        <label><span className={labelClass}>Especialidad</span><input className={inputClass} value={str(row.specialty)} onChange={(e) => updateArrayRow('team', index, 'specialty', e.target.value)} /></label>
                        <label><span className={labelClass}>Avatar URL</span><input className={inputClass} value={str(row.avatar_url)} onChange={(e) => updateArrayRow('team', index, 'avatar_url', e.target.value)} /></label>
                        <label className="md:col-span-2"><span className={labelClass}>Bio</span><textarea className={`${inputClass} min-h-[80px]`} value={str(row.bio)} onChange={(e) => updateArrayRow('team', index, 'bio', e.target.value)} /></label>
                      </div>
                      <button onClick={() => removeArrayRow('team', index)} className="rounded-2xl border border-red-200 px-3 py-2 h-fit text-[#D32323] font-black text-xs">Eliminar</button>
                    </div>
                  ))}
                  {!teamRows.length && <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm font-bold text-gray-400">No hay personal cargado. Añade el primer consultor.</div>}
                </div>
              </div>
            )}

            {moduleKey === 'certifications' && (
              <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4"><h3 className="text-2xl font-black text-[#333]">Certificaciones</h3><div className="flex gap-3"><button onClick={() => addArrayRow('certifications', { issuer: 'Google', title: 'Nueva certificación', credential_url: '', valid_until: '', active: true, sequence: certificationRows.length + 1 })} className="rounded-2xl border border-gray-200 px-4 py-3 font-black text-sm">Añadir</button><button onClick={() => saveModule('certifications')} disabled={!canEdit || saving} className="rounded-2xl bg-[#D32323] px-5 py-3 text-white font-black disabled:opacity-50">Guardar</button></div></div>
                <div className="mt-5 space-y-3">{certificationRows.map((row: AdminRecord, index: number) => <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl border border-gray-200 p-4"><input className={inputClass} value={str(row.issuer)} onChange={(e) => updateArrayRow('certifications', index, 'issuer', e.target.value)} placeholder="Issuer" /><input className={inputClass} value={str(row.title)} onChange={(e) => updateArrayRow('certifications', index, 'title', e.target.value)} placeholder="Título" /><input className={inputClass} value={str(row.credential_url)} onChange={(e) => updateArrayRow('certifications', index, 'credential_url', e.target.value)} placeholder="URL" /><input className={inputClass} value={str(row.valid_until)} onChange={(e) => updateArrayRow('certifications', index, 'valid_until', e.target.value)} placeholder="YYYY-MM-DD" /><button onClick={() => removeArrayRow('certifications', index)} className="rounded-2xl border border-red-200 text-[#D32323] font-black">Eliminar</button></div>)}</div>
              </div>
            )}

            {moduleKey === 'hours' && (
              <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4"><h3 className="text-2xl font-black text-[#333]">Horarios</h3><div className="flex gap-3"><button onClick={() => addArrayRow('hours', { day_label: 'Nuevo día', opens_at: '09:00', closes_at: '18:00', is_closed: false, sequence: hourRows.length + 1 })} className="rounded-2xl border border-gray-200 px-4 py-3 font-black text-sm">Añadir</button><button onClick={() => saveModule('hours')} disabled={!canEdit || saving} className="rounded-2xl bg-[#D32323] px-5 py-3 text-white font-black disabled:opacity-50">Guardar</button></div></div>
                <div className="mt-5 space-y-3">{hourRows.map((row: AdminRecord, index: number) => <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-2xl border border-gray-200 p-4"><input className={inputClass} value={str(row.day_label)} onChange={(e) => updateArrayRow('hours', index, 'day_label', e.target.value)} /><input className={inputClass} value={str(row.opens_at)} onChange={(e) => updateArrayRow('hours', index, 'opens_at', e.target.value)} /><input className={inputClass} value={str(row.closes_at)} onChange={(e) => updateArrayRow('hours', index, 'closes_at', e.target.value)} /><label className="rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-2"><input type="checkbox" checked={Boolean(row.is_closed)} onChange={(e) => updateArrayRow('hours', index, 'is_closed', e.target.checked)} /> Cerrado</label><button onClick={() => removeArrayRow('hours', index)} className="rounded-2xl border border-red-200 text-[#D32323] font-black">Eliminar</button></div>)}</div>
              </div>
            )}

            {moduleKey === 'channels' && (
              <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4"><h3 className="text-2xl font-black text-[#333]">Canales internos de agencia</h3><div className="flex gap-3"><button onClick={() => addArrayRow('channels', { channel_type: 'website', label: 'Sitio web', value: '', url: '', is_verified: true, active: true, sequence: channelRows.length + 1 })} className="rounded-2xl border border-gray-200 px-4 py-3 font-black text-sm">Añadir</button><button onClick={() => saveModule('channels')} disabled={!canEdit || saving} className="rounded-2xl bg-[#D32323] px-5 py-3 text-white font-black disabled:opacity-50">Guardar</button></div></div>
                <p className="mt-2 text-xs font-semibold text-gray-500">Estos canales quedan en BD. El módulo público “Canales Externos Verificados” puede seguir oculto si así está configurado en el perfil.</p>
                <div className="mt-5 space-y-3">{channelRows.map((row: AdminRecord, index: number) => <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-2xl border border-gray-200 p-4"><input className={inputClass} value={str(row.channel_type)} onChange={(e) => updateArrayRow('channels', index, 'channel_type', e.target.value)} /><input className={inputClass} value={str(row.label)} onChange={(e) => updateArrayRow('channels', index, 'label', e.target.value)} /><input className={inputClass} value={str(row.value)} onChange={(e) => updateArrayRow('channels', index, 'value', e.target.value)} /><input className={inputClass} value={str(row.url)} onChange={(e) => updateArrayRow('channels', index, 'url', e.target.value)} /><label className="rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-2"><input type="checkbox" checked={Boolean(row.is_verified)} onChange={(e) => updateArrayRow('channels', index, 'is_verified', e.target.checked)} /> Verificado</label><button onClick={() => removeArrayRow('channels', index)} className="rounded-2xl border border-red-200 text-[#D32323] font-black">Eliminar</button></div>)}</div>
              </div>
            )}

            {moduleKey === 'json' && (
              <div className="rounded-[28px] bg-white border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4"><h3 className="font-black text-[#333]">Vista técnica JSON</h3><button onClick={() => saveModule('team')} disabled={!canEdit || saving} className="rounded-2xl bg-[#333] px-5 py-3 text-white font-black disabled:opacity-50">Guardar equipo desde JSON</button></div>
                <p className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">Esta vista es técnica. El botón actual solo persiste la colección <code>team</code>; no guarda automáticamente todas las colecciones del JSON.</p>
                <textarea value={JSON.stringify(data, null, 2)} onChange={(e) => { try { setData(JSON.parse(e.target.value)); } catch { setData(data); } }} className="w-full min-h-[620px] rounded-2xl border border-gray-200 p-4 font-mono text-xs outline-none focus:border-[#D32323]" />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState<ModuleKey>('overview');

  async function loadMe() {
    try {
      if (!adminApi.token) return;
      const me = await adminApi.me();
      setSession(me);
    } catch (error: unknown) {
      clearAdminToken();
      if (error instanceof ApiError && (error.code === 'unauthorized' || error.code === 'forbidden')) {
        window.dispatchEvent(new CustomEvent('seo-dashboard-logout'));
      }
    } finally {
      setChecking(false);
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect -- Verificación inicial de sesión y suscripción a evento de login; migrar a React Query queda fuera del alcance de esta estabilización. */
  useEffect(() => {
    loadMe();
    const handler = (event: Event) => {
      const custom = event as CustomEvent<DashboardSession>;
      setSession(custom.detail);
      setChecking(false);
    };
    window.addEventListener('seo-dashboard-login', handler as EventListener);
    return () => window.removeEventListener('seo-dashboard-login', handler as EventListener);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const user = session?.user || null;
  const visibleModules = modules.filter((module) => has(user, module.readPermission) || module.key === 'overview');

  if (checking) {
    return <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center font-black text-[#333]">Validando sesión...</div>;
  }

  if (!session) return <LoginCard />;

  const activeModule = modules.find((module) => module.key === active) || modules[0];
  const canViewActive = activeModule.key === 'overview' || has(user, activeModule.readPermission);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 rounded-[28px] bg-white border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D32323] text-white flex items-center justify-center font-black">Y</div>
            <div>
              <p className="text-xs font-black uppercase text-[#D32323]">Dashboard enterprise v5.27.0</p>
              <h1 className="text-xl font-black text-[#333]">Hola, {user?.displayName}</h1>
              <p className="text-xs font-semibold text-gray-500">{user?.login} · {user?.roleName} · Agencia asignada: {user?.agencyPartnerId || 'No aplica'}</p>
            </div>
          </div>
          <button onClick={() => { clearAdminToken(); setSession(null); window.dispatchEvent(new CustomEvent('seo-dashboard-logout')); }} className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-[#333] hover:bg-gray-50 inline-flex items-center gap-2"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[310px_1fr] gap-6">
          <aside className="rounded-[28px] bg-white border border-gray-200 shadow-sm p-4 h-fit sticky top-24">
            <div className="space-y-2">
              {visibleModules.map((module) => {
                const Icon = module.icon;
                return (
                  <button key={module.key} onClick={() => setActive(module.key)} className={`w-full rounded-2xl px-4 py-3 text-left flex items-start gap-3 transition-all ${active === module.key ? 'bg-[#D32323] text-white shadow-md' : 'hover:bg-gray-50 text-[#333]'}`}>
                    <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-sm font-black">{module.title}</span>
                      <span className={`mt-1 block text-xs ${active === module.key ? 'text-white/75' : 'text-gray-500'}`}>{module.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main>
            {!canViewActive && (
              <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-900 font-bold">
                Este rol no tiene permiso para ver este módulo.
              </div>
            )}
            {canViewActive && active === 'overview' && <Overview user={user} onNavigate={setActive} />}
            {canViewActive && active === 'agencyProfile' && <AgencyProfileModules user={user} />}
            {canViewActive && active !== 'overview' && active !== 'agencyProfile' && (
              <GenericModule module={activeModule} user={user} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
