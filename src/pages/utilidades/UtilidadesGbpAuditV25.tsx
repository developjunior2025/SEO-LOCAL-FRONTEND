/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  Globe2,
  Images,
  Info,
  ListChecks,
  MapPin,
  MessageCircleQuestion,
  MessageSquareText,
  Newspaper,
  PackageSearch,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import './utilidades-gbp-audit-v25.css';

const VERSION = 'V25.1.1';

type Props = {
  locationId: number;
  locationName: string;
  onAction: (title: string, description: string) => void;
};

type TabKey =
  | 'resumen'
  | 'perfil'
  | 'categorias'
  | 'resenas'
  | 'media'
  | 'publicaciones'
  | 'catalogo'
  | 'qna'
  | 'rendimiento'
  | 'competencia'
  | 'cambios';

const TABS: Array<[TabKey, string]> = [
  ['resumen', 'Resumen'],
  ['perfil', 'Perfil'],
  ['categorias', 'Categorías'],
  ['resenas', 'Reseñas'],
  ['media', 'Fotos y media'],
  ['publicaciones', 'Publicaciones'],
  ['catalogo', 'Productos y servicios'],
  ['qna', 'Preguntas y respuestas'],
  ['rendimiento', 'Rendimiento'],
  ['competencia', 'Competencia'],
  ['cambios', 'Cambios'],
];

function rec(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
}
function rows(value: unknown): Row[] { return Array.isArray(value) ? (value as Row[]) : []; }
function n(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function s(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}
function pct(value: unknown) { return `${Math.round(n(value))}%`; }
function dateLabel(value: unknown) {
  const raw = s(value, '');
  if (!raw) return '—';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function severityLabel(value: unknown) {
  const code = s(value, '').toLowerCase();
  if (code === 'high' || code === 'critical') return 'ALTA';
  if (code === 'medium') return 'MEDIA';
  if (code === 'opportunity') return 'OPORTUNIDAD';
  if (code === 'positive') return 'POSITIVO';
  return 'BAJA';
}
function delta(current: number, previous: number) {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export default function UtilidadesGbpAuditV25({ locationId, locationName, onAction }: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('resumen');
  const [range, setRange] = useState(180);
  const [modal, setModal] = useState<'method' | 'schedule' | null>(null);
  const [frequency, setFrequency] = useState('manual');
  const [weekday, setWeekday] = useState('monday');
  const [compare, setCompare] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.gbpAudit(locationId);
      setState(result);
      const schedule = rec(result.schedule);
      setFrequency(s(schedule.frequency, 'manual'));
      setWeekday(s(schedule.weekday, 'monday'));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar Auditoría GBP V25.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [locationId]);

  const payload = rec(state.payload);
  const metrics = rec(payload.metrics);
  const methodology = rec(payload.methodology);
  const location = rec(payload.location);
  const integrations = rec(payload.integrations);
  const latestRun = rec(state.latestRun);
  const runs = rows(state.runs);
  const previousRun = runs.length > 1 ? runs[1] : undefined;
  const previousMetrics = rec(previousRun?.metrics);
  const localLab = Boolean(payload.localLab);

  async function executeAudit() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.gbpAuditRun(locationId, range);
      setState(result);
      setSuccess('Auditoría GBP V25.1.1 actualizada y guardada en PostgreSQL.');
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la auditoría.');
    } finally {
      setLoading(false);
    }
  }

  async function saveSchedule() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.gbpAuditSchedule(locationId, { frequency, weekday });
      setState(result);
      setModal(null);
      setSuccess(frequency === 'manual' ? 'Programación desactivada.' : 'Programación guardada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la programación.');
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    ['GBP Health', metrics.health, ShieldCheck, 'Salud ponderada', 'score'],
    ['Completitud', metrics.completeness, ListChecks, 'Campos y recursos', 'percent'],
    ['Precisión del perfil', metrics.accuracy, CheckCircle2, 'Consistencia maestra', 'percent'],
    ['Actividad', metrics.activity, Activity, 'Freshness y cadencia', 'percent'],
    ['Engagement', metrics.engagement, MessageSquareText, 'Respuestas e interacción', 'percent'],
    ['Reputación', metrics.reputation, Star, 'Calidad de reseñas', 'percent'],
    ['Índice competitivo', metrics.competitiveness, Users, `${n(rec(payload.competition).solvDeltaPp) >= 0 ? '+' : ''}${s(rec(payload.competition).solvDeltaPp, '0')} pp SoLV vs Top 5`, 'score'],
    ['Incidencias', metrics.incidences, AlertTriangle, 'Requieren revisión', 'number'],
  ] as const;

  return <div className="gbp-v25-root">
    <section className="gbp-v25-hero">
      <div>
        <div className="gbp-v25-badges"><span>LOCAL LAB {VERSION}</span><span className="ok">Persistencia activa</span>{localLab ? <span className="source">Datos Local Lab</span> : <span className="source provider">Snapshot GBP</span>}</div>
        <h2>Auditoría GBP</h2>
        <p>Diagnóstico integral del perfil, actividad, contenido, rendimiento, competencia y oportunidades de Google Business Profile.</p>
        <small>Última auditoría {dateLabel(latestRun.generatedAt ?? payload.generatedAt)} · {s(location.primaryKeyword, 'Keyword principal pendiente')} · {s(payload.sourceMode, 'local_lab') === 'local_lab' ? 'entorno Local Lab' : 'snapshot importado'}</small>
      </div>
      <div className="gbp-v25-hero-actions">
        <button onClick={() => setModal('schedule')}><CalendarDays size={16}/>Programar</button>
        <button onClick={() => setCompare((value) => !value)} className={compare ? 'active' : ''}><BarChart3 size={16}/>Comparar</button>
        <button onClick={() => window.print()}><FileText size={16}/>Reporte</button>
        <button className="primary" onClick={() => void executeAudit()}><RefreshCw size={16}/>Actualizar auditoría</button>
      </div>
    </section>

    {localLab ? <div className="gbp-v25-source-note"><ShieldCheck size={16}/><div><b>Fuente demostrativa claramente identificada</b><span>{s(payload.sourceDisclaimer)}</span></div></div> : null}
    {error ? <div className="gbp-v25-alert error"><AlertTriangle size={16}/><span>{error}</span><button onClick={() => void load()}>Reintentar</button></div> : null}
    {success ? <div className="gbp-v25-alert success"><CheckCircle2 size={16}/><span>{success}</span><button onClick={() => setSuccess(null)}>Cerrar</button></div> : null}

    {compare && previousRun ? <CompareStrip current={metrics} previous={previousMetrics} currentDate={latestRun.generatedAt ?? payload.generatedAt} previousDate={previousRun.generatedAt} /> : compare ? <div className="gbp-v25-compare-empty">Todavía no hay dos ejecuciones V25/V25.1/V25.1.1 persistidas. Ejecuta la auditoría nuevamente para habilitar comparación real.</div> : null}

    <div className="gbp-v25-kpis">
      {kpis.map(([label, value, Icon, helper, mode]) => <article className="gbp-v25-kpi" key={label}>
        <div><Icon size={16}/><span>{label}</span>{label === 'GBP Health' ? <button title="Cómo se calcula" onClick={() => setModal('method')}><CircleHelp size={14}/></button> : null}</div>
        <strong>{mode === 'number' ? s(value, '0') : mode === 'score' ? `${Math.round(n(value))}/100` : pct(value)}</strong>
        <small>{helper}</small>
      </article>)}
    </div>

    <section className="gbp-v25-workspace">
      <nav className="gbp-v25-tabs" aria-label="Secciones Auditoría GBP">
        {TABS.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}{key === 'cambios' && n(rec(payload.changes).critical) > 0 ? <b>{s(rec(payload.changes).critical)}</b> : null}</button>)}
      </nav>
      {tab === 'resumen' ? <Summary payload={payload} metrics={metrics} methodology={methodology} locationId={locationId} onAction={onAction} onNavigate={(path) => navigate(path)} /> : null}
      {tab === 'perfil' ? <ProfileAudit items={rows(payload.profile)} webSignals={rows(payload.webSignals)} onAction={onAction} onNavigate={(path) => navigate(path)} /> : null}
      {tab === 'categorias' ? <CategoryAudit items={rows(payload.categories)} locationName={locationName} onAction={onAction} /> : null}
      {tab === 'resenas' ? <ReviewAudit data={rec(payload.reviews)} onNavigate={() => navigate(`/utilidades/ubicaciones/${locationId}/reputacion`)} /> : null}
      {tab === 'media' ? <MediaAudit data={rec(payload.media)} /> : null}
      {tab === 'publicaciones' ? <PostsAudit data={rec(payload.posts)} onNavigate={() => navigate(`/utilidades/ubicaciones/${locationId}/publicaciones-gbp`)} /> : null}
      {tab === 'catalogo' ? <CatalogAudit data={rec(payload.products)} onAction={onAction} /> : null}
      {tab === 'qna' ? <QnaAudit data={rec(payload.qna)} onAction={onAction} /> : null}
      {tab === 'rendimiento' ? <PerformanceAudit data={rows(payload.performance)} searchTerms={rows(payload.searchTerms)} range={range} onRange={setRange} locationId={locationId} onNavigate={(path) => navigate(path)} /> : null}
      {tab === 'competencia' ? <CompetitionAudit data={rec(payload.competition)} keyword={s(location.primaryKeyword, 'Keyword principal')} integrations={integrations} locationId={locationId} onNavigate={(path) => navigate(path)} /> : null}
      {tab === 'cambios' ? <ChangeAudit data={rec(payload.changes)} onAction={onAction} onNavigate={(path) => navigate(path)} /> : null}
    </section>

    {loading ? <div className="gbp-v25-loading"><RefreshCw size={24} className="spin"/><span>Procesando Auditoría GBP V25.1.1…</span></div> : null}
    {modal === 'method' ? <MethodModal methodology={methodology} onClose={() => setModal(null)} /> : null}
    {modal === 'schedule' ? <ScheduleModal frequency={frequency} weekday={weekday} setFrequency={setFrequency} setWeekday={setWeekday} onSave={saveSchedule} onClose={() => setModal(null)} /> : null}
  </div>;
}

function CompareStrip({ current, previous, currentDate, previousDate }: { current: Row; previous: Row; currentDate: unknown; previousDate: unknown }) {
  const keys: Array<[string, string]> = [['health','GBP Health'],['accuracy','Precisión GBP'],['activity','Actividad'],['reputation','Reputación'],['competitiveness','Índice competitivo']];
  return <div className="gbp-v25-compare-strip"><div><b>Comparación temporal</b><span>{dateLabel(previousDate)} → {dateLabel(currentDate)}</span><small>La comparación usa ejecuciones persistidas; no mezcla snapshots de módulos distintos.</small></div>{keys.map(([key,label]) => { const d = Math.round(n(current[key]) - n(previous[key])); return <div key={key}><span>{label}</span><strong>{Math.round(n(current[key]))}/100</strong><em className={d >= 0 ? 'up' : 'down'}>{d >= 0 ? '+' : ''}{d} pts</em></div>; })}</div>;
}

function Summary({ payload, metrics, methodology, locationId, onAction, onNavigate }: { payload: Row; metrics: Row; methodology: Row; locationId: number; onAction: Props['onAction']; onNavigate: (path:string)=>void }) {
  const insights = rows(payload.insights);
  const changes = rec(payload.changes);
  const duplicates = rec(payload.duplicates);
  const performance = rows(payload.performance);
  const last = performance.at(-1) ?? {};
  const prior = performance.at(-2) ?? {};
  const good = insights.filter((item) => ['low','positive'].includes(s(item.severity,'').toLowerCase())).length;
  const attention = insights.filter((item) => ['high','critical','medium'].includes(s(item.severity,'').toLowerCase())).length;
  return <div className="gbp-v25-summary">
    <div className="gbp-v25-summary-top">
      <article className="gbp-v25-health">
        <div className="gbp-v25-score-ring" style={{ '--score': `${n(metrics.health) * 3.6}deg` } as CSSProperties}><div><strong>{Math.round(n(metrics.health))}</strong><span>/100</span></div></div>
        <div><small>GBP HEALTH</small><h3>{n(metrics.health) >= 85 ? 'Perfil sólido con oportunidades puntuales' : n(metrics.health) >= 70 ? 'Buen nivel, requiere optimización' : 'Intervención prioritaria'}</h3><p>Score explicable en 7 dimensiones. Cada punto conduce a evidencia y una acción concreta.</p><button onClick={() => document.querySelector<HTMLButtonElement>('.gbp-v25-kpi button[title="Cómo se calcula"]')?.click()}><Info size={14}/>Cómo se calcula</button></div>
      </article>
      <article className="gbp-v25-snapshot">
        <div className="gbp-v25-section-title"><div><small>SEÑALES DEL PERIODO</small><h3>Rendimiento reciente</h3></div><button onClick={() => onNavigate(`/utilidades/ubicaciones/${locationId}/auditoria-gbp`)} title="El tab Rendimiento está en esta misma auditoría"><TrendingUp size={15}/></button></div>
        <div className="gbp-v25-signal-grid">
          <Signal label="Impresiones Search" value={n(last.searchImpressions)} change={delta(n(last.searchImpressions), n(prior.searchImpressions))}/>
          <Signal label="Maps" value={n(last.mapsImpressions)} change={delta(n(last.mapsImpressions), n(prior.mapsImpressions))}/>
          <Signal label="Clics web" value={n(last.websiteClicks)} change={delta(n(last.websiteClicks), n(prior.websiteClicks))}/>
          <Signal label="Llamadas" value={n(last.calls)} change={delta(n(last.calls), n(prior.calls))}/>
        </div>
      </article>
    </div>

    <div className="gbp-v25-summary-status">
      <div><CheckCircle2 size={18}/><strong>{good}</strong><span>{good === 1 ? 'señal sólida' : 'señales sólidas'}</span></div>
      <div><AlertTriangle size={18}/><strong>{attention}</strong><span>áreas a revisar</span></div>
      <div><Sparkles size={18}/><strong>{rows(payload.categories).filter((item) => s(item.opportunity) === 'alta').length}</strong><span>oportunidades de categoría</span></div>
      <div><Clock3 size={18}/><strong>{n(changes.critical)}</strong><span>cambios críticos</span></div>
      <div><AlertTriangle size={18}/><strong>{n(duplicates.open)}</strong><span>duplicados abiertos</span></div>
    </div>

    <div className="gbp-v25-section-title"><div><small>INTELIGENCIA GBP</small><h3>Qué corregir y dónde crecer</h3></div></div>
    <div className="gbp-v25-insights">
      {insights.slice(0,6).map((item) => <article key={s(item.id)} className={`sev-${s(item.severity,'low')}`}><small>{severityLabel(item.severity)}</small><h4>{s(item.title)}</h4><p>{s(item.description)}</p><div><button className="primary" onClick={() => onAction(s(item.title), s(item.description))}>Crear acción</button><button onClick={() => onNavigate(s(item.route, `/utilidades/ubicaciones/${locationId}/acciones`))}>Abrir módulo <ArrowRight size={13}/></button></div></article>)}
    </div>

    <div className="gbp-v25-cross-tools">
      <div className="gbp-v25-section-title"><div><small>VENTAJA SEOLOCAL</small><h3>Auditoría transversal del expediente</h3><p>La auditoría no termina en GBP: conecta señales de ranking, cuadrícula y citaciones.</p></div></div>
      <div className="gbp-v25-cross-grid">
        <CrossCard icon={<TrendingUp/>} title="Rank Tracker" connected={Boolean(rec(payload.integrations).rankTracker)} text="Posiciones y keywords" onClick={() => onNavigate(`/utilidades/ubicaciones/${locationId}/posicionamiento`)}/>
        <CrossCard icon={<MapPin/>} title="Search Grid" connected={Boolean(rec(payload.integrations).searchGrid)} text="AMR y Share of Local Voice" onClick={() => onNavigate(`/utilidades/ubicaciones/${locationId}/cuadricula`)}/>
        <CrossCard icon={<Globe2/>} title="Citation Tracker" connected={Boolean(rec(payload.integrations).citationTracker)} text="Cobertura y brechas NAP" onClick={() => onNavigate(`/utilidades/ubicaciones/${locationId}/citaciones`)}/>
        <CrossCard icon={<AlertTriangle/>} title="Riesgo de duplicados" connected={Boolean(rec(payload.integrations).citationTracker)} text={`${n(duplicates.open)} ${n(duplicates.open) === 1 ? 'duplicado abierto' : 'duplicados abiertos'} detectados`} onClick={() => onNavigate(s(duplicates.route, `/utilidades/ubicaciones/${locationId}/citaciones`))}/>
        <CrossCard icon={<Star/>} title="Reputación" connected text="Respuesta y evolución" onClick={() => onNavigate(`/utilidades/ubicaciones/${locationId}/reputacion`)}/>
      </div>
    </div>

    <details className="gbp-v25-method-inline"><summary>Metodología y fuentes de esta ejecución</summary><p>{s(methodology.description)}</p><p>{s(payload.sourceDisclaimer)}</p></details>
  </div>;
}

function Signal({ label, value, change }: { label: string; value: number; change: number }) { return <div><span>{label}</span><strong>{value.toLocaleString('es-CO')}</strong><em className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '+' : ''}{change}%</em></div>; }
function CrossCard({ icon, title, connected, text, onClick }: { icon: ReactNode; title: string; connected: boolean; text: string; onClick:()=>void }) { return <button className="gbp-v25-cross-card" onClick={onClick}><i>{icon}</i><div><b>{title}</b><span>{text}</span></div><em className={connected ? 'on' : 'off'}>{connected ? 'Conectado' : 'Sin ejecución'}</em><ArrowRight size={15}/></button>; }

function ProfileAudit({ items, webSignals, onAction, onNavigate }: { items: Row[]; webSignals: Row[]; onAction: Props['onAction']; onNavigate:(path:string)=>void }) {
  const warnings = items.filter((item) => s(item.status) !== 'correct').length;
  return <div className="gbp-v25-content">
    <div className="gbp-v25-section-title"><div><small>AUDITORÍA CAMPO POR CAMPO</small><h3>Perfil Google Business Profile</h3><p>Referencia maestra vs. valor encontrado. {warnings ? `${warnings} ${warnings === 1 ? 'campo requiere' : 'campos requieren'} revisión.` : 'Los campos principales son consistentes.'}</p></div><button className="primary" onClick={() => onNavigate(s(items[0]?.actionRoute, '#'))}><Settings2 size={15}/>Editar referencia</button></div>
    <div className="gbp-v25-profile-table"><div className="head"><span>Campo</span><span>Esperado</span><span>Encontrado</span><span>Estado</span><span>Acción</span></div>{items.map((item) => <div className="row" key={s(item.key)}><b>{s(item.label)}{item.evidence ? <small title={s(item.evidence)}>i</small> : null}</b><span>{s(item.expected)}</span><span>{s(item.found)}</span><StatusDot status={s(item.status)}/><div>{s(item.status) !== 'correct' ? <button onClick={() => onAction(`Corregir ${s(item.label)}`, `Esperado: ${s(item.expected)}. Encontrado: ${s(item.found)}.`)}>Crear acción</button> : <span className="muted">Sin acción</span>}</div></div>)}</div>
    <div className="gbp-v25-linked-signals"><div className="gbp-v25-section-title"><div><small>SEÑALES WEB VINCULADAS AL GBP</small><h3>Contexto on-page separado del perfil</h3><p>Estas señales ayudan al SEO local, pero no son campos internos de Google Business Profile y no penalizan Precisión del perfil.</p></div></div><div className="gbp-v25-profile-table compact"><div className="head"><span>Señal</span><span>Esperado</span><span>Encontrado</span><span>Estado</span><span>Acción</span></div>{webSignals.map((item)=><div className="row" key={s(item.key)}><b>{s(item.label)}</b><span>{s(item.expected)}</span><span>{s(item.found)}</span><StatusDot status={s(item.status)}/><div>{s(item.status)!=='correct'?<button onClick={()=>onNavigate(s(item.actionRoute,'#'))}>Abrir Auditoría Local</button>:<span className="muted">Contexto</span>}</div></div>)}</div></div>
  </div>;
}

function StatusDot({ status }: { status: string }) { const ok=status==='correct'; const missing=status==='missing'; return <span className={`gbp-v25-status ${ok?'ok':missing?'bad':'warn'}`}>{ok?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>} {ok?'Correcto':missing?'Faltante':'Revisar'}</span>; }

function CategoryAudit({ items, locationName, onAction }: { items: Row[]; locationName:string; onAction: Props['onAction'] }) {
  const opportunities = items.filter((item)=>!item.own).sort((a,b)=>n(a.priorityRank)-n(b.priorityRank));
  const [selected, setSelected] = useState<Row | null>(null);
  return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>INTELIGENCIA DE CATEGORÍAS</small><h3>Tu perfil vs. Top 3 y Top 10</h3><p>La prioridad combina prevalencia competitiva y relevancia; no se ordena sólo por cuántos competidores usan la categoría.</p></div></div>
    <div className="gbp-v25-category-cards"><article className="own"><small>TU NEGOCIO</small><h4>{locationName}</h4><strong>{items.filter((item)=>Boolean(item.own)).length}</strong><span>categorías observadas</span></article>{opportunities.slice(0,3).map((item)=><article key={s(item.name)}><small>PRIORIDAD #{s(item.priorityRank)} · {s(item.opportunity).toUpperCase()}</small><h4>{s(item.name)}</h4><strong>{s(item.opportunityScore)}/100</strong><span>{s(item.top10)}/10 Top 10 · {s(item.top3)}/3 Top 3</span></article>)}</div>
    <div className="gbp-v25-matrix"><div className="head"><span>Categoría</span><span>Tu negocio</span><span>Top 3</span><span>Top 10</span><span>Opportunity Score</span><span>Acción</span></div>{items.map((item)=><div className="row" key={s(item.name)}><b>{s(item.name)}</b><span className={item.own?'yes':'no'}>{item.own?'✓ Activa':'— No'}</span><span>{s(item.top3)}/3</span><span>{s(item.top10)}/10</span><span><em className={`opp-${s(item.opportunity)}`}>{item.own?'Correcta':`${s(item.opportunityScore)}/100 · ${s(item.opportunity)}`}</em></span><button disabled={Boolean(item.own)} onClick={()=>setSelected(item)}>{item.own?'Activa':'Evaluar categoría'}</button></div>)}</div>
    <p className="gbp-v25-matrix-note">La presencia competitiva es una señal de investigación; no recomienda categorías irrelevantes ni sustituye la validación del negocio.</p>
    {selected ? <div className="gbp-v25-inline-drawer"><div><small>DETALLE DE OPORTUNIDAD</small><h4>{s(selected.name)}</h4><p>{s(selected.rationale)}</p><div className="gbp-v25-opportunity-facts"><span>Score <b>{s(selected.opportunityScore)}/100</b></span><span>Relevancia <b>{s(selected.relevance)}/100</b></span><span>Top 3 <b>{s(selected.top3)}/3</b></span><span>Top 10 <b>{s(selected.top10)}/10</b></span></div></div><div><button onClick={()=>setSelected(null)}>Cerrar</button><button className="primary" onClick={()=>onAction(`Evaluar categoría GBP: ${s(selected.name)}`, s(selected.rationale))}>Crear acción</button></div></div> : null}
  </div>;
}

function ReviewAudit({ data, onNavigate }: { data: Row; onNavigate:()=>void }) {
  const distribution=rows(data.distribution);
  return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>AUDITORÍA DE RESEÑAS</small><h3>Volumen, velocidad y capacidad de respuesta</h3><p>Todos los valores de esta pestaña consumen el mismo Current GBP Snapshot canónico que Competencia y Cambios.</p></div><button className="primary" onClick={onNavigate}><Star size={15}/>Gestionar en Reputación</button></div><div className="gbp-v25-big-metrics"><Metric icon={<Star/>} label="Rating" value={`${s(data.rating)}/5`} helper="Promedio observado"/><Metric icon={<MessageSquareText/>} label="Reseñas" value={s(data.total)} helper={`+${s(data.last30)} últimos 30 días`}/><Metric icon={<TrendingUp/>} label="Crecimiento" value={`${n(data.growthPercent)>=0?'+':''}${s(data.growthPercent)}%`} helper="vs. 30 días previos"/><Metric icon={<CheckCircle2/>} label="Respondidas" value={pct(data.responseRate)} helper={`${s(data.avgResponseHours)} h promedio`}/><Metric icon={<Clock3/>} label="Freshness" value={`${s(data.latestReviewDays)} d`} helper="desde última reseña"/></div><div className="gbp-v25-review-grid"><article><h4>Distribución de estrellas</h4>{distribution.map((item)=><div className="gbp-v25-stars" key={s(item.stars)}><span>{s(item.stars)} ★</span><i><b style={{width:`${n(item.percent)}%`}}/></i><strong>{pct(item.percent)}</strong></div>)}</article><article className="gbp-v25-review-bridge"><small>LECTURA OPERATIVA</small><h4>La reputación se audita aquí; se opera en Reputación</h4><p>Auditoría GBP identifica brechas. El módulo Reputación concentra respuestas, campañas y seguimiento para evitar duplicar funciones.</p><button onClick={onNavigate}>Abrir Reputación <ArrowRight size={14}/></button></article></div></div>;
}

function MediaAudit({ data }: { data: Row }) { const types=rows(data.types); return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>FOTOS Y MEDIA</small><h3>Cobertura visual y freshness</h3><p>El total ahora se reconcilia con su desglose: fotos + videos = recursos multimedia.</p></div></div><div className="gbp-v25-big-metrics"><Metric icon={<Images/>} label="Recursos" value={s(data.total)} helper={`${s(data.photos)} fotos + ${s(data.videos)} videos`}/><Metric icon={<Camera/>} label="Nuevos 30d" value={`+${s(data.added30)}`} helper="Freshness visual"/><Metric icon={<Clock3/>} label="Última carga" value={`${s(data.freshnessDays)} d`} helper="Antigüedad"/></div><div className="gbp-v25-media-grid">{types.map((item)=><article key={s(item.type)}><Camera size={18}/><div><b>{s(item.type)}</b><span>Cobertura del tipo</span></div><strong>{s(item.count)}</strong></article>)}</div><div className="gbp-v25-tip"><Sparkles size={17}/><div><b>Integridad de cobertura</b><span>Desglose reconciliado: {s(data.decompositionTotal)} de {s(data.total)} recursos. “Otros” absorbe elementos no clasificados para evitar totales imposibles.</span></div></div></div>; }

function PostsAudit({ data, onNavigate }: { data: Row; onNavigate:()=>void }) { return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>ACTIVIDAD GBP</small><h3>Cadencia de publicaciones</h3><p>7d, 30d, 90d y freshness se derivan de una sola línea temporal; un último post de hace más de 7 días nunca puede coexistir con publicaciones en 7d.</p></div><button className="primary" onClick={onNavigate}><Newspaper size={15}/>Ir a Publicaciones GBP</button></div><div className="gbp-v25-big-metrics"><Metric icon={<Newspaper/>} label="7 días" value={s(data.last7)} helper="Publicaciones"/><Metric icon={<CalendarDays/>} label="30 días" value={s(data.last30)} helper={`${s(data.cadencePerWeek)} por semana`}/><Metric icon={<BarChart3/>} label="90 días" value={s(data.last90)} helper="Histórico reciente"/><Metric icon={<Clock3/>} label="Último post" value={`${s(data.daysSinceLastPost)} d`} helper="Freshness"/></div><div className="gbp-v25-post-types">{rows(data.types).map((item)=><article key={s(item.name)}><span>{s(item.name)}</span><strong>{s(item.count)}</strong><i style={{width:`${Math.min(100,n(item.count)*12)}%`}}/></article>)}<article><span>Con CTA</span><strong>{s(data.ctaCount)}</strong><i style={{width:`${Math.min(100,n(data.ctaCount)*12)}%`}}/></article></div><div className="gbp-v25-integrity-line"><CheckCircle2 size={15}/><span>Línea temporal coherente · fuente: {s(data.source)}</span></div></div>; }

function CatalogAudit({ data, onAction }: { data: Row; onAction: Props['onAction'] }) { const gaps=rows(data.gaps); return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>PRODUCTOS Y SERVICIOS</small><h3>Cobertura del catálogo GBP</h3><p>Audita cantidad, descripciones y brechas candidatas sin inventar servicios.</p></div></div><div className="gbp-v25-big-metrics"><Metric icon={<PackageSearch/>} label="Productos" value={s(data.products)} helper="Publicados"/><Metric icon={<Store/>} label="Servicios" value={s(data.services)} helper="Configurados"/><Metric icon={<FileText/>} label="Con descripción" value={pct(data.withDescriptionPercent)} helper="Cobertura descriptiva"/><Metric icon={<BarChart3/>} label="Con precio" value={pct(data.withPricePercent)} helper="Cuando aplica"/><Metric icon={<AlertTriangle/>} label="Brechas" value={s(data.missingRecommended)} helper="Candidatas a validar"/></div>{gaps.length?<div className="gbp-v25-gap-table"><div className="head"><span>Brecha candidata</span><span>Tipo</span><span>Motivo</span><span>Validación</span><span>Acción</span></div>{gaps.map((gap)=><div className="row" key={s(gap.name)}><b>{s(gap.name)}</b><span>{s(gap.type)}</span><span>{s(gap.reason)}</span><em>Confirmar que existe</em><button onClick={()=>onAction(`Validar cobertura GBP: ${s(gap.name)}`, s(gap.reason))}>Crear acción</button></div>)}</div>:<div className="gbp-v25-empty-inline"><CheckCircle2 size={16}/>No se detectaron brechas candidatas en el snapshot actual.</div>}<div className="gbp-v25-tip"><Info size={17}/><div><b>Auditoría de cobertura</b><span>Una brecha sólo se convierte en recomendación después de confirmar que el producto o servicio existe realmente en el negocio.</span></div></div></div>; }

function QnaAudit({ data, onAction }: { data: Row; onAction: Props['onAction'] }) { const pending=rows(data.pendingQuestions); return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>PREGUNTAS Y RESPUESTAS</small><h3>Atención pública del perfil</h3></div>{n(data.unanswered)>0?<button className="primary" onClick={()=>onAction('Responder preguntas GBP pendientes', `${s(data.unanswered)} ${n(data.unanswered)===1?'pregunta requiere':'preguntas requieren'} respuesta.`)}><MessageCircleQuestion size={15}/>Crear acción</button>:null}</div><div className="gbp-v25-big-metrics"><Metric icon={<MessageCircleQuestion/>} label="Preguntas" value={s(data.total)} helper="Total observado"/><Metric icon={<CheckCircle2/>} label="Respondidas" value={s(data.answered)} helper={pct(data.responseRate)}/><Metric icon={<AlertTriangle/>} label="Sin respuesta" value={s(data.unanswered)} helper="Requieren atención"/><Metric icon={<Clock3/>} label="Respuesta media" value={`${s(data.avgResponseHours)} h`} helper="Tiempo operativo"/><Metric icon={<Sparkles/>} label="Nuevas 30d" value={s(data.new30)} helper="Actividad reciente"/></div>{pending.length?<div className="gbp-v25-pending-qna"><h4>Preguntas pendientes concretas</h4>{pending.map((item)=><article key={s(item.id)}><div><MessageCircleQuestion size={17}/><span>{s(item.question)}</span><small>{s(item.ageDays)} d sin respuesta · {s(item.source)==='snapshot'?'snapshot':'candidato Local Lab'}</small></div><button onClick={()=>onAction('Responder pregunta GBP', s(item.question))}>Crear acción</button></article>)}</div>:null}</div>; }

function PerformanceAudit({ data, searchTerms, range, onRange, locationId, onNavigate }: { data: Row[]; searchTerms: Row[]; range:number; onRange:(value:number)=>void; locationId:number; onNavigate:(path:string)=>void }) {
  const [mode,setMode]=useState<'absolute'|'index'|'delta'>('index');
  const [enabled,setEnabled]=useState<Record<string,boolean>>({searchImpressions:true,mapsImpressions:true,websiteClicks:true});
  const count=range===30?2:range===90?4:range===180?7:range===365?12:18;
  const points=useMemo(()=>data.slice(-count),[data,count]);
  const last=points.at(-1)??{}; const prev=points.at(-2)??{};
  const d=(key:string)=>delta(n(last[key]),n(prev[key]));
  const helper=(key:string)=>`${d(key)>=0?'+':''}${d(key)}% vs anterior`;
  const toggles:Array<[string,string]>=[['searchImpressions','Search'],['mapsImpressions','Maps'],['websiteClicks','Clics web']];
  return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>PERFORMANCE INTELLIGENCE</small><h3>Rendimiento comparable y accionable</h3><p>Series históricas normalizadas, deltas consistentes y búsquedas conectadas a Rank Tracker/Search Grid.</p></div><div className="gbp-v25-range">{[[30,'30d'],[90,'90d'],[180,'180d'],[365,'12m'],[548,'18m']].map(([value,label])=><button key={value} className={range===value?'active':''} onClick={()=>onRange(Number(value))}>{label}</button>)}</div></div><div className="gbp-v25-big-metrics"><Metric icon={<Search/>} label="Search" value={n(last.searchImpressions).toLocaleString('es-CO')} helper={helper('searchImpressions')}/><Metric icon={<MapPin/>} label="Maps" value={n(last.mapsImpressions).toLocaleString('es-CO')} helper={helper('mapsImpressions')}/><Metric icon={<Globe2/>} label="Clics web" value={n(last.websiteClicks).toLocaleString('es-CO')} helper={helper('websiteClicks')}/><Metric icon={<Phone/>} label="Llamadas" value={n(last.calls).toLocaleString('es-CO')} helper={helper('calls')}/><Metric icon={<MapPin/>} label="Indicaciones" value={n(last.directions).toLocaleString('es-CO')} helper={helper('directions')}/><Metric icon={<MessageSquareText/>} label="Conversaciones" value={n(last.conversations).toLocaleString('es-CO')} helper={helper('conversations')}/></div><div className="gbp-v25-chart-controls"><div><button className={mode==='absolute'?'active':''} onClick={()=>setMode('absolute')}>Valores absolutos</button><button className={mode==='index'?'active':''} onClick={()=>setMode('index')}>Índice 100</button><button className={mode==='delta'?'active':''} onClick={()=>setMode('delta')}>Variación %</button></div><div>{toggles.map(([key,label])=><label key={key}><input type="checkbox" checked={enabled[key]} onChange={(e)=>setEnabled((value)=>({...value,[key]:e.target.checked}))}/>{label}</label>)}</div></div><div className="gbp-v25-performance-grid"><article className="gbp-v25-chart-card"><h4>Evolución del rendimiento · {mode==='absolute'?'valores':mode==='index'?'índice base 100':'variación porcentual'}</h4><MultiLineChart points={points} mode={mode} enabled={enabled}/><div className="gbp-v25-chart-legend"><span className="search">Search</span><span className="maps">Maps</span><span className="clicks">Clics web</span></div></article><article className="gbp-v25-searchterms"><div><small>SEARCH TERMS</small><h4>Búsquedas que activaron el perfil</h4></div>{searchTerms.map((item)=><div key={s(item.term)}><span>{s(item.term)}<small><button onClick={()=>onNavigate(`/utilidades/ubicaciones/${locationId}/posicionamiento`)}>Trackear</button><button onClick={()=>onNavigate(`/utilidades/ubicaciones/${locationId}/cuadricula`)}>Ver Grid</button></small></span><strong>{n(item.impressions).toLocaleString('es-CO')}</strong><em className={n(item.trend)>=0?'up':'down'}>{n(item.trend)>=0?'+':''}{s(item.trend)}%</em></div>)}</article></div></div>;
}

function MultiLineChart({ points, mode, enabled }: { points: Row[]; mode:'absolute'|'index'|'delta'; enabled:Record<string,boolean> }) {
  if (!points.length) return <div className="gbp-v25-nochart">Sin serie disponible.</div>;
  const width=900,height=230,pad=22;
  const keys=['searchImpressions','mapsImpressions','websiteClicks'].filter((key)=>enabled[key]);
  if (!keys.length) return <div className="gbp-v25-nochart">Activa al menos una serie.</div>;
  const transformed=points.map((point,index)=>{ const output:Row={...point}; keys.forEach((key)=>{ const current=n(point[key]); if(mode==='absolute') output[key]=current; else if(mode==='index'){ const base=n(points[0]?.[key],1)||1; output[key]=(current/base)*100; } else { const previous=index? n(points[index-1]?.[key]):current; output[key]=index&&previous?((current-previous)/previous)*100:0; } }); return output; });
  const values=transformed.flatMap((point)=>keys.map((key)=>n(point[key])));
  const max=Math.max(...values,1); const min=Math.min(...values,mode==='delta'?-10:0); const span=Math.max(1,max-min);
  const pointXY=(key:string,index:number)=>{ const x=pad+(index*Math.max(1,width-pad*2))/Math.max(1,transformed.length-1); const y=height-pad-((n(transformed[index]?.[key])-min)/span)*(height-pad*2); return {x,y}; };
  const line=(key:string)=>transformed.map((_,index)=>{const {x,y}=pointXY(key,index);return `${x},${y}`;}).join(' ');
  const cls:Record<string,string>={searchImpressions:'search',mapsImpressions:'maps',websiteClicks:'clicks'};
  return <div className="gbp-v25-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución del rendimiento GBP"><g className="grid"><line x1={pad} y1={50} x2={width-pad} y2={50}/><line x1={pad} y1={115} x2={width-pad} y2={115}/><line x1={pad} y1={180} x2={width-pad} y2={180}/></g>{keys.map((key)=><polyline key={key} className={`line ${cls[key]}`} points={line(key)}/>)}{keys.flatMap((key)=>transformed.map((point,index)=>{const {x,y}=pointXY(key,index);return <circle key={`${key}-${s(point.date)}-${index}`} className={`dot ${cls[key]}`} cx={x} cy={y} r="3"><title>{`${s(point.date)} · ${key} ${Number(n(point[key]).toFixed(1))}`}</title></circle>}))}</svg><div className="gbp-v25-chart-dates"><span>{dateLabel(points[0]?.date)}</span><span>{dateLabel(points.at(-1)?.date)}</span></div></div>;
}

function CompetitionAudit({ data, keyword, integrations, locationId, onNavigate }: { data: Row; keyword:string; integrations:Row; locationId:number; onNavigate:(path:string)=>void }) {
  const keywordSets = rows(data.keywordBenchmarks);
  const [keywordIndex, setKeywordIndex] = useState(0);
  const selected = keywordSets[keywordIndex] ?? {};
  const competitors = rows(selected.rows).length ? rows(selected.rows) : rows(data.rows);
  const benchmark = Object.keys(rec(selected.benchmark)).length ? rec(selected.benchmark) : rec(data.benchmark);
  const competitiveIndex = selected.index ?? data.index;
  const solvDeltaPp = selected.solvDeltaPp ?? data.solvDeltaPp;
  const own = competitors.find((item)=>Boolean(item.own)) ?? competitors[0] ?? {};
  const activeKeyword = s(selected.keyword, keyword);
  return <div className="gbp-v25-content">
    <div className="gbp-v25-section-title"><div><small>BENCHMARK COMPETITIVO POR KEYWORD</small><h3>{activeKeyword}</h3><p>Tu negocio se fija arriba para lectura; su Rank es promedio cuando procede de Rank Tracker. Debajo se muestran 10 competidores del conjunto Top 10.</p></div><div className="gbp-v25-competition-actions"><button onClick={()=>onNavigate(`/utilidades/ubicaciones/${locationId}/posicionamiento`)}><TrendingUp size={14}/>Rank Tracker</button><button onClick={()=>onNavigate(`/utilidades/ubicaciones/${locationId}/cuadricula`)}><MapPin size={14}/>Search Grid</button></div></div>
    {keywordSets.length > 1 ? <div className="gbp-v25-keyword-tabs">{keywordSets.map((item,index)=><button key={s(item.keyword)} className={keywordIndex===index?'active':''} onClick={()=>setKeywordIndex(index)}>{s(item.keyword)}</button>)}</div> : null}
    <div className="gbp-v25-competition-index"><div><small>ÍNDICE COMPETITIVO</small><strong>{s(competitiveIndex)}/100</strong><span>Score compuesto; no equivale a cuota de mercado.</span></div><div><small>SHARE OF LOCAL VOICE</small><strong>{pct(own.shareOfLocalVoice)}</strong><span className={n(solvDeltaPp)>=0?'up':'down'}>{n(solvDeltaPp)>=0?'+':''}{s(solvDeltaPp)} pp vs Top 5</span></div></div>
    <div className="gbp-v25-benchmark-cards"><Benchmark label="Share of Local Voice" own={n(own.shareOfLocalVoice)} avg={n(benchmark.shareOfLocalVoice)} suffix="%" deltaUnit="pp"/><Benchmark label="Reseñas" own={n(own.reviews)} avg={n(benchmark.reviews)}/><Benchmark label="Citaciones" own={n(own.citations)} avg={n(benchmark.citations)}/><Benchmark label="Backlinks" own={n(own.backlinks)} avg={n(benchmark.backlinks)}/><Benchmark label="Dominios" own={n(own.linkingDomains)} avg={n(benchmark.linkingDomains)}/><Benchmark label="Autoridad" own={n(own.authority)} avg={n(benchmark.authority)}/></div>
    <div className="gbp-v25-competition-table"><div className="head"><span>Negocio</span><span>Rank</span><span>Verif.</span><span>Categoría</span><span>Rating</span><span>Reseñas</span><span>Fotos</span><span>Citaciones</span><span>Backlinks</span><span>Dominios</span><span>Autoridad</span><span>SoLV</span><span>Distancia</span></div>{competitors.map((item)=><div className={`row ${item.own?'own':''}`} key={`${s(item.id)}-${activeKeyword}`}><b>{s(item.name)}{item.own?<small>TU NEGOCIO</small>:null}</b><span>{item.own?`${s(item.rank)} medio`:`#${s(item.rank)}`}</span><span>{item.verified?'✓':'—'}</span><span>{s(item.category)}</span><span>{s(item.rating)} ★</span><span>{s(item.reviews)}</span><span>{s(item.photos)}</span><span>{s(item.citations)}</span><span>{s(item.backlinks)}</span><span>{s(item.linkingDomains)}</span><span>{s(item.authority)}</span><span>{pct(item.shareOfLocalVoice)}</span><span>{s(item.distanceKm)} km</span></div>)}</div>
    <div className="gbp-v25-ranking-signals"><b>Señales comparadas</b>{rows(data.rankingSignals).map((item)=><span key={s(item)}>{s(item)}</span>)}</div>
    <div className="gbp-v25-integrations"><span className={integrations.rankTracker?'on':''}>Rank Tracker {integrations.rankTracker?'✓':'—'}</span><span className={integrations.searchGrid?'on':''}>Search Grid {integrations.searchGrid?'✓':'—'}</span><span className={integrations.citationTracker?'on':''}>Citation Tracker {integrations.citationTracker?'✓':'—'}</span><p>V25.1.1 combina señales del expediente y mantiene el origen de cada métrica. Los valores canónicos del negocio son idénticos en Reseñas, Fotos, Competencia y Cambios.</p></div>
  </div>;
}

function Benchmark({ label, own, avg, suffix='', deltaUnit }: { label:string; own:number; avg:number; suffix?:string; deltaUnit?:string }) { const d=own-avg; return <article><span>{label}</span><div><strong>{Math.round(own)}{suffix}</strong><em>vs Top 5 {Math.round(avg)}{suffix}</em></div><b className={d>=0?'up':'down'}>{d>=0?'+':''}{Math.round(d)}{deltaUnit?` ${deltaUnit}`:suffix}</b></article>; }

function ChangeAudit({ data, onAction, onNavigate }: { data:Row; onAction:Props['onAction']; onNavigate:(path:string)=>void }) { const items=rows(data.changes); const critical=n(data.critical); return <div className="gbp-v25-content"><div className="gbp-v25-section-title"><div><small>CHANGE MONITOR</small><h3>Vigilancia del perfil</h3><p>{s(data.monitoredFields)} campos monitorizados · {critical} {critical===1?'cambio crítico':'cambios críticos'}.</p></div></div><div className="gbp-v25-change-list">{items.map((item)=><article key={s(item.id)} className={`change-${s(item.severity)}`}><div className="icon">{s(item.severity)==='positive'?<TrendingUp/>:<AlertTriangle/>}</div><div><small>{dateLabel(item.detectedAt)}</small><h4>{s(item.field)}</h4><p><span>{s(item.from)}</span><ArrowRight size={14}/><strong>{s(item.to)}</strong></p></div><em>{s(item.severity)==='positive'?'Mejora':s(item.severity)==='info'?'Informativo':severityLabel(item.severity)}</em><div className="actions"><button onClick={()=>onNavigate(s(item.actionRoute,'#'))}>Revisar</button>{!['positive','info'].includes(s(item.severity))?<button className="primary" onClick={()=>onAction(`Revisar cambio GBP: ${s(item.field)}`, `Cambio detectado: ${s(item.from)} → ${s(item.to)}.`)}>Crear acción</button>:null}</div></article>)}</div><div className="gbp-v25-tip"><ShieldCheck size={17}/><div><b>El cambio no se asume como error</b><span>V25.1.1 separa “cambió” de “está mal”. Reseñas y fotos usan el mismo snapshot canónico que el resto de la auditoría.</span></div></div></div>; }

function Metric({ icon, label, value, helper }: { icon:ReactNode; label:string; value:string; helper:string }) { return <article className="gbp-v25-metric"><i>{icon}</i><span>{label}</span><strong>{value}</strong><small>{helper}</small></article>; }

function MethodModal({ methodology, onClose }: { methodology:Row; onClose:()=>void }) { const weights=rows(methodology.weights); const total=Math.round(weights.reduce((sum,item)=>sum+n(item.score)*n(item.weight)/100,0)); return <div className="gbp-v25-modal-bg" onMouseDown={(e)=>{if(e.currentTarget===e.target)onClose();}}><div className="gbp-v25-modal"><header><div><small>METODOLOGÍA EXPLICABLE</small><h3>Cómo se calcula GBP Health</h3></div><button onClick={onClose}><X size={18}/></button></header><p>{s(methodology.description)}</p><div className="gbp-v25-weight-head"><span>Dimensión</span><span>Score</span><span>Peso</span><span>Aporte</span></div><div className="gbp-v25-weight-list">{weights.map((item)=><div key={s(item.key)}><span>{s(item.label)}</span><i><b style={{width:`${n(item.score)}%`}}/></i><strong>{s(item.score)}/100</strong><em>{s(item.weight)}%</em><u>{(n(item.score)*n(item.weight)/100).toFixed(1)} pts</u></div>)}</div><div className="gbp-v25-formula-total"><span>Suma ponderada</span><strong>{total}/100</strong></div><div className="gbp-v25-tip"><Info size={17}/><div><b>GBP ≠ señales web</b><span>{s(methodology.note)}</span></div></div><footer><button className="primary" onClick={onClose}>Entendido</button></footer></div></div>; }

function ScheduleModal({ frequency, weekday, setFrequency, setWeekday, onSave, onClose }: { frequency:string; weekday:string; setFrequency:(v:string)=>void; setWeekday:(v:string)=>void; onSave:()=>void; onClose:()=>void }) { return <div className="gbp-v25-modal-bg" onMouseDown={(e)=>{if(e.currentTarget===e.target)onClose();}}><div className="gbp-v25-modal small"><header><div><small>PROGRAMACIÓN</small><h3>Auditoría recurrente</h3></div><button onClick={onClose}><X size={18}/></button></header><label>Frecuencia<select value={frequency} onChange={(e)=>setFrequency(e.target.value)}><option value="manual">Manual</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></label>{frequency==='weekly'?<label>Día<select value={weekday} onChange={(e)=>setWeekday(e.target.value)}><option value="monday">Lunes</option><option value="tuesday">Martes</option><option value="wednesday">Miércoles</option><option value="thursday">Jueves</option><option value="friday">Viernes</option></select></label>:null}<p>La programación utiliza el mismo motor V25.1.1 y conserva las ejecuciones para comparación temporal.</p><footer><button onClick={onClose}>Cancelar</button><button className="primary" onClick={onSave}>Guardar programación</button></footer></div></div>; }
