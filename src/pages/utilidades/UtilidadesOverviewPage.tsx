/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Cable,
  CheckCircle2,
  CircleDashed,
  FolderKanban,
  MapPin,
  Megaphone,
  RefreshCw,
  SearchCheck,
  Settings2,
  Star,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import UtilidadesFunctionalLab from './UtilidadesFunctionalLab';
import {
  Empty,
  ErrorBox,
  Kpi,
  Loading,
  PageHead,
  Panel,
  Progress,
  Status,
  asArray,
  formatDate,
  humanizeKey,
  text,
} from './UtilidadesCommon';

const PROVIDERS: Record<string, { name: string; description: string; icon: ComponentType<{ size?: number }> }> = {
  gbp: {
    name: 'Google Business Profile',
    description: 'Ficha, publicaciones, reputación y auditoría local.',
    icon: MapPin,
  },
  ga4: {
    name: 'Google Analytics 4',
    description: 'Sesiones, conversiones y comportamiento del sitio.',
    icon: BarChart3,
  },
  gsc: {
    name: 'Search Console',
    description: 'Clics, impresiones, consultas y posiciones orgánicas.',
    icon: SearchCheck,
  },
  email: {
    name: 'Correo electrónico',
    description: 'Entrega de campañas, alertas y notificaciones.',
    icon: Megaphone,
  },
  sms: {
    name: 'SMS',
    description: 'Mensajería transaccional y campañas de reseñas.',
    icon: Cable,
  },
};

const INTERNAL_MODULES: Record<string, { label: string; helper: string; icon: ComponentType<{ size?: number }> }> = {
  locations: { label: 'Ubicaciones', helper: 'Expedientes activos', icon: MapPin },
  alerts: { label: 'Alertas', helper: 'Señales operativas', icon: AlertTriangle },
  actions: { label: 'Acciones', helper: 'Tareas de optimización', icon: Wrench },
  cases: { label: 'Casos', helper: 'Seguimientos abiertos', icon: FolderKanban },
  workOrders: { label: 'Órdenes de trabajo', helper: 'Ejecución con agencias', icon: BriefcaseBusiness },
  workorders: { label: 'Órdenes de trabajo', helper: 'Ejecución con agencias', icon: BriefcaseBusiness },
  reviewCampaigns: { label: 'Campañas de reseñas', helper: 'Solicitudes gestionadas', icon: Star },
  reviewcampaigns: { label: 'Campañas de reseñas', helper: 'Solicitudes gestionadas', icon: Star },
  citationCampaigns: { label: 'Campañas de citaciones', helper: 'Directorios en seguimiento', icon: SearchCheck },
  citationcampaigns: { label: 'Campañas de citaciones', helper: 'Directorios en seguimiento', icon: SearchCheck },
};

export default function UtilidadesOverviewPage() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Row>({});
  const [readiness, setReadiness] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [portfolioData, readinessData] = await Promise.all([
        utilidadesV15Api.portfolio(),
        utilidadesV15Api.readiness(),
      ]);
      setPortfolio(portfolioData);
      setReadiness(readinessData);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el resumen de Utilidades.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const summary = (portfolio.summary as Row | undefined) ?? {};
  const locations = asArray(portfolio.locations) as Row[];
  const alerts = asArray(portfolio.alerts) as Row[];
  const actions = asArray(portfolio.actions) as Row[];
  const orders = asArray(portfolio.workOrders) as Row[];
  const providers = asArray(readiness.providers) as Row[];
  const internal = (readiness.internalModules as Row | undefined) ?? {};

  const health = useMemo(() => {
    const total = providers.reduce((sum, provider) => sum + Number(provider.totalLocations || 0), 0);
    const configured = providers.reduce((sum, provider) => sum + Number(provider.configuredLocations || 0), 0);
    return total ? Math.round((configured / total) * 100) : 0;
  }, [providers]);

  const openActivity = Number(summary.openAlerts || 0) + Number(summary.openActions || 0) + Number(summary.activeWorkOrders || 0);
  const demoLocation = locations.find((location) => location.reference === 'UTIL-DEMO-001');

  return (
    <>
      <PageHead
        eyebrow="Centro de Control"
        title="Resumen de Utilidades"
        subtitle="Vista ejecutiva de ubicaciones, trabajo operativo, campañas y fuentes de datos."
      >
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={15} />Actualizar</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />

      <section className="util-hero util-overview-hero">
        <div className="util-hero-copy">
          <span className="util-hero-kicker"><CheckCircle2 size={14} /> Centro operativo activo</span>
          <h2>Controla el SEO Local desde una sola operación.</h2>
          <p>
            Administra ubicaciones, hallazgos, acciones, campañas, órdenes e integraciones sin perder el contexto de cada cliente.
          </p>
          <div className="util-hero-actions">
            <button className="util-btn red" onClick={() => navigate(demoLocation ? `/utilidades/ubicaciones/${Number(demoLocation.id)}/resumen` : '/utilidades/ubicaciones')}>
              <MapPin size={15} />{demoLocation ? 'Abrir demostración completa' : 'Abrir ubicaciones'}
            </button>
            <button className="util-btn subtle" onClick={() => navigate('/utilidades/operaciones')}>
              <FolderKanban size={15} />Centro de Operaciones
            </button>
          </div>
        </div>
        <div className="util-hero-side">
          <div className="util-hero-stat"><span>Ubicaciones gestionadas</span><strong>{text(summary.locations, '0')}</strong></div>
          <div className="util-hero-stat"><span>Actividad pendiente</span><strong>{openActivity}</strong></div>
          <div className="util-hero-stat"><span>Fuentes preparadas</span><strong>{health}%</strong></div>
        </div>
      </section>

      <div className="util-kpis">
        <Kpi label="Ubicaciones" value={text(summary.locations, '0')} helper="Expedientes dentro de tu alcance" icon={<MapPin size={18} />} />
        <Kpi label="Alertas abiertas" value={text(summary.openAlerts, '0')} helper="Requieren revisión operativa" icon={<AlertTriangle size={18} />} tone={Number(summary.openAlerts) ? 'danger' : 'success'} />
        <Kpi label="Acciones abiertas" value={text(summary.openActions, '0')} helper="Optimizaciones por ejecutar" icon={<Wrench size={18} />} tone={Number(summary.openActions) ? 'warning' : 'success'} />
        <Kpi label="Casos" value={text(internal.cases, '0')} helper="Seguimientos documentados" icon={<FolderKanban size={18} />} />
        <Kpi label="Órdenes activas" value={text(summary.activeWorkOrders, '0')} helper="Trabajo en ejecución" icon={<BriefcaseBusiness size={18} />} />
      </div>

      {health < 100 ? (
        <section className="util-onboarding">
          <div className="util-onboarding-icon"><Settings2 size={22} /></div>
          <div className="util-onboarding-copy">
            <strong>Completa las fuentes de datos cuando estés listo</strong>
            <p>
              Los módulos internos ya funcionan. Para activar métricas externas puedes conectar un webhook o importar datos reales de forma manual.
            </p>
          </div>
          <button className="util-btn primary" onClick={() => navigate('/utilidades/integraciones')}>
            Gestionar integraciones <ArrowRight size={15} />
          </button>
        </section>
      ) : null}

      <UtilidadesFunctionalLab />

      <div className="util-grid2 util-overview-grid">
        <Panel
          title="Fuentes externas"
          subtitle="Estado de preparación por proveedor y ubicación."
          action={<button className="util-btn" onClick={() => navigate('/utilidades/integraciones')}>Gestionar</button>}
        >
          <Progress value={health} label="Cobertura preparada" />
          <div className="util-provider-grid">
            {providers.map((provider) => {
              const key = String(provider.provider);
              const definition = PROVIDERS[key] ?? { name: text(provider.provider), description: 'Fuente externa de datos.', icon: Cable };
              const Icon = definition.icon;
              const connected = Number(provider.connectedLocations || 0);
              const configured = Number(provider.configuredLocations || 0);
              const total = Number(provider.totalLocations || 0);
              const status = connected > 0 ? 'connected' : configured > 0 ? 'configured' : 'not_configured';
              return (
                <article className={`util-provider-card ${status}`} key={key}>
                  <div className="util-provider-icon"><Icon size={18} /></div>
                  <div className="util-provider-copy">
                    <div className="util-card-head">
                      <strong>{definition.name}</strong>
                      {status === 'not_configured' ? <span className="util-provider-pending"><CircleDashed size={12} />Disponible para activar</span> : <Status value={status} />}
                    </div>
                    <p>{definition.description}</p>
                    <span>{connected} conectadas · {configured} preparadas · {total} ubicaciones</span>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title="Módulos internos" subtitle="Actividad real registrada en PostgreSQL.">
          <div className="util-module-grid">
            {Object.entries(internal).map(([key, value]) => {
              const definition = INTERNAL_MODULES[key] ?? {
                label: humanizeKey(key),
                helper: 'Registros activos',
                icon: CircleDashed,
              };
              const Icon = definition.icon;
              return (
                <article className="util-module-card" key={key}>
                  <div className="util-module-icon"><Icon size={17} /></div>
                  <div className="util-module-copy">
                    <span>{definition.label}</span>
                    <strong>{text(value, '0')}</strong>
                    <small>{definition.helper}</small>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="util-info-strip"><Cable size={16} /><span>{text(readiness.note, 'Los módulos internos están disponibles.')}</span></div>
        </Panel>
      </div>

      <Panel title="Cartera de ubicaciones" subtitle="Acceso directo al expediente y sus herramientas.">
        <div className="util-table-wrap">
          <table className="util-table">
            <thead><tr><th>Ubicación</th><th>Cliente</th><th>Ciudad</th><th>Fuente GBP</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {locations.slice(0, 10).map((location) => (
                <tr key={Number(location.id)}>
                  <td><b>{text(location.name)}</b><div className="util-table-sub">{text(location.websiteUrl ?? location.website, 'Sin sitio registrado')}</div></td>
                  <td>{text(location.clientName ?? location.clientProfileId, 'Sin cliente asignado')}</td>
                  <td>{text(location.city, 'Sin ciudad')}</td>
                  <td><Status value={location.gbpPlaceId ? 'configured' : 'not_configured'} /></td>
                  <td><Status value={location.active ? 'active' : 'inactive'} /></td>
                  <td><button className="util-btn primary" onClick={() => navigate(`/utilidades/ubicaciones/${Number(location.id)}/resumen`)}>Abrir expediente</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!locations.length ? <Empty title="Sin ubicaciones" text="Crea o asigna una ubicación para comenzar a trabajar con Utilidades." /> : null}
        </div>
      </Panel>

      <div className="util-grid2">
        <Panel title="Alertas recientes" subtitle="Señales que requieren atención." action={<button className="util-btn" onClick={() => navigate('/utilidades/alertas')}>Ver todas</button>}>
          {alerts.length ? alerts.slice(0, 6).map((item) => (
            <article className="util-card" key={Number(item.id)}>
              <div className="util-card-head"><b>{text(item.title)}</b><Status value={item.severity} /></div>
              <p>{text(item.locationName ?? item.locationId)} · {formatDate(item.createdAt)}</p>
            </article>
          )) : <Empty compact title="Todo bajo control" text="No hay alertas abiertas en este momento." />}
        </Panel>
        <Panel title="Acciones y órdenes" subtitle="Trabajo operativo más reciente." action={<button className="util-btn" onClick={() => navigate('/utilidades/operaciones')}>Centro de Operaciones</button>}>
          {[...actions.slice(0, 3), ...orders.slice(0, 3)].length ? [...actions.slice(0, 3), ...orders.slice(0, 3)].map((item, index) => (
            <article className="util-card" key={`${text(item.id)}-${index}`}>
              <div className="util-card-head"><b>{text(item.title)}</b><Status value={item.status} /></div>
              <p>{text(item.locationName ?? item.locationId)}</p>
            </article>
          )) : <Empty compact title="Sin trabajo pendiente" text="No hay acciones u órdenes activas." />}
        </Panel>
      </div>
      <Loading show={loading} />
    </>
  );
}
