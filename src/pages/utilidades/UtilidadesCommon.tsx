/* eslint-disable react-refresh/only-export-components */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  X,
} from 'lucide-react';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type StructuredRow = Record<string, unknown>;


const STATUS_LABELS: Record<string, string> = {
  not_configured: 'Pendiente de conexión',
  configured: 'Configurado',
  connected: 'Conectado',
  disabled: 'Desactivado',
  active: 'Activo',
  inactive: 'Inactivo',
  open: 'Abierto',
  acknowledged: 'Reconocido',
  resolved: 'Resuelto',
  new: 'Nuevo',
  in_progress: 'En progreso',
  pending: 'Pendiente',
  prepared: 'Preparado',
  sent: 'Enviado',
  delivered: 'Entregado',
  responded: 'Respondido',
  skipped: 'Omitido',
  failed: 'Con error',
  draft: 'Borrador',
  scheduled: 'Programado',
  published: 'Publicado',
  paused: 'Pausado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  changes_requested: 'Cambios solicitados',
  generated: 'Generado',
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
  manual: 'Manual',
  webhook: 'Webhook',
  email: 'Correo electrónico',
  sms: 'SMS',
  email_sms: 'Correo y SMS',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  won: 'Ganado',
  lost: 'Perdido',
  quoted: 'Cotizado',
  work_order_created: 'Orden creada',
  live: 'Activa',
  submitted: 'Enviada',
  passed: 'Correcto',
  warning: 'Requiere atención',
  positive: 'Positivo',
  mixed: 'Mixto',
  consistent: 'Consistente',
  inconsistent: 'Inconsistente',
  evidence_submitted: 'Evidencia enviada',
  activa: 'Activa',
  en_revision: 'En revisión',
  evidencia_enviada: 'Evidencia enviada',
  aprobada: 'Aprobada',
  cancelada: 'Cancelada',
};

const FIELD_LABELS: Record<string, string> = {
  locations: 'Ubicaciones',
  alerts: 'Alertas',
  actions: 'Acciones',
  cases: 'Casos',
  workOrders: 'Órdenes de trabajo',
  workorders: 'Órdenes de trabajo',
  reviewCampaigns: 'Campañas de reseñas',
  reviewcampaigns: 'Campañas de reseñas',
  citationCampaigns: 'Campañas de citaciones',
  citationcampaigns: 'Campañas de citaciones',
  sessions: 'Sesiones',
  conversions: 'Conversiones',
  clicks: 'Clics',
  impressions: 'Impresiones',
  average_position: 'Posición promedio',
  rating: 'Calificación',
  live_citations: 'Citaciones activas',
  audit_score: 'Puntuación de auditoría',
  source: 'Fuente',
  provider: 'Proveedor',
  reason: 'Estado de preparación',
  score: 'Puntuación',
  overall_score: 'Puntuación global',
  tracked_keywords: 'Palabras clave monitoreadas',
  top_3: 'Palabras clave en Top 3',
  top_10: 'Palabras clave en Top 10',
  top_3_keywords: 'Palabras clave en Top 3',
  visibility_change: 'Cambio de visibilidad',
  keyword: 'Palabra clave',
  position: 'Posición actual',
  previous: 'Posición anterior',
  change: 'Mejora',
  grid_size: 'Tamaño de cuadrícula',
  center_rank: 'Posición en la sede',
  top_3_coverage: 'Cobertura Top 3',
  top_10_coverage: 'Cobertura Top 10',
  average_rank: 'Posición promedio',
  strongest_zone: 'Zona más fuerte',
  weakest_zone: 'Zona con oportunidad',
  competitor_count: 'Competidores detectados',
  consistent_citations: 'Citaciones consistentes',
  inconsistent_citations: 'Citaciones inconsistentes',
  duplicates: 'Duplicados',
  pending_directories: 'Directorios pendientes',
  directory: 'Directorio',
  status: 'Estado',
  nap: 'Consistencia NAP',
  authority: 'Autoridad',
  profile_completeness: 'Completitud del perfil',
  primary_category: 'Categoría principal',
  additional_categories: 'Categorías adicionales',
  photos: 'Fotografías',
  reviews: 'Reseñas',
  posts_last_30_days: 'Publicaciones últimos 30 días',
  products: 'Productos y servicios',
  questions_answered: 'Preguntas respondidas',
  check: 'Comprobación',
  impact: 'Impacto',
  review_count: 'Cantidad de reseñas',
  new_reviews_30_days: 'Reseñas nuevas en 30 días',
  response_rate: 'Tasa de respuesta',
  average_response_hours: 'Tiempo medio de respuesta',
  positive_sentiment: 'Sentimiento positivo',
  theme: 'Tema',
  mentions: 'Menciones',
  sentiment: 'Sentimiento',
  technical_score: 'Puntuación técnica',
  content_score: 'Puntuación de contenido',
  local_signals_score: 'Señales locales',
  schema_score: 'Datos estructurados',
  mobile_score: 'Experiencia móvil',
  speed_score: 'Velocidad',
  users: 'Usuarios',
  engaged_sessions: 'Sesiones con interacción',
  conversion_rate: 'Tasa de conversión',
  organic_sessions: 'Sesiones orgánicas',
  local_landing_sessions: 'Sesiones en páginas locales',
  ctr: 'CTR',
  branded_clicks: 'Clics de marca',
  non_branded_clicks: 'Clics sin marca',
  views: 'Visualizaciones',
  searches: 'Búsquedas',
  calls: 'Llamadas',
  website_clicks: 'Clics al sitio web',
  direction_requests: 'Solicitudes de indicaciones',
  messages: 'Mensajes',
};

export function PageHead({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="util-pagehead">
      <div className="util-pagehead-copy">
        {eyebrow ? <span className="util-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="util-actions">{children}</div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`util-panel ${className}`.trim()}>
      <div className="util-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="util-panel-body">{children}</div>
    </section>
  );
}

export function Status({ value }: { value: unknown }) {
  const raw = cleanDisplayText(String(value ?? '—'));
  const normalized = raw.toLowerCase().replaceAll(' ', '_');
  const label = STATUS_LABELS[normalized] ?? cleanDisplayText(raw.replaceAll('_', ' '));
  const tone: Tone =
    /critical|high|error|failed|cancel|rejected|deficiente|inactivo|vencid|inconsistent/.test(normalized)
      ? 'danger'
      : /pending|draft|medium|review|atención|pendiente|programad|not_configured|warning|mixed|submitted/.test(normalized)
        ? 'warning'
        : /active|approved|completed|generated|success|resuelt|activo|configurado|connected|published|delivered|passed|positive|consistent|live/.test(normalized)
          ? 'success'
          : 'info';

  return <span className={`util-status ${tone}`}>{label}</span>;
}

export function Loading({
  show,
  label = 'Cargando información…',
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;
  return (
    <div className="util-loading" role="status" aria-live="polite">
      <div className="util-loading-card">
        <Loader2 size={22} className="util-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Empty({
  title = 'No hay registros',
  text: description = 'Todavía no existen datos para mostrar en esta sección.',
  action,
  compact = false,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`util-empty ${compact ? 'compact' : ''}`}>
      <div className="util-empty-icon"><Inbox size={20} /></div>
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="util-empty-action">{action}</div> : null}
    </div>
  );
}

export function ErrorBox({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry?: () => void | Promise<void>;
}) {
  if (!message) return null;
  return (
    <div className="util-error" role="alert">
      <AlertCircle size={18} />
      <div>
        <strong>No se pudo completar la operación</strong>
        <span>{translateError(message)}</span>
      </div>
      {onRetry ? (
        <button className="util-btn subtle" onClick={() => void onRetry()}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function SuccessBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="util-success" role="status">
      <CheckCircle2 size={18} />
      <span>{message}</span>
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const selector = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])';
    const initial = dialog?.querySelector<HTMLElement>(selector);
    initial?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(selector));
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="util-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`util-modal ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? descriptionId : undefined}
      >
        <div className="util-modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p id={descriptionId}>{subtitle}</p> : null}
          </div>
          <button className="util-icon-btn" onClick={onClose} aria-label="Cerrar ventana">
            <X size={18} />
          </button>
        </div>
        <div className="util-modal-body">{children}</div>
        {footer ? <div className="util-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Kpi({
  label,
  value,
  icon,
  helper,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: string;
  tone?: Tone;
}) {
  return (
    <article className={`util-kpi ${tone}`}>
      <div className="util-kpi-top">
        <span>{label}</span>
        {icon ? <div className="util-kpi-icon">{icon}</div> : null}
      </div>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}

export function Progress({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="util-progress-wrap">
      {label ? (
        <div className="util-progress-label">
          <span>{label}</span>
          <strong>{Math.round(percent)}%</strong>
        </div>
      ) : null}
      <div className="util-progress"><span style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

export function SectionIntro({
  title,
  text: description,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="util-section-intro">
      <div><h3>{title}</h3><p>{description}</p></div>
      {action}
    </div>
  );
}

export function DataView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <Empty compact text="Sin datos registrados." />;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <Empty compact />;
    const hasObjects = value.some((item) => item && typeof item === 'object');
    if (hasObjects) {
      return <div className="util-data-objects">{value.map((item, index) => <div className="util-data-object" key={index}><span className="util-data-object-number">{index + 1}</span><DataView value={item} /></div>)}</div>;
    }
    return <div className="util-data-chips">{value.map((item, index) => <span key={index}>{text(item)}</span>)}</div>;
  }
  if (typeof value !== 'object') {
    return <div className="util-data-grid"><div className="util-data-item"><span>Valor</span><strong>{text(value)}</strong></div></div>;
  }
  const entries = Object.entries(value as StructuredRow).filter(([key]) => !['configured', 'grid'].includes(key));
  if (!entries.length) return <Empty compact text="La fuente no devolvió indicadores adicionales." />;
  return (
    <div className="util-data-grid">
      {entries.map(([key, item]) => item && typeof item === 'object' ? (
        <div className="util-data-block" key={key}><span>{humanizeKey(key)}</span><DataView value={item} /></div>
      ) : (
        <div className="util-data-item" key={key}><span>{humanizeKey(key)}</span><strong>{formatStructuredValue(item)}</strong></div>
      ))}
    </div>
  );
}

export function humanizeKey(value: string) {
  return FIELD_LABELS[value] ?? FIELD_LABELS[value.toLowerCase()] ?? cleanDisplayText(
    value
      .replaceAll('_', ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (character) => character.toUpperCase()),
  );
}

function formatStructuredValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.map(formatStructuredValue).join(' · ') : '—';
  if (value && typeof value === 'object') {
    return Object.entries(value as StructuredRow)
      .map(([key, child]) => `${humanizeKey(key)}: ${formatStructuredValue(child)}`)
      .join(' · ');
  }
  return text(value);
}

export function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return formatStructuredValue(value);
  return cleanDisplayText(String(value));
}

export function cleanDisplayText(value: string) {
  let result = value;

  // Repara mojibake UTF-8 común sin modificar texto Unicode válido.
  if (/[ÃÂ]/.test(result) && [...result].every((character) => character.charCodeAt(0) <= 255)) {
    try {
      const bytes = Uint8Array.from([...result].map((character) => character.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (decoded) result = decoded;
    } catch {
      // El texto no era mojibake UTF-8; se conserva el valor original.
    }
  }

  return result
    .replaceAll('Bogot�', 'Bogotá')
    .replaceAll('BogotÃ¡', 'Bogotá')
    .replaceAll('Ubicaci�n', 'Ubicación')
    .replaceAll('configuraci�n', 'configuración')
    .replaceAll('evaluaci�n', 'evaluación')
    .replaceAll('operaci�n', 'operación');
}

export function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return text(value);
  return new Intl.DateTimeFormat('es-419', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMoney(value: unknown, currency = 'USD') {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('es-419', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function translateError(message: string) {
  const normalized = message.trim().toLowerCase();
  if (normalized === 'unauthorized' || normalized.includes('unauthorized')) {
    return 'Tu sesión no es válida. Sal del panel e inicia sesión nuevamente.';
  }
  if (normalized === 'forbidden' || normalized.includes('forbidden')) {
    return 'No tienes permisos para acceder a este recurso.';
  }
  // V5386_UTILIDADES_BAD_REQUEST_DETAIL
  if (normalized.includes('limit') && (normalized.includes('greater than') || normalized.includes('less than or equal'))) {
    return `El límite solicitado supera el máximo aceptado por el backend. Detalle: ${message}`;
  }
  if (normalized.includes('locationid') && normalized.includes('integer')) {
    return `El identificador de ubicación no pudo validarse. Detalle técnico: ${message}`;
  }
  if (normalized === 'bad request' || normalized.includes('bad request')) {
    return 'El backend rechazó la solicitud por parámetros inválidos. Reintenta; si persiste, revisaremos el detalle de validación devuelto por la API.';
  }
  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'No se pudo conectar con el backend. Verifica que esté ejecutándose.';
  }
  return message;
}
