/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, CheckCircle2, CircleCheckBig, Globe2, ListChecks, Play, PlugZap, Plus, RefreshCw, Settings2, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import UtilidadesRankTrackerV21 from './UtilidadesRankTrackerV21';
import UtilidadesSearchGridV22 from './UtilidadesSearchGridV22';
import UtilidadesCitationTrackerV23 from './UtilidadesCitationTrackerV23';
import UtilidadesCitationBuilderV24 from './UtilidadesCitationBuilderV24';
import UtilidadesGbpAuditV25 from './UtilidadesGbpAuditV25';
import UtilidadesReputationManagerV26 from './UtilidadesReputationManagerV26';
import {
  Empty,
  ErrorBox,
  Kpi,
  Loading,
  Modal,
  PageHead,
  Panel,
  Status,
  SuccessBox,
  asArray,
  formatDate,
  formatMoney,
  humanizeKey,
  text,
} from './UtilidadesCommon';

const sections = [
  ['resumen', 'Resumen'],
  ['analisis-priorizado', 'Análisis priorizado'],
  ['gestor', 'Gestor / FUR'],
  ['posicionamiento', 'Posicionamiento'],
  ['cuadricula', 'Cuadrícula de Búsqueda'],
  ['citaciones', 'Monitor de Citaciones'],
  ['constructor-citaciones', 'Constructor de Citaciones'],
  ['auditoria-gbp', 'Auditoría GBP'],
  ['reputacion', 'Reputación'],
  ['publicaciones-gbp', 'Publicaciones GBP'],
  ['auditoria-local', 'Auditoría Local'],
  ['analytics', 'Analytics y Search Console'],
  ['acciones', 'Acciones'],
  ['ordenes', 'Órdenes de Trabajo'],
  ['marca-blanca', 'Marca Blanca'],
] as const;

const reportTypes: Record<string, string> = {
  posicionamiento: 'rank_tracker',
  cuadricula: 'search_grid',
  citaciones: 'citation_tracker',
  'auditoria-gbp': 'gbp_audit',
  reputacion: 'reputation',
  'auditoria-local': 'local_audit',
};

export default function UtilidadesLocationWorkspacePage() {
  const { id, section = 'resumen' } = useParams();
  const locationId = Number(id);
  const navigate = useNavigate();
  const [data, setData] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [actionDraft, setActionDraft] = useState<Row>({ title: '', priority: 'high', description: '' });
  const [selectedAction, setSelectedAction] = useState<Row | null>(null);
  const [market, setMarket] = useState<Row[]>([]);
  const [selectedService, setSelectedService] = useState<Row | null>(null);
  const [quote, setQuote] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    try {
      setData(await utilidadesV15Api.workspace(locationId));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el expediente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [locationId]);

  const location = (data.location ?? {}) as Row;
  const reports = asArray(data.reports) as Row[];
  const findings = asArray(data.findings) as Row[];
  const alerts = asArray(data.alerts) as Row[];
  const actions = asArray(data.actions) as Row[];
  const orders = asArray(data.workOrders) as Row[];
  const kpis = asArray(data.kpis) as Row[];
  const integrations = asArray(data.integrations) as Row[];
  const snapshots = asArray(data.providerSnapshots) as Row[];
  const cases = asArray(data.cases) as Row[];
  const assessment = (data.latestAssessment ?? null) as Row | null;
  const metric = (code: string) => kpis.find((item) => item.metricCode === code)?.value ?? '—';
  const toolReport = useMemo(() => reports.find((item) => String(item.reportType) === reportTypes[section]), [reports, section]);

  async function runReport() {
    const type = reportTypes[section] ?? section;
    setLoading(true);
    setSetupMessage(null);
    try {
      await utilidadesV15Api.runReport({
        locationId,
        title: `${sections.find((item) => item[0] === section)?.[1] ?? section} · ${text(location.name)}`,
        reportType: type,
      });
      setError(null);
      setSuccess('Diagnóstico ejecutado y guardado en PostgreSQL.');
      await load();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo ejecutar el informe.';
      if (/configurad|place id|datos importados|fuente|proveedor/i.test(message)) {
        setError(null);
        setSetupMessage(message);
      } else {
        setError(message);
      }
      setLoading(false);
    }
  }

  async function createAction(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await utilidadesV15Api.createAction({ ...actionDraft, locationId });
      setModal(null);
      setActionDraft({ title: '', priority: 'high', description: '' });
      setSuccess('Acción creada y vinculada al expediente.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la acción.');
      setLoading(false);
    }
  }

  async function openMarket(action: Row) {
    setSelectedAction(action);
    setSelectedService(null);
    setQuote(null);
    setLoading(true);
    try {
      const result = await utilidadesV15Api.market(Number(action.id));
      setMarket(asArray(result.items) as Row[]);
      setModal('market');
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir el Mercado.');
    } finally {
      setLoading(false);
    }
  }

  async function createQuote(service: Row) {
    if (!selectedAction) return;
    setLoading(true);
    try {
      const saved = await utilidadesV15Api.createQuote({
        actionId: Number(selectedAction.id),
        serviceId: Number(service.service_id),
        agencyProfileId: Number(service.agency_profile_id),
        agencyServiceId: Number(service.agency_service_id),
      });
      setSelectedService(service);
      setQuote(saved);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la cotización.');
    } finally {
      setLoading(false);
    }
  }

  async function approveQuote() {
    if (!quote) return;
    setLoading(true);
    try {
      const order = await utilidadesV15Api.approveQuote(Number(quote.id));
      setModal(null);
      setSuccess('Cotización aprobada, crédito debitado y Orden de Trabajo creada.');
      await load();
      navigate(`/utilidades/ordenes-trabajo?open=${Number(order.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo aprobar la cotización.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow={`Expediente · ${text(location.reference, 'Sin referencia')}`}
        title={text(location.name, 'Ubicación')}
        subtitle={`${text(location.city, 'Ciudad pendiente')} · Centro operativo y herramientas SEO Local`}
      >
        <button className="util-btn" onClick={() => void load()} title="Recargar datos generales del expediente"><RefreshCw size={15} />Actualizar expediente</button>
        {reportTypes[section] && !['posicionamiento','cuadricula','citaciones','auditoria-gbp','reputacion'].includes(section) ? <button className="util-btn primary" onClick={() => void runReport()}><Play size={15} />Ejecutar diagnóstico</button> : null}
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />
      <div className="util-workspace">
        <nav className="util-toolnav" aria-label="Herramientas de la ubicación">
          <div className="util-toolnav-head">Herramientas del expediente</div>
          {sections.map(([path, label]) => <NavLink key={path} to={`/utilidades/ubicaciones/${locationId}/${path}`}>{label}</NavLink>)}
        </nav>
        <div className="util-workspace-content">
          {section === 'resumen' ? <Summary location={location} alerts={alerts} reports={reports} findings={findings} actions={actions} orders={orders} cases={cases} metric={metric} balances={(data.creditBalances as Row | undefined) ?? {}} /> : null}
          {section === 'analisis-priorizado' || section === 'analisis-ia' ? <Insights findings={findings} onAction={(finding) => { setActionDraft({ title: finding.title, description: finding.description, priority: finding.impact, findingId: finding.id }); setModal('action'); }} /> : null}
          {section === 'gestor' ? <Manager location={location} onSaved={async () => { setSuccess('Datos de ubicación actualizados.'); await load(); }} onError={setError} /> : null}
          {section === 'posicionamiento' ? <UtilidadesRankTrackerV21 locationId={locationId} locationName={text(location.name, 'Ubicación')} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {section === 'cuadricula' ? <UtilidadesSearchGridV22 locationId={locationId} locationName={text(location.name, 'Ubicación')} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {section === 'citaciones' ? <UtilidadesCitationTrackerV23 locationId={locationId} locationName={text(location.name, 'Ubicación')} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {Object.keys(reportTypes).includes(section) && !['posicionamiento','cuadricula','citaciones','auditoria-gbp','reputacion'].includes(section) ? <ToolScreen section={section} report={toolReport} assessment={assessment} snapshots={snapshots} setupMessage={setupMessage} onRun={runReport} onConfigure={() => navigate(`/utilidades/integraciones?locationId=${locationId}`)} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {section === 'constructor-citaciones' ? <UtilidadesCitationBuilderV24 locationId={locationId} locationName={text(location.name, 'Ubicación')} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {section === 'auditoria-gbp' ? <UtilidadesGbpAuditV25 locationId={locationId} locationName={text(location.name, 'Ubicación')} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {section === 'reputacion' ? <UtilidadesReputationManagerV26 locationId={locationId} locationName={text(location.name, 'Ubicación')} onAction={(title, description) => { setActionDraft({ title, description, priority: 'high' }); setModal('action'); }} /> : null}
          {section === 'publicaciones-gbp' ? <CampaignList title="Publicaciones GBP" items={asArray(data.gbpPosts) as Row[]} empty="No hay publicaciones GBP para esta ubicación." action={() => navigate('/utilidades/publicaciones-gbp')} /> : null}
          {section === 'analytics' ? <Analytics integrations={integrations} snapshots={snapshots} onOpen={() => navigate('/utilidades/integraciones')} /> : null}
          {section === 'acciones' ? <Actions items={actions} onNew={() => { setActionDraft({ title: '', description: '', priority: 'medium' }); setModal('action'); }} onMarket={openMarket} /> : null}
          {section === 'ordenes' ? <Orders items={orders} onOpen={(order) => navigate(`/utilidades/ordenes-trabajo?open=${Number(order.id)}`)} /> : null}
          {section === 'marca-blanca' ? <Panel title="Marca Blanca"><p>La identidad de marca se administra por cliente y se conserva para informes, portales y entregables.</p><button className="util-btn primary" style={{ marginTop: 10 }} onClick={() => navigate('/utilidades/marca-blanca')}>Abrir configuración</button></Panel> : null}
        </div>
      </div>

      {modal === 'action' ? <ActionModal draft={actionDraft} setDraft={setActionDraft} onClose={() => setModal(null)} onSubmit={createAction} /> : null}
      {modal === 'market' ? <MarketModal market={market} quote={quote} selectedService={selectedService} onClose={() => setModal(null)} onSelect={createQuote} onApprove={approveQuote} onBack={() => { setQuote(null); setSelectedService(null); }} /> : null}
      <Loading show={loading} />
    </>
  );
}

function Summary({ location, alerts, reports, findings, actions, orders, cases, metric, balances }: { location: Row; alerts: Row[]; reports: Row[]; findings: Row[]; actions: Row[]; orders: Row[]; cases: Row[]; metric: (code: string) => unknown; balances: Row }) {
  const demoReport = reports.find((report) => report.reportType === 'demo_full_audit');
  const demoPayload = (demoReport?.payload ?? {}) as Row;
  const coverage = asArray(demoPayload.coverage) as Row[];
  return <>
    {demoReport ? <Panel title="Demostración integral activada" subtitle="Este expediente contiene datos demostrativos en todas las categorías para recorrer el flujo completo." className="util-demo-panel"><div className="util-demo-summary"><div className="util-demo-score"><span>Puntuación global</span><strong>{text(demoPayload.overall_score, '82')}</strong><small>de 100 puntos</small></div><div className="util-demo-coverage">{coverage.map((item) => <div className="util-demo-coverage-row" key={String(item.category)}><div><b>{text(item.category)}</b><Status value={item.status} /></div><div className="util-progress-track"><span style={{ width: `${Math.min(100, Number(item.score ?? 0))}%` }} /></div><strong>{text(item.score)}%</strong></div>)}</div></div></Panel> : null}
    <div className="util-kpis"><Kpi label="Posición promedio" value={text(metric('average_position'))} icon={<TrendingUp size={17} />} /><Kpi label="Calificación" value={text(metric('rating'))} icon={<Star size={17} />} /><Kpi label="Citaciones activas" value={text(metric('live_citations'))} icon={<Globe2 size={17} />} /><Kpi label="Puntuación auditoría" value={text(metric('audit_score'))} icon={<ListChecks size={17} />} /><Kpi label="Alertas abiertas" value={alerts.filter((item) => item.status !== 'resolved').length} icon={<BarChart3 size={17} />} /></div>
    <div className="util-grid2"><Panel title="Perfil operativo"><table className="util-table util-profile-table"><tbody><tr><th>Dirección</th><td>{text(location.address)}</td></tr><tr><th>Sitio web</th><td>{text(location.websiteUrl)}</td></tr><tr><th>Palabra clave</th><td>{text(location.primaryKeyword)}</td></tr><tr><th>Categoría principal</th><td>{text(location.primaryCategory)}</td></tr><tr><th>Evaluación vinculada</th><td>{location.functionalAssessmentId ? 'Evaluación integral activa' : 'Pendiente'}</td></tr><tr><th>Google Business Profile</th><td><Status value={location.gbpPlaceId ? 'connected' : 'not_configured'} /></td></tr></tbody></table></Panel><Panel title="Actividad del expediente"><div className="util-data-grid"><div className="util-data-item"><span>Informes</span><strong>{reports.length}</strong></div><div className="util-data-item"><span>Hallazgos</span><strong>{findings.length}</strong></div><div className="util-data-item"><span>Acciones</span><strong>{actions.length}</strong></div><div className="util-data-item"><span>Casos</span><strong>{cases.length}</strong></div><div className="util-data-item"><span>Órdenes</span><strong>{orders.length}</strong></div>{Object.entries(balances).map(([currency, value]) => <div className="util-data-item" key={currency}><span>Crédito {currency}</span><strong>{formatMoney(value, currency)}</strong></div>)}</div></Panel></div>
  </>;
}

function Insights({ findings, onAction }: { findings: Row[]; onAction: (finding: Row) => void }) {
  return <Panel title="Hallazgos priorizados" subtitle="Priorización basada en informes y evidencia guardada; no se presenta como IA si no existe un proveedor configurado.">{findings.length ? <div className="util-grid2">{findings.map((finding) => <div className="util-card" key={Number(finding.id)}><Status value={finding.impact} /><h3>{text(finding.title)}</h3><p>{text(finding.description)}</p><button className="util-btn primary" onClick={() => onAction(finding)}>Crear acción</button></div>)}</div> : <Empty text="Ejecuta herramientas con datos configurados para generar hallazgos verificables." />}</Panel>;
}

function Manager({ location, onSaved, onError }: { location: Row; onSaved: () => void | Promise<void>; onError: (message: string) => void }) {
  const [form, setForm] = useState<Row>({ ...location });
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try { await utilidadesV15Api.updateLocation(Number(location.id), form); await onSaved(); }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'No se pudo guardar la ubicación.'); }
    finally { setBusy(false); }
  }
  return <Panel title="Gestor / FUR de ubicación" subtitle="Datos maestros e identificadores de proveedor."><form onSubmit={save} className="util-formgrid">{[['name', 'Nombre'], ['reference', 'Referencia'], ['city', 'Ciudad'], ['address', 'Dirección'], ['phone', 'Teléfono'], ['websiteUrl', 'Sitio web'], ['primaryKeyword', 'Palabra clave'], ['primaryCategory', 'Categoría'], ['gbpPlaceId', 'GBP Place ID'], ['ga4PropertyId', 'GA4 Property ID'], ['gscPropertyUrl', 'GSC Property URL']].map(([key, label]) => <div className={`util-field ${['address', 'websiteUrl'].includes(key) ? 'util-wide' : ''}`} key={key}><label>{label}</label><input value={String(form[key] ?? '')} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></div>)}<div className="util-field util-wide"><label>Notas</label><textarea value={String(form.notes ?? '')} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><div><button disabled={busy} className="util-btn primary">{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></form></Panel>;
}

function ToolScreen({
  section,
  report,
  assessment,
  snapshots,
  setupMessage,
  onRun,
  onConfigure,
  onAction,
}: {
  section: string;
  report?: Row;
  assessment: Row | null;
  snapshots: Row[];
  setupMessage: string | null;
  onRun: () => void;
  onConfigure: () => void;
  onAction: (title: string, description: string) => void;
}) {
  const payload = (report?.payload ?? {}) as Row;
  const configured = Boolean(payload.configured);
  const toolName = sections.find(([path]) => path === section)?.[1] ?? 'Herramienta SEO';
  const providerMap: Record<string, string[]> = {
    posicionamiento: ['rankings', 'gsc'],
    cuadricula: ['rankings'],
    citaciones: ['citations'],
    'auditoria-gbp': ['gbp'],
    reputacion: ['reputation', 'gbp'],
    'auditoria-local': ['local_audit'],
  };
  const relevant = snapshots.filter((snapshot) => (providerMap[section] ?? []).includes(String(snapshot.provider)));

  if (!report) {
    return (
      <Panel title={toolName} subtitle="Ejecuta el primer diagnóstico para crear el historial de esta ubicación.">
        <div className="util-tool-empty">
          <div className="util-tool-empty-icon"><Settings2 size={24} /></div>
          <div>
            <strong>Herramienta lista para comenzar</strong>
            <p>Utiliza los datos internos disponibles o conecta una fuente externa para obtener un análisis más completo.</p>
          </div>
          <div className="util-tool-empty-actions">
            <button className="util-btn" onClick={onConfigure}><PlugZap size={15} />Configurar fuentes</button>
            <button className="util-btn primary" onClick={() => void onRun()}><Play size={15} />Ejecutar diagnóstico</button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title={`Último diagnóstico · ${toolName}`}
        subtitle={`Actualizado ${formatDate(report.updatedAt ?? report.createdAt)}`}
        action={<Status value={configured ? report.status : 'not_configured'} />}
      >
        {configured ? (
          <>
            <div className="util-success util-report-summary">
              <CircleCheckBig size={18} />
              <span>{text(report.summary, 'Diagnóstico generado correctamente.')}</span>
            </div>
            <ReportDashboard section={section} payload={payload} />
          </>
        ) : (
          <div className="util-setup-state">
            <div className="util-setup-state-icon"><PlugZap size={25} /></div>
            <div className="util-setup-state-copy">
              <span className="util-setup-state-kicker">Configuración guiada</span>
              <h3>Activa los datos de {toolName}</h3>
              <p>{text(setupMessage ?? payload.reason ?? report.summary, 'Esta herramienta necesita una fuente de datos antes de generar resultados.')}</p>
              <div className="util-setup-list compact">
                <div className="util-setup-item"><span className="util-setup-number">1</span><div><strong>Configura la fuente</strong><span>Conecta un webhook o selecciona el modo de importación manual.</span></div></div>
                <div className="util-setup-item"><span className="util-setup-number">2</span><div><strong>Importa datos verificables</strong><span>Carga el snapshot del proveedor correspondiente a esta ubicación.</span></div></div>
                <div className="util-setup-item"><span className="util-setup-number">3</span><div><strong>Ejecuta el diagnóstico</strong><span>El informe quedará guardado con su fecha, fuente e indicadores.</span></div></div>
              </div>
            </div>
            <div className="util-setup-state-actions">
              <button className="util-btn primary" onClick={onConfigure}><PlugZap size={15} />Configurar fuente</button>
              <button className="util-btn" onClick={() => void onRun()}><RefreshCw size={15} />Volver a comprobar</button>
            </div>
          </div>
        )}
      </Panel>

      {relevant.length ? (
        <Panel title="Datos de proveedor" subtitle="Snapshots reales importados o sincronizados.">
          <div className="util-stack">
            {relevant.slice(0, 5).map((snapshot) => (
              <article className="util-card" key={Number(snapshot.id)}>
                <div className="util-card-head"><Status value={snapshot.provider} /><span>{formatDate(snapshot.periodEnd)}</span></div>
                <SnapshotDashboard provider={snapshot.provider} payload={(snapshot.payload ?? {}) as Row} />
              </article>
            ))}
          </div>
        </Panel>
      ) : null}

      {configured ? (
        <Panel title="Siguiente acción" subtitle="Convierte el diagnóstico en una tarea operativa.">
          <button className="util-btn primary" onClick={() => onAction(`Optimizar ${toolName}`, `Acción creada desde el informe ${text(report.title)}.`)}>
            <Plus size={15} />Crear acción desde este diagnóstico
          </button>
        </Panel>
      ) : null}

      {section === 'cuadricula' && assessment ? <Panel title="Cuadrícula disponible"><Grid cells={asArray(assessment.grid) as Row[]} /></Panel> : null}
    </>
  );
}


const REPORT_ARRAY_LABELS: Record<string, string> = {
  keywords: 'Palabras clave monitoreadas',
  checks: 'Comprobaciones del diagnóstico',
  directories: 'Directorios y consistencia NAP',
  sources: 'Fuentes de reputación',
  themes: 'Temas detectados en reseñas',
  recommendations: 'Recomendaciones prioritarias',
  coverage: 'Cobertura del expediente',
  next_steps: 'Próximos pasos',
};

type ToolPresentation = {
  scoreLabel: string;
  scoreDescription: string;
  metricKeys: string[];
};

const TOOL_PRESENTATIONS: Record<string, ToolPresentation> = {
  posicionamiento: {
    scoreLabel: 'Visibilidad local',
    scoreDescription: 'Resume la presencia de las palabras clave monitoreadas en los resultados locales y orgánicos.',
    metricKeys: ['average_position', 'tracked_keywords', 'top_3', 'top_10', 'visibility_change'],
  },
  cuadricula: {
    scoreLabel: 'Cobertura geográfica',
    scoreDescription: 'Mide la fortaleza de la ubicación dentro del área analizada para la palabra clave seleccionada.',
    metricKeys: ['keyword', 'grid_size', 'center_rank', 'average_rank', 'top_3_coverage', 'top_10_coverage', 'competitor_count'],
  },
  citaciones: {
    scoreLabel: 'Consistencia de citaciones',
    scoreDescription: 'Evalúa la presencia, coherencia NAP y calidad de las menciones del negocio en directorios.',
    metricKeys: ['live_citations', 'consistent_citations', 'inconsistent_citations', 'duplicates', 'pending_directories'],
  },
  'auditoria-gbp': {
    scoreLabel: 'Optimización de GBP',
    scoreDescription: 'Resume la completitud y mantenimiento del perfil de Google Business Profile.',
    metricKeys: ['profile_completeness', 'primary_category', 'additional_categories', 'photos', 'reviews', 'posts_last_30_days', 'products', 'questions_answered'],
  },
  reputacion: {
    scoreLabel: 'Salud de reputación',
    scoreDescription: 'Combina calificación, volumen, respuesta y sentimiento para explicar la percepción del negocio.',
    metricKeys: ['rating', 'review_count', 'new_reviews_30_days', 'response_rate', 'average_response_hours', 'positive_sentiment'],
  },
  'auditoria-local': {
    scoreLabel: 'Salud SEO Local',
    scoreDescription: 'Consolida señales técnicas, contenido, experiencia móvil y elementos propios del posicionamiento local.',
    metricKeys: ['technical_score', 'content_score', 'local_signals_score', 'schema_score', 'mobile_score', 'speed_score'],
  },
};

const METRIC_HINTS: Record<string, string> = {
  average_position: 'Promedio de las palabras clave rastreadas',
  tracked_keywords: 'Términos incluidos en el seguimiento',
  top_3: 'Palabras con máxima visibilidad',
  top_10: 'Palabras presentes en la primera página',
  visibility_change: 'Variación frente al periodo anterior',
  keyword: 'Consulta utilizada en la medición',
  grid_size: 'Cobertura de puntos analizados',
  center_rank: 'Posición en el punto central',
  average_rank: 'Promedio de toda la cuadrícula',
  top_3_coverage: 'Área con presencia en Top 3',
  top_10_coverage: 'Área con presencia en Top 10',
  competitor_count: 'Negocios detectados en el área',
  live_citations: 'Fichas encontradas y activas',
  consistent_citations: 'Directorios con NAP correcto',
  inconsistent_citations: 'Directorios que requieren corrección',
  duplicates: 'Fichas duplicadas detectadas',
  pending_directories: 'Oportunidades aún no publicadas',
  profile_completeness: 'Campos relevantes completados',
  primary_category: 'Categoría principal registrada',
  additional_categories: 'Categorías secundarias activas',
  photos: 'Recursos visuales publicados',
  reviews: 'Reseñas visibles en el perfil',
  posts_last_30_days: 'Actividad reciente del perfil',
  products: 'Productos o servicios publicados',
  questions_answered: 'Preguntas atendidas en el perfil',
  rating: 'Promedio consolidado de fuentes',
  review_count: 'Volumen total analizado',
  new_reviews_30_days: 'Reseñas recibidas recientemente',
  response_rate: 'Reseñas con respuesta del negocio',
  average_response_hours: 'Tiempo medio hasta responder',
  positive_sentiment: 'Opiniones clasificadas como positivas',
  technical_score: 'Indexación, rastreo y base técnica',
  content_score: 'Calidad y cobertura del contenido local',
  local_signals_score: 'NAP, geografía y señales de entidad',
  schema_score: 'Cobertura de datos estructurados',
  mobile_score: 'Experiencia en dispositivos móviles',
  speed_score: 'Rendimiento de carga observado',
  users: 'Usuarios del periodo importado',
  sessions: 'Sesiones registradas',
  engaged_sessions: 'Sesiones con interacción relevante',
  conversions: 'Acciones objetivo registradas',
  conversion_rate: 'Porcentaje de sesiones que convierten',
  organic_sessions: 'Sesiones provenientes de búsqueda orgánica',
  local_landing_sessions: 'Sesiones en páginas locales',
  clicks: 'Clics desde resultados de búsqueda',
  impressions: 'Apariciones en resultados de búsqueda',
  ctr: 'Relación entre clics e impresiones',
  branded_clicks: 'Clics en consultas de marca',
  non_branded_clicks: 'Clics en consultas genéricas',
  views: 'Visualizaciones del perfil',
  searches: 'Búsquedas que activaron el perfil',
  calls: 'Llamadas generadas desde el perfil',
  website_clicks: 'Visitas al sitio desde el perfil',
  direction_requests: 'Solicitudes de cómo llegar',
  messages: 'Mensajes iniciados desde el perfil',
};

const REPORT_COLUMNS: Record<string, Array<{ key: string; label: string; status?: boolean }>> = {
  keywords: [
    { key: 'keyword', label: 'Palabra clave' },
    { key: 'position', label: 'Posición actual' },
    { key: 'previous', label: 'Posición anterior' },
    { key: 'change', label: 'Mejora' },
  ],
  checks: [
    { key: 'check', label: 'Comprobación' },
    { key: 'impact', label: 'Impacto', status: true },
    { key: 'status', label: 'Estado', status: true },
  ],
  directories: [
    { key: 'directory', label: 'Directorio' },
    { key: 'authority', label: 'Autoridad' },
    { key: 'status', label: 'Estado', status: true },
    { key: 'nap', label: 'Consistencia NAP', status: true },
  ],
  sources: [
    { key: 'source', label: 'Fuente' },
    { key: 'rating', label: 'Calificación' },
    { key: 'reviews', label: 'Reseñas' },
    { key: 'response_rate', label: 'Tasa de respuesta' },
  ],
  themes: [
    { key: 'theme', label: 'Tema' },
    { key: 'mentions', label: 'Menciones' },
    { key: 'sentiment', label: 'Sentimiento', status: true },
  ],
  coverage: [
    { key: 'category', label: 'Categoría' },
    { key: 'score', label: 'Puntuación' },
    { key: 'status', label: 'Estado', status: true },
  ],
};

const PROVIDER_LABELS: Record<string, string> = {
  ga4: 'Google Analytics 4',
  gsc: 'Google Search Console',
  gbp: 'Google Business Profile',
  rankings: 'Seguimiento de posiciones',
  citations: 'Monitor de citaciones',
  reputation: 'Reputación',
  local_audit: 'Auditoría SEO Local',
};

const PROVIDER_METRICS: Record<string, string[]> = {
  ga4: ['users', 'sessions', 'engaged_sessions', 'conversions', 'conversion_rate', 'organic_sessions', 'local_landing_sessions'],
  gsc: ['clicks', 'impressions', 'ctr', 'average_position', 'branded_clicks', 'non_branded_clicks'],
  gbp: ['views', 'searches', 'calls', 'website_clicks', 'direction_requests', 'messages'],
  rankings: ['average_position', 'tracked_keywords', 'top_3', 'top_10', 'visibility_change'],
  citations: ['live_citations', 'consistent_citations', 'inconsistent_citations', 'duplicates'],
  reputation: ['rating', 'review_count', 'response_rate', 'positive_sentiment'],
  local_audit: ['audit_score', 'technical_score', 'content_score', 'schema_score'],
};

function reportHealth(score: number) {
  if (score >= 85) return { label: 'Rendimiento sólido', tone: 'success' };
  if (score >= 70) return { label: 'Base saludable con oportunidades', tone: 'warning' };
  if (score > 0) return { label: 'Requiere intervención prioritaria', tone: 'danger' };
  return { label: 'Sin puntuación disponible', tone: 'info' };
}

function ReportDashboard({ section, payload }: { section: string; payload: Row }) {
  const presentation = TOOL_PRESENTATIONS[section] ?? {
    scoreLabel: 'Resultado general',
    scoreDescription: 'Resumen consolidado del diagnóstico disponible.',
    metricKeys: Object.keys(payload),
  };
  const score = Number(payload.score ?? payload.overall_score ?? 0);
  const health = reportHealth(score);
  const metrics = presentation.metricKeys
    .filter((key) => payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
    .map((key) => [key, payload[key]] as const);
  const arrays = Object.entries(payload).filter(([, value]) => Array.isArray(value) && value.length);
  const source = text(payload.source, payload.demo ? 'Dataset demostrativo SEOLOCAL' : 'Fuente registrada');

  return <div className="util-report-dashboard">
    <div className="util-report-overview">
      <article className="util-score-summary">
        <div className="util-score-ring" style={{ background: `conic-gradient(#d32323 ${Math.max(0, Math.min(100, score)) * 3.6}deg, #edf0f3 0deg)` }}>
          <div className="util-score-ring-core"><strong>{score || '—'}</strong><span>/100</span></div>
        </div>
        <div className="util-score-copy">
          <span className="util-score-kicker">{presentation.scoreLabel}</span>
          <h3>{health.label}</h3>
          <p>{presentation.scoreDescription}</p>
          <div className="util-report-source"><Status value={payload.demo ? 'manual' : 'connected'} /><span>{source}</span></div>
        </div>
      </article>
      <div className="util-report-metrics">
        {metrics.map(([key, value]) => <div className="util-report-metric" key={key}>
          <span>{humanizeKey(key)}</span>
          <strong>{formatMetric(key, value)}</strong>
          <small>{METRIC_HINTS[key] ?? 'Indicador correspondiente a este diagnóstico'}</small>
        </div>)}
      </div>
    </div>
    {arrays.map(([key, value]) => <ReportCollection key={key} collectionKey={key} title={REPORT_ARRAY_LABELS[key] ?? humanizeKey(key)} items={value as unknown[]} />)}
  </div>;
}

function SnapshotDashboard({ provider, payload }: { provider: unknown; payload: Row }) {
  const providerKey = String(provider ?? '').toLowerCase();
  const orderedKeys = PROVIDER_METRICS[providerKey] ?? Object.keys(payload);
  const entries = orderedKeys
    .filter((key) => key !== 'demo' && payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
    .map((key) => [key, payload[key]] as const);
  return <div className="util-snapshot-dashboard">
    <div className="util-snapshot-provider"><CheckCircle2 size={17} /><div><span>Datos del periodo disponibles</span><b>{PROVIDER_LABELS[providerKey] ?? humanizeKey(providerKey)}</b></div></div>
    <div className="util-report-metrics compact">{entries.map(([key, value]) => <div className="util-report-metric" key={key}><span>{humanizeKey(key)}</span><strong>{formatMetric(key, value)}</strong><small>{METRIC_HINTS[key] ?? 'Dato importado de la fuente registrada'}</small></div>)}</div>
  </div>;
}

function ReportCollection({ collectionKey, title, items }: { collectionKey: string; title: string; items: unknown[] }) {
  if (!items.length) return null;
  const objects = items.filter((item) => item && typeof item === 'object') as Row[];
  if (objects.length === items.length) {
    const columns: Array<{ key: string; label: string; status?: boolean }> = REPORT_COLUMNS[collectionKey] ?? Array.from(new Set(objects.flatMap((item) => Object.keys(item)))).slice(0, 6).map((key) => ({ key, label: humanizeKey(key) }));
    return <section className="util-report-section"><div className="util-report-section-head"><div><h3>{title}</h3><p>Datos específicos de esta utilidad y del periodo informado.</p></div><span>{items.length} registros</span></div><div className="util-table-wrap"><table className="util-table util-report-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{objects.map((item, index) => <tr key={index}>{columns.map((column) => <td key={column.key}>{column.status ? <Status value={item[column.key]} /> : <span>{formatMetric(column.key, item[column.key])}</span>}</td>)}</tr>)}</tbody></table></div></section>;
  }
  return <section className="util-report-section"><div className="util-report-section-head"><div><h3>{title}</h3><p>Acciones derivadas de los hallazgos del diagnóstico.</p></div></div><div className="util-recommendations">{items.map((item, index) => <div key={index}><span>{index + 1}</span><p>{text(item)}</p></div>)}</div></section>;
}

function formatMetric(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (/rate|coverage|completeness|sentiment|ctr|change|score/.test(key) && !key.includes('count') && key !== 'average_position') return `${numeric}%`;
    if (/rating/.test(key)) return `${numeric.toLocaleString('es-419')} ★`;
    if (/hours/.test(key)) return `${numeric.toLocaleString('es-419')} h`;
    if (/position|rank/.test(key) && !/count|competitor/.test(key)) return `#${numeric.toLocaleString('es-419', { maximumFractionDigits: 1 })}`;
    return numeric.toLocaleString('es-419', { maximumFractionDigits: 2 });
  }
  return text(value);
}

function Analytics({ integrations, snapshots, onOpen }: { integrations: Row[]; snapshots: Row[]; onOpen: () => void }) {
  const rows = integrations.filter((row) => ['ga4', 'gsc'].includes(String(row.provider)));
  const data = snapshots.filter((row) => ['ga4', 'gsc'].includes(String(row.provider)));
  return <>
    <Panel title="Analytics y Search Console" subtitle="Conexiones, cuentas registradas y fecha de la última actualización." action={<button className="util-btn primary" onClick={onOpen}>Gestionar integraciones</button>}>
      <div className="util-grid2">{rows.map((row) => <article className="util-source-card" key={Number(row.id)}><div className="util-source-card-icon"><CheckCircle2 size={18} /></div><div><span className="util-source-card-kicker">{PROVIDER_LABELS[String(row.provider)] ?? String(row.provider).toUpperCase()}</span><h3>{text(row.accountReference, 'Cuenta demostrativa')}</h3><p>Modo {humanizeKey(String(row.mode))} · Última sincronización {formatDate(row.lastSyncAt)}</p></div><Status value={row.status} /></article>)}</div>
      {!rows.length ? <Empty text="No hay configuración de GA4 o Search Console para esta ubicación." /> : null}
    </Panel>
    <Panel title="Rendimiento por fuente" subtitle="Cada bloque utiliza exclusivamente métricas propias del proveedor.">
      {data.length ? <div className="util-stack">{data.slice(0, 10).map((row) => <article className="util-card" key={Number(row.id)}><div className="util-card-head"><b>{PROVIDER_LABELS[String(row.provider)] ?? humanizeKey(String(row.provider))}</b><span>{formatDate(row.periodStart)} – {formatDate(row.periodEnd)}</span></div><SnapshotDashboard provider={row.provider} payload={(row.payload ?? {}) as Row} /></article>)}</div> : <Empty text="Importa o sincroniza datos verificables para mostrar rendimiento." />}
    </Panel>
  </>;
}

function Grid({ cells }: { cells: Row[] }) {
  if (!cells.length) return <Empty text="La evaluación no contiene celdas de cuadrícula." />;
  return <div className="util-mapgrid">{cells.map((cell, index) => { const rank = Number(cell.rank_value ?? 0); const color = !rank ? '#7b8490' : rank <= 3 ? '#1d8b48' : rank <= 7 ? '#69a84f' : rank <= 12 ? '#d49b16' : '#c94f36'; return <span className="util-dot" key={index} style={{ background: color }}>{rank || '—'}</span>; })}</div>;
}

function CampaignList({ title, items, empty, action }: { title: string; items: Row[]; empty: string; action: () => void }) {
  return <Panel title={title} action={<button className="util-btn primary" onClick={action}>Gestionar módulo</button>}>{items.length ? <table className="util-table"><thead><tr><th>Nombre</th><th>Estado</th><th>Progreso</th></tr></thead><tbody>{items.map((item) => <tr key={Number(item.id)}><td>{text(item.name ?? item.title)}</td><td><Status value={item.status} /></td><td>{text(item.completedCount ?? item.sentCount ?? item.scheduledAt)}</td></tr>)}</tbody></table> : <Empty text={empty} />}</Panel>;
}

function Actions({ items, onNew, onMarket }: { items: Row[]; onNew: () => void; onMarket: (action: Row) => void }) {
  return <Panel title="Acciones" action={<button className="util-btn primary" onClick={onNew}><Plus size={14} />Nueva acción</button>}>{items.length ? <table className="util-table"><thead><tr><th>Acción</th><th>Prioridad</th><th>Estado</th><th>Resolución</th><th /></tr></thead><tbody>{items.map((action) => <tr key={Number(action.id)}><td>{text(action.title)}</td><td><Status value={action.priority} /></td><td><Status value={action.status} /></td><td>{text(action.resolutionMode)}</td><td><button className="util-btn primary" onClick={() => onMarket(action)}><ShoppingBag size={13} />Resolver con Mercado</button></td></tr>)}</tbody></table> : <Empty />}</Panel>;
}

function Orders({ items, onOpen }: { items: Row[]; onOpen: (order: Row) => void }) {
  return <Panel title="Órdenes de Trabajo" subtitle="Entregables, estados, inversión y acceso al detalle operativo.">{items.length ? <div className="util-table-wrap"><table className="util-table"><thead><tr><th>Orden</th><th>Prioridad</th><th>Estado</th><th>Valor</th><th /></tr></thead><tbody>{items.map((order) => <tr key={Number(order.id)}><td><b>{text(order.title)}</b><div className="util-muted">{text(order.description, 'Orden vinculada al expediente')}</div></td><td><Status value={order.priority} /></td><td><Status value={order.status} /></td><td>{formatMoney(order.amount, text(order.currencyCode, 'USD'))}</td><td><button className="util-btn" onClick={() => onOpen(order)}>Abrir detalle</button></td></tr>)}</tbody></table></div> : <Empty />}</Panel>;
}

function ActionModal({ draft, setDraft, onClose, onSubmit }: { draft: Row; setDraft: (value: Row) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  return <Modal title="Crear acción" onClose={onClose} footer={<><button className="util-btn" onClick={onClose}>Cancelar</button><button className="util-btn primary" form="action-form">Crear acción</button></>}><form id="action-form" onSubmit={onSubmit} className="util-formgrid"><div className="util-field util-wide"><label>Título</label><input required value={String(draft.title ?? '')} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div className="util-field"><label>Prioridad</label><select value={String(draft.priority ?? 'medium')} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div><div className="util-field"><label>Fecha límite</label><input type="date" value={String(draft.dueDate ?? '')} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></div><div className="util-field util-wide"><label>Descripción</label><textarea value={String(draft.description ?? '')} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div></form></Modal>;
}

function MarketModal({ market, quote, selectedService, onClose, onSelect, onApprove, onBack }: { market: Row[]; quote: Row | null; selectedService: Row | null; onClose: () => void; onSelect: (service: Row) => void; onApprove: () => void; onBack: () => void }) {
  return <Modal title="Mercado de Servicios" onClose={onClose} wide footer={quote ? <><button className="util-btn" onClick={onBack}>Volver</button><button className="util-btn primary" onClick={onApprove}>Aprobar y crear Orden</button></> : <button className="util-btn" onClick={onClose}>Cerrar</button>}>{!quote ? <div className="util-grid2">{market.map((service) => <div className={`util-card ${selectedService?.agency_service_id === service.agency_service_id ? 'selected' : ''}`} key={String(service.agency_service_id)}><b>{text(service.name)}</b><p>{text(service.code)} · {text(service.agency_name)} · ★ {text(service.rating)}</p><p>{text(service.scope)}</p><p><b>{text(service.currency_code)} {text(service.price)}</b> · {text(service.agency_delivery_days)} días · capacidad {text(service.capacity_monthly)}</p><button className="util-btn primary" onClick={() => void onSelect(service)}>Seleccionar</button></div>)}</div> : <div><div className="util-notice"><b>Cotización lista para aprobación</b></div><table className="util-table"><tbody><tr><th>Servicio</th><td>{text(selectedService?.name)}</td></tr><tr><th>Agencia</th><td>{text(selectedService?.agency_name)}</td></tr><tr><th>Valor</th><td>{text(quote.currencyCode)} {text(quote.amount)}</td></tr><tr><th>Entrega</th><td>{text(quote.deliveryDays)} días</td></tr><tr><th>Alcance</th><td>{text(quote.scope)}</td></tr></tbody></table></div>}</Modal>;
}
