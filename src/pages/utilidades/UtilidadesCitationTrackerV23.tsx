/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  Import,
  ListChecks,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  Target,
  UsersRound,
  X,
} from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { ErrorBox, Loading, SuccessBox, text } from './UtilidadesCommon';
import './utilidades-citation-v23.css';

type Nap = { name?: string; address?: string; phone?: string; postcode?: string; website?: string };
type Citation = Row & {
  id?: string;
  directoryName?: string;
  directoryUrl?: string;
  listingUrl?: string;
  authority?: number;
  relevance?: number;
  priority?: number;
  pricing?: string;
  category?: string;
  bucket?: string;
  status?: string;
  isKey?: boolean;
  supportsBuilder?: boolean;
  foundNap?: Nap;
  napMatches?: Record<string, boolean>;
  napAccuracy?: number;
  lastCheckedAt?: string;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  notes?: string;
  competitorPresence?: boolean[];
  competitorCount?: number;
  opportunity?: boolean;
};
type Duplicate = Row & {
  id?: string;
  directoryName?: string;
  primaryListing?: string;
  duplicateListing?: string;
  matchScore?: number;
  risk?: string;
  resolution?: string;
  notes?: string;
};
type Competitor = Row & { id?: string; name?: string; liveCitations?: number; keyCoverage?: number; share?: number };
type TrackerState = Row & {
  masterNap?: Nap;
  metrics?: Row;
  citations?: Citation[];
  duplicates?: Duplicate[];
  competitors?: Competitor[];
  history?: Row[];
  insights?: Row[];
  methodology?: Row;
  schedule?: Row;
  latestRun?: Row;
  runs?: Row[];
};

type Tab = 'summary' | 'key' | 'live' | 'pending' | 'missing' | 'duplicates' | 'competitors';
type MethodologyKind = 'health' | 'priority';
const TABS: Array<[Tab, string]> = [
  ['summary', 'Resumen'],
  ['key', 'Citaciones clave'],
  ['live', 'Citaciones activas'],
  ['pending', 'Pendientes'],
  ['missing', 'Faltantes'],
  ['duplicates', 'Duplicados'],
  ['competitors', 'Competidores'],
];
const WEEKDAYS = [
  ['monday', 'Lunes'],
  ['tuesday', 'Martes'],
  ['wednesday', 'Miércoles'],
  ['thursday', 'Jueves'],
  ['friday', 'Viernes'],
  ['saturday', 'Sábado'],
  ['sunday', 'Domingo'],
] as const;

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function pct(value: unknown) {
  return `${Math.round(num(value))}%`;
}
function signed(value: number) {
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : `${value}`;
}
function dateText(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function statusLabel(value: unknown) {
  const map: Record<string, string> = { live: 'Activa', submitted: 'Enviada', pending: 'Pendiente', missing: 'Faltante', archived: 'Archivada' };
  return map[String(value)] || String(value || '—');
}
function resolutionLabel(value: unknown) {
  const map: Record<string, string> = {
    open: 'Sin resolver',
    primary: 'Principal confirmado',
    duplicate: 'Duplicado confirmado',
    dismissed: 'Descartado',
  };
  return map[String(value)] || String(value || '—');
}
function riskLabel(value: unknown) {
  const map: Record<string, string> = { high: 'alto', medium: 'medio', low: 'bajo' };
  return map[String(value)] || String(value || '—');
}
function categoryLabel(value: unknown) {
  const map: Record<string, string> = {
    Healthcare: 'Salud',
    General: 'General',
    Local: 'Local',
    Maps: 'Mapas',
    Social: 'Social',
    Business: 'Negocios',
    Industry: 'Industria',
  };
  return map[String(value)] || String(value || 'General');
}
function severityLabel(value: unknown) {
  const map: Record<string, string> = { high: 'ALTA', medium: 'MEDIA', low: 'BAJA' };
  return map[String(value).toLowerCase()] || String(value || '—').toUpperCase();
}
function localizedUiText(value: unknown) {
  let result = text(value);
  // CITATION_TRACKER_V23_4_GRAMMAR_FINAL
  result = result
    .replace(/\b1 Key Citations activas contienen\b/gi, '1 citación clave activa contiene')
    .replace(/\b(\d+) Key Citations activas contienen\b/gi, '$1 citaciones clave activas contienen')
    .replace(/\b3 o mas competidores\b/gi, '3 o más competidores')
    .replace(/\bLa cobertura Key Citation es\b/gi, 'La cobertura de citaciones clave es')
    .replace(/\by el NAP Accuracy es\b/gi, 'y la Precisión NAP es')
    .replace(/\bhasta que pasen a Live\b/gi, 'hasta que queden activas');
  const replacements: Array<[RegExp, string]> = [
    [/Key Citations/gi, 'Citaciones clave'],
    [/Key Citation/gi, 'Citación clave'],
    [/Live Citations/gi, 'Citaciones activas'],
    [/Live Coverage/gi, 'Cobertura activa'],
    [/Citation Health/gi, 'Salud de citaciones'],
    [/Citation Priority/gi, 'Prioridad de citaciones'],
    [/Key Coverage/gi, 'Cobertura clave'],
    [/NAP Accuracy/gi, 'Precisión NAP'],
    [/Name, Address y Phone/gi, 'Nombre, Dirección y Teléfono'],
    [/Name, Address and Phone/gi, 'Nombre, Dirección y Teléfono'],
    [/Name, Address, Phone/gi, 'Nombre, Dirección y Teléfono'],
    [/\bAuthority\b/gi, 'Autoridad'],
    [/\bPriority\b/gi, 'Prioridad'],
    [/\bPending\b/gi, 'Pendientes'],
    [/\bLive\b/gi, 'Activa'],
  ];
  for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
  return result;
}
function napTone(matches: Record<string, boolean> | undefined, key: string) {
  return matches?.[key] ? 'ok' : 'bad';
}
function priorityTone(value: number) {
  return value >= 80 ? 'high' : value >= 60 ? 'medium' : 'low';
}
function download(name: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function csvEscape(value: unknown) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function GrowthChart({ data, range, setRange }: { data: Row[]; range: 30 | 90 | 180; setRange: (range: 30 | 90 | 180) => void }) {
  const visible = data.slice(-range);
  const [hovered, setHovered] = useState<number | null>(null);
  if (!visible.length) return <div className="cit-v23-empty">Sin histórico todavía.</div>;

  const width = 760;
  const height = 170;
  const maxValue = Math.max(1, ...visible.flatMap((row) => [num(row.live), num(row.consistent), num(row.pending)]));
  const point = (row: Row, index: number, key: string) => {
    const x = visible.length === 1 ? width / 2 : (index / (visible.length - 1)) * width;
    const y = height - 15 - (num(row[key]) / maxValue) * (height - 30);
    return { x, y };
  };
  const line = (key: string) => visible.map((row, index) => {
    const current = point(row, index, key);
    return `${current.x.toFixed(1)},${current.y.toFixed(1)}`;
  }).join(' ');
  const first = visible[0] ?? {};
  const last = visible[visible.length - 1] ?? {};
  const deltaLive = num(last.live) - num(first.live);
  const deltaConsistent = num(last.consistent) - num(first.consistent);
  const deltaPending = num(last.pending) - num(first.pending);
  const activeIndex = hovered ?? visible.length - 1;
  const active = visible[activeIndex] ?? last;
  const activeX = point(active, activeIndex, 'live').x;

  function onMove(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
    setHovered(Math.round(relative * (visible.length - 1)));
  }

  return <div className="cit-v23-growth">
    <div className="cit-v23-section-head">
      <div><small>EVOLUCIÓN DE CITACIONES</small><h3>Crecimiento, consistencia y pendientes</h3></div>
      <div className="cit-v23-range">{([30, 90, 180] as const).map((days) => <button key={days} className={range === days ? 'active' : ''} onClick={() => setRange(days)}>{days}d</button>)}</div>
    </div>
    <div className="cit-v231-deltas">
      <span className={deltaLive >= 0 ? 'good' : 'bad'}>{signed(deltaLive)} activas</span>
      <span className={deltaConsistent >= 0 ? 'good' : 'bad'}>{signed(deltaConsistent)} consistentes</span>
      <span className={deltaPending <= 0 ? 'good' : 'bad'}>{signed(deltaPending)} pendientes</span>
    </div>
    <div className="cit-v23-chart-legend"><span><i className="live" />Activas</span><span><i className="consistent" />Consistentes</span><span><i className="pending" />Pendientes</span></div>
    <div className="cit-v231-chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="cit-v23-chart" onMouseMove={onMove} onMouseLeave={() => setHovered(null)}>
        {[40, 80, 120].map((y) => <line key={y} x1="0" x2={width} y1={y} y2={y} />)}
        <polyline className="live" points={line('live')} />
        <polyline className="consistent" points={line('consistent')} />
        <polyline className="pending" points={line('pending')} />
        {hovered !== null ? <line className="cit-v231-hover-line" x1={activeX} x2={activeX} y1="8" y2={height - 8} /> : null}
      </svg>
      {hovered !== null ? <div className="cit-v231-chart-tooltip" style={{ left: `${Math.min(88, Math.max(12, (activeX / width) * 100))}%` }}>
        <b>{text(active.date)}</b><span>Activas <strong>{text(active.live)}</strong></span><span>Consistentes <strong>{text(active.consistent)}</strong></span><span>Pendientes <strong>{text(active.pending)}</strong></span>
      </div> : null}
    </div>
    <div className="cit-v23-chart-axis"><span>{String(visible[0]?.date ?? '')}</span><span>{String(visible[Math.floor(visible.length / 2)]?.date ?? '')}</span><span>{String(visible[visible.length - 1]?.date ?? '')}</span></div>
  </div>;
}

export default function UtilidadesCitationTrackerV23({ locationId, locationName, onAction }: { locationId: number; locationName: string; onAction: (title: string, description: string) => void }) {
  const navigate = useNavigate();
  const importRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<TrackerState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('summary');
  const [selected, setSelected] = useState<Citation | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [range, setRange] = useState<30 | 90 | 180>(30);
  const [search, setSearch] = useState('');
  const [napFilter, setNapFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [napDraft, setNapDraft] = useState<Nap>({});
  const [scheduleDraft, setScheduleDraft] = useState({ frequency: 'manual', weekday: 'monday' });
  const [citationDraft, setCitationDraft] = useState({ directoryName: '', directoryUrl: '', listingUrl: '', bucket: 'pending', authority: '60', pricing: 'free', category: 'General', supportsBuilder: true });
  const [note, setNote] = useState('');

  async function load() {
    setLoading(true);
    try {
      setData(await utilidadesV15Api.citationTracker(locationId) as TrackerState);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar Citation Tracker V23.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, [locationId]);

  const metrics = (data.metrics ?? {}) as Row;
  const master = (data.masterNap ?? {}) as Nap;
  const citations = (Array.isArray(data.citations) ? data.citations : []) as Citation[];
  const duplicates = (Array.isArray(data.duplicates) ? data.duplicates : []) as Duplicate[];
  const competitors = (Array.isArray(data.competitors) ? data.competitors : []) as Competitor[];
  const history = (Array.isArray(data.history) ? data.history : []) as Row[];
  const insights = (Array.isArray(data.insights) ? data.insights : []) as Row[];
  const runs = (Array.isArray(data.runs) ? data.runs : []) as Row[];
  const methodology = (data.methodology ?? {}) as Row;

  const filtered = useMemo(() => citations.filter((row) => {
    if (search && !String(row.directoryName || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && String(row.status) !== statusFilter) return false;
    if (napFilter === 'consistent' && num(row.napAccuracy) !== 100) return false;
    if (napFilter === 'inconsistent' && num(row.napAccuracy) === 100) return false;
    if (priorityFilter === 'high' && num(row.priority) < 80) return false;
    if (priorityFilter === 'medium' && (num(row.priority) < 60 || num(row.priority) >= 80)) return false;
    if (priorityFilter === 'low' && num(row.priority) >= 60) return false;
    if (tab === 'key' && !row.isKey) return false;
    if (tab === 'live' && row.status !== 'live') return false;
    if (tab === 'pending' && !['pending', 'submitted'].includes(String(row.status))) return false;
    if (tab === 'missing' && row.status !== 'missing') return false;
    return true;
  }), [citations, search, statusFilter, napFilter, priorityFilter, tab]);
  const competitorGaps = useMemo(() => citations.filter((row) => row.opportunity).sort((a, b) => num(b.priority) - num(a.priority)), [citations]);

  async function run() {
    setLoading(true);
    try {
      setData(await utilidadesV15Api.citationTrackerRun(locationId) as TrackerState);
      setSuccess('Citaciones actualizadas y nueva ejecución guardada en PostgreSQL.');
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar Citation Tracker.');
    } finally { setLoading(false); }
  }
  function openNap() { setNapDraft({ ...master }); setModal('nap'); }
  async function saveNap(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try {
      setData(await utilidadesV15Api.citationTrackerMasterNap(locationId, napDraft as Row) as TrackerState);
      setModal(null); setSuccess('NAP maestro actualizado y auditoría recalculada.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el NAP maestro.'); }
    finally { setLoading(false); }
  }
  async function addCitation(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try {
      setData(await utilidadesV15Api.citationTrackerAdd(locationId, { ...citationDraft, authority: Number(citationDraft.authority) } as Row) as TrackerState);
      setModal(null);
      setCitationDraft({ directoryName: '', directoryUrl: '', listingUrl: '', bucket: 'pending', authority: '60', pricing: 'free', category: 'General', supportsBuilder: true });
      setSuccess('Directorio añadido y persistido.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo añadir la cita.'); }
    finally { setLoading(false); }
  }
  async function refreshCitation(row: Citation) {
    if (!row.id) return; setLoading(true);
    try { setData(await utilidadesV15Api.citationTrackerRefresh(locationId, row.id) as TrackerState); setSelected(null); setSuccess(`${row.directoryName} revalidado.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo revalidar la cita.'); }
    finally { setLoading(false); }
  }
  async function sendBuilder(row: Citation) {
    if (!row.id) return; setLoading(true);
    try { const result = await utilidadesV15Api.citationTrackerBuilder(locationId, row.id); setSuccess(`${row.directoryName} enviado a Citation Builder (campaña #${text(result.campaignId)}).`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo enviar al Citation Builder.'); }
    finally { setLoading(false); }
  }
  async function archiveCitation(row: Citation) {
    if (!row.id) return; setLoading(true);
    try { setData(await utilidadesV15Api.citationTrackerUpdate(locationId, row.id, { status: 'archived' }) as TrackerState); setSelected(null); setSuccess('Cita archivada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo archivar.'); }
    finally { setLoading(false); }
  }
  async function saveNote() {
    if (!selected?.id) return; setLoading(true);
    try { setData(await utilidadesV15Api.citationTrackerUpdate(locationId, selected.id, { notes: note }) as TrackerState); setSelected(null); setSuccess('Nota guardada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la nota.'); }
    finally { setLoading(false); }
  }
  async function schedule(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try { setData(await utilidadesV15Api.citationTrackerSchedule(locationId, scheduleDraft) as TrackerState); setModal(null); setSuccess('Programación del Citation Tracker actualizada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la programación.'); }
    finally { setLoading(false); }
  }
  async function resolveDuplicate(row: Duplicate, resolution: 'open' | 'primary' | 'duplicate' | 'dismissed') {
    if (!row.id) return; setLoading(true);
    try { setData(await utilidadesV15Api.citationTrackerResolveDuplicate(locationId, row.id, { resolution }) as TrackerState); setSuccess(`Duplicado de ${row.directoryName} actualizado.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo resolver el duplicado.'); }
    finally { setLoading(false); }
  }
  async function createCase(title: string, description: string) {
    setLoading(true);
    try { await utilidadesV15Api.createCase({ locationId, title, description, priority: 'high' }); setSuccess('Caso creado y vinculado a la ubicación.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear el caso.'); }
    finally { setLoading(false); }
  }
  async function createOrder(title: string, description: string) {
    setLoading(true);
    try { await utilidadesV15Api.createWorkOrder({ locationId, title, description, scope: 'Corrección y verificación de citaciones/NAP.', deliverables: ['Corrección de ficha', 'Evidencia de publicación', 'Verificación NAP'], priority: 'high', status: 'borrador' }); setSuccess('Orden de trabajo creada en borrador.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la orden.'); }
    finally { setLoading(false); }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const content = await file.text(); const lines = content.split(/\r?\n/).filter(Boolean); const body = lines[0]?.toLowerCase().includes('directorio') ? lines.slice(1) : lines;
    let added = 0; setLoading(true);
    try {
      for (const line of body.slice(0, 100)) {
        const [directoryName, directoryUrl = '', listingUrl = '', category = 'General'] = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
        if (!directoryName) continue;
        try { await utilidadesV15Api.citationTrackerAdd(locationId, { directoryName, directoryUrl, listingUrl, category, bucket: 'pending', authority: 55, pricing: 'free', supportsBuilder: true }); added += 1; }
        catch { /* duplicate rows are skipped */ }
      }
      await load(); setSuccess(`${added} directorios importados desde CSV.`);
    } finally { setLoading(false); }
  }
  function exportCsv() {
    const headers = ['Directorio', 'Estado', 'Autoridad', 'Prioridad', 'Precisión NAP', 'Nombre', 'Dirección', 'Teléfono', 'Código postal', 'Competidores', 'Ficha'];
    const rows = citations.map((row) => [row.directoryName, statusLabel(row.status), row.authority, row.priority, row.napAccuracy, row.foundNap?.name, row.foundNap?.address, row.foundNap?.phone, row.foundNap?.postcode, row.competitorCount, row.listingUrl]);
    download(`citation-tracker-${locationId}.csv`, [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'));
  }
  function openCitation(row: Citation) { setSelected(row); setNote(String(row.notes || '')); }

  const keyCount = citations.filter((row) => row.isKey).length;
  const missingCount = citations.filter((row) => row.status === 'missing').length;

  return <div className="cit-v23-root cit-v231-final">
    <ErrorBox message={error} onRetry={load} /><SuccessBox message={success} />
    <section className="cit-v23-hero">
      <div><div className="cit-v23-badges"><span>LOCAL LAB V23.4</span><span className="ok">Persistencia activa</span></div><h2>Citation Tracker</h2><p>Inventario, NAP campo por campo, duplicados, competidores y oportunidades de citación para {locationName}.</p><small>Última ejecución {dateText(data.latestRun?.generatedAt)} · {citations.length} directorios monitorizados</small></div>
      <div className="cit-v23-hero-actions"><button onClick={() => { setScheduleDraft({ frequency: String(data.schedule?.frequency || 'manual'), weekday: String(data.schedule?.weekday || 'monday') }); setModal('schedule'); }}><CalendarClock size={16} />Programar</button><button onClick={() => navigate(`/utilidades/ubicaciones/${locationId}/constructor-citaciones`)}><Send size={16} />Citation Builder</button><button className="primary" onClick={() => void run()}><RefreshCw size={16} />Actualizar citas</button></div>
    </section>

    <div className="cit-v23-kpis">
      <Kpi icon={<ShieldAlert />} label="Salud de citaciones" value={pct(metrics.citationHealth)} hint="Salud ponderada" onInfo={() => setModal('method-health')} />
      <Kpi icon={<Target />} label="Cobertura clave" value={pct(metrics.keyCoverage)} hint="Sitios clave activos" />
      <Kpi icon={<ClipboardCheck />} label="Precisión NAP" value={pct(metrics.napAccuracy)} hint="Campos correctos" />
      <Kpi icon={<Globe2 />} label="Citaciones activas" value={text(metrics.liveCitations)} hint="Fichas detectadas" />
      <Kpi icon={<AlertTriangle />} label="Faltantes" value={text(metrics.missing)} hint="Ausencias detectadas" />
      <Kpi icon={<CalendarClock />} label="Pendientes" value={text(metrics.pending)} hint="En envío/verificación" />
      <Kpi icon={<Copy />} label="Duplicados" value={text(metrics.duplicates)} hint="Duplicados abiertos" />
      <Kpi icon={<UsersRound />} label="Brechas competitivas" value={text(metrics.competitorGaps)} hint="Oportunidades" />
    </div>

    <section className="cit-v23-master cit-v231-master">
      <div className="cit-v23-section-head"><div><small>NAP MAESTRO</small><h3>Referencia canónica para todas las citaciones</h3></div><button onClick={openNap}><Settings2 size={15} />Editar NAP</button></div>
      <div className="cit-v23-master-grid">
        <MasterItem className="name" icon={<Building2 />} label="Nombre" value={master.name} />
        <MasterItem className="address" icon={<MapPin />} label="Dirección" value={master.address} />
        <MasterItem className="phone" icon={<Phone />} label="Teléfono" value={master.phone} />
        <MasterItem className="postcode" icon={<MapPin />} label="Código postal" value={master.postcode} />
        <MasterItem className="website" icon={<Globe2 />} label="Sitio web" value={master.website} />
      </div>
    </section>

    <section className="cit-v23-workspace">
      <div className="cit-v23-tabs">{TABS.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}{key === 'key' ? <b>{keyCount}</b> : key === 'live' ? <b>{num(metrics.liveCitations)}</b> : key === 'pending' ? <b>{num(metrics.pending)}</b> : key === 'missing' ? <b>{missingCount}</b> : key === 'duplicates' ? <b>{num(metrics.duplicates)}</b> : key === 'competitors' ? <b>{competitors.length}</b> : null}</button>)}</div>
      {tab === 'summary' ? <Summary metrics={metrics} history={history} insights={insights} methodology={methodology} range={range} setRange={setRange} gaps={competitorGaps} onAction={onAction} onCase={createCase} onOrder={createOrder} onBuilder={sendBuilder} onMethodology={(kind) => setModal(`method-${kind}`)} /> : null}
      {['key', 'live', 'pending', 'missing'].includes(tab) ? <>
        <div className="cit-v23-table-toolbar"><div className="cit-v23-search"><Search size={15} /><input placeholder="Buscar directorio..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><select value={napFilter} onChange={(event) => setNapFilter(event.target.value)}><option value="all">Todo NAP</option><option value="consistent">Consistente</option><option value="inconsistent">Inconsistente</option></select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">Toda prioridad</option><option value="high">Alta 80+</option><option value="medium">Media 60–79</option><option value="low">Baja &lt;60</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option><option value="live">Activa</option><option value="submitted">Enviada</option><option value="pending">Pendiente</option><option value="missing">Faltante</option></select><div className="cit-v23-toolbar-actions"><input hidden ref={importRef} type="file" accept=".csv,text/csv" onChange={(event) => void importCsv(event)} /><button onClick={() => importRef.current?.click()}><Import size={15} />Importar CSV</button><button onClick={exportCsv}><Download size={15} />Exportar</button><button className="primary" onClick={() => setModal('add')}><Plus size={15} />Añadir cita</button></div></div>
        <CitationTable rows={filtered} master={master} onOpen={openCitation} onRefresh={refreshCitation} />
      </> : null}
      {tab === 'duplicates' ? <Duplicates rows={duplicates} onResolve={resolveDuplicate} /> : null}
      {tab === 'competitors' ? <Competitors rows={competitors} citations={citations} onBuilder={sendBuilder} onMethodology={() => setModal('method-priority')} /> : null}
    </section>

    <details className="cit-v23-sources"><summary>Fuentes y ejecuciones · {runs.length} registros recientes</summary><div className="cit-v23-runs">{runs.map((row) => <div key={String(row.id)}><b>#{text(row.id)}</b><span>{dateText(row.generatedAt)}</span><span>Salud {pct((row.metrics as Row | undefined)?.citationHealth)}</span><span>Activas {text((row.metrics as Row | undefined)?.liveCitations)}</span></div>)}</div><div className="cit-v23-method"><CircleHelp size={16} /><div><b>Metodología SEOLOCAL</b><p>{localizedUiText(methodology.citationHealth)}</p><p>{localizedUiText(methodology.priority)}</p><p>{localizedUiText(methodology.localLab)}</p></div></div></details>

    {selected ? <CitationDrawer row={selected} master={master} note={note} setNote={setNote} onClose={() => setSelected(null)} onRefresh={refreshCitation} onBuilder={sendBuilder} onArchive={archiveCitation} onSaveNote={saveNote} onAction={onAction} onCase={createCase} onOrder={createOrder} /> : null}
    {modal === 'nap' ? <Modal title="Editar NAP maestro" onClose={() => setModal(null)}><form className="cit-v23-form" onSubmit={(event) => void saveNap(event)}><Field label="Nombre" value={napDraft.name} onChange={(value) => setNapDraft({ ...napDraft, name: value })} /><Field label="Dirección" value={napDraft.address} onChange={(value) => setNapDraft({ ...napDraft, address: value })} /><Field label="Teléfono" value={napDraft.phone} onChange={(value) => setNapDraft({ ...napDraft, phone: value })} /><Field label="Código postal" value={napDraft.postcode} onChange={(value) => setNapDraft({ ...napDraft, postcode: value })} /><Field label="Sitio web" value={napDraft.website} onChange={(value) => setNapDraft({ ...napDraft, website: value })} /><div className="cit-v23-form-actions"><button type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary">Guardar y recalcular</button></div></form></Modal> : null}
    {modal === 'add' ? <Modal title="Añadir cita / directorio" onClose={() => setModal(null)}><form className="cit-v23-form" onSubmit={(event) => void addCitation(event)}><Field label="Directorio" value={citationDraft.directoryName} onChange={(value) => setCitationDraft({ ...citationDraft, directoryName: value })} /><Field label="URL directorio" value={citationDraft.directoryUrl} onChange={(value) => setCitationDraft({ ...citationDraft, directoryUrl: value })} /><Field label="URL de ficha" value={citationDraft.listingUrl} onChange={(value) => setCitationDraft({ ...citationDraft, listingUrl: value })} /><div className="cit-v23-form-row"><label>Tipo de cita<select value={citationDraft.bucket} onChange={(event) => setCitationDraft({ ...citationDraft, bucket: event.target.value })}><option value="key">Citación clave</option><option value="live">Activa</option><option value="pending">Pendiente</option></select></label><label>Autoridad<input type="number" min="0" max="100" value={citationDraft.authority} onChange={(event) => setCitationDraft({ ...citationDraft, authority: event.target.value })} /></label></div><div className="cit-v23-form-row"><label>Tipo<select value={citationDraft.pricing} onChange={(event) => setCitationDraft({ ...citationDraft, pricing: event.target.value })}><option value="free">Gratis</option><option value="paid">Pago</option></select></label><label>Categoría<input value={citationDraft.category} onChange={(event) => setCitationDraft({ ...citationDraft, category: event.target.value })} /></label></div><div className="cit-v23-form-actions"><button type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary">Añadir directorio</button></div></form></Modal> : null}
    {modal === 'schedule' ? <Modal title="Programar Citation Tracker" onClose={() => setModal(null)}><form className="cit-v23-form" onSubmit={(event) => void schedule(event)}><label>Frecuencia<select value={scheduleDraft.frequency} onChange={(event) => setScheduleDraft({ ...scheduleDraft, frequency: event.target.value })}><option value="manual">Manual</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></label>{scheduleDraft.frequency === 'weekly' ? <label>Día<select value={scheduleDraft.weekday} onChange={(event) => setScheduleDraft({ ...scheduleDraft, weekday: event.target.value })}>{WEEKDAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}<div className="cit-v23-form-actions"><button type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary">Guardar programación</button></div></form></Modal> : null}
    {modal === 'method-health' ? <MethodologyModal title="Cómo calculamos la Salud de citaciones" body={localizedUiText(methodology.citationHealth)} extra="La puntuación es propia de SEOLOCAL y se recalcula con cada ejecución. Un directorio de alta prioridad con NAP incorrecto pesa más que una cita secundaria." onClose={() => setModal(null)} /> : null}
    {modal === 'method-priority' ? <MethodologyModal title="Cómo calculamos la Prioridad de citaciones" body={localizedUiText(methodology.priority)} extra="La Prioridad es una métrica propia de SEOLOCAL. Combina autoridad, relevancia local/sectorial y presencia competitiva para ordenar el trabajo; no representa una métrica oficial de BrightLocal ni de un directorio externo." onClose={() => setModal(null)} /> : null}
    <Loading show={loading} />
  </div>;
}

function Kpi({ icon, label, value, hint, onInfo }: { icon: React.ReactNode; label: string; value: unknown; hint: string; onInfo?: () => void }) {
  return <div className="cit-v23-kpi"><div>{icon}<span>{label}</span>{onInfo ? <button className="cit-v231-info-button" title={`Metodología de ${label}`} onClick={onInfo}><CircleHelp size={13} /></button> : null}</div><strong>{text(value)}</strong><small>{hint}</small></div>;
}
function MasterItem({ icon, label, value, className = '' }: { icon: React.ReactNode; label: string; value: unknown; className?: string }) {
  return <div className={`cit-v23-master-item ${className}`}>{icon}<div><span>{label}</span><b title={text(value)}>{text(value)}</b></div><CheckCircle2 className="cit-v231-master-check" size={16} /></div>;
}
function Field({ label, value, onChange }: { label: string; value: unknown; onChange: (value: string) => void }) {
  return <label>{label}<input required value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="cit-v23-modal-bg" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><div className="cit-v23-modal"><div className="cit-v23-modal-head"><h3>{title}</h3><button onClick={onClose}><X size={18} /></button></div>{children}</div></div>;
}
function MethodologyModal({ title, body, extra, onClose }: { title: string; body: string; extra: string; onClose: () => void }) {
  return <Modal title={title} onClose={onClose}><div className="cit-v231-method-modal"><CircleHelp size={24} /><p>{body}</p><p>{extra}</p></div></Modal>;
}

function Summary({ metrics, history, insights, methodology, range, setRange, gaps, onAction, onCase, onOrder, onBuilder, onMethodology }: { metrics: Row; history: Row[]; insights: Row[]; methodology: Row; range: 30 | 90 | 180; setRange: (range: 30 | 90 | 180) => void; gaps: Citation[]; onAction: (title: string, description: string) => void; onCase: (title: string, description: string) => void; onOrder: (title: string, description: string) => void; onBuilder: (row: Citation) => void; onMethodology: (kind: MethodologyKind) => void }) {
  return <div className="cit-v23-summary">
    <div className="cit-v23-summary-grid"><GrowthChart data={history} range={range} setRange={setRange} /><div className="cit-v23-health-card"><div className="cit-v231-health-title"><small>SALUD DE CITACIONES</small><button onClick={() => onMethodology('health')} title="Cómo se calcula la Salud de citaciones"><CircleHelp size={15} /></button></div><strong>{pct(metrics.citationHealth)}</strong><div><span>Cobertura clave <b>{pct(metrics.keyCoverage)}</b></span><i><em style={{ width: pct(metrics.keyCoverage) }} /></i></div><div><span>Precisión NAP <b>{pct(metrics.napAccuracy)}</b></span><i><em style={{ width: pct(metrics.napAccuracy) }} /></i></div><div><span>Cobertura activa <b>{pct(num(metrics.liveCitations) / Math.max(1, num(metrics.total)) * 100)}</b></span><i><em style={{ width: pct(num(metrics.liveCitations) / Math.max(1, num(metrics.total)) * 100) }} /></i></div></div></div>
    <section className="cit-v23-insights"><div className="cit-v23-section-head"><div><small>INTELIGENCIA DE CITACIONES</small><h3>Qué corregir y dónde crecer</h3></div></div><div className="cit-v23-insight-grid">{insights.map((row) => <article key={String(row.id)} className={`tone-${String(row.severity)}`}><small>{severityLabel(row.severity)}</small><h4>{localizedUiText(row.title)}</h4><p>{localizedUiText(row.description)}</p><b>{localizedUiText(row.recommendation)}</b><div><button className="primary" onClick={() => onAction(localizedUiText(row.title), `${localizedUiText(row.description)} ${localizedUiText(row.recommendation)}`)}>Crear acción</button><details className="cit-v231-more-actions"><summary><MoreHorizontal size={14} />Más acciones</summary><div><button onClick={() => onCase(localizedUiText(row.title), localizedUiText(row.description))}>Crear caso</button><button onClick={() => onOrder(localizedUiText(row.title), localizedUiText(row.description))}>Crear orden</button></div></details></div></article>)}</div></section>
    <section className="cit-v23-opportunities"><div className="cit-v23-section-head"><div><small>TOP OPORTUNIDADES</small><h3>Directorios donde tus competidores ya están presentes</h3></div><button className="cit-v231-method-link" onClick={() => onMethodology('priority')}><CircleHelp size={14} />Metodología de prioridad</button></div><div className="cit-v23-gap-list">{gaps.slice(0, 6).map((row) => <div key={String(row.id)}><div><b>{row.directoryName}</b><div className="cit-v231-gap-chips"><span>{categoryLabel(row.category)}</span><span>{row.pricing === 'paid' ? 'Pago' : 'Gratis'}</span><span>{num(row.competitorCount)}/5 competidores</span><span>Autoridad {num(row.authority)}</span><span className={`priority ${priorityTone(num(row.priority))}`}>Prioridad {num(row.priority)}</span></div></div><button onClick={() => void onBuilder(row)}><Send size={14} />Enviar a Builder</button></div>)}</div></section>
    <span className="cit-v231-method-source" hidden>{localizedUiText(methodology.priority)}</span>
  </div>;
}

function CitationTable({ rows, master, onOpen, onRefresh }: { rows: Citation[]; master: Nap; onOpen: (row: Citation) => void; onRefresh: (row: Citation) => void }) {
  return <div className="cit-v23-table-wrap"><table className="cit-v23-table"><thead><tr><th>Directorio</th><th>Autoridad</th><th>Prioridad</th><th>Estado</th><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>CP</th><th>NAP</th><th title="Número de los 5 competidores analizados que aparecen en este directorio">Presencia comp.</th><th>Tipo</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}><td><button className="cit-v23-directory" onClick={() => onOpen(row)}><b>{row.directoryName}</b><small>{categoryLabel(row.category)}</small></button></td><td><strong>{num(row.authority)}</strong></td><td><span className={`cit-v23-priority ${priorityTone(num(row.priority))}`}>{num(row.priority)}</span></td><td><span className={`cit-v23-status ${String(row.status)}`}>{statusLabel(row.status)}</span></td><td><NapCell ok={napTone(row.napMatches, 'name') === 'ok'} value={row.foundNap?.name} expected={master.name} /></td><td><NapCell ok={napTone(row.napMatches, 'address') === 'ok'} value={row.foundNap?.address} expected={master.address} /></td><td><NapCell ok={napTone(row.napMatches, 'phone') === 'ok'} value={row.foundNap?.phone} expected={master.phone} /></td><td><NapCell ok={napTone(row.napMatches, 'postcode') === 'ok'} value={row.foundNap?.postcode} expected={master.postcode} /></td><td><b className={num(row.napAccuracy) === 100 ? 'cit-v23-good' : 'cit-v23-bad'}>{pct(row.napAccuracy)}</b></td><td><span className="cit-v23-comp-count" title={`${num(row.competitorCount)} de 5 competidores están presentes`}>{num(row.competitorCount)}/5</span></td><td><span className="cit-v23-price"><CircleDollarSign size={13} />{row.pricing === 'paid' ? 'Pago' : 'Gratis'}</span></td><td><div className="cit-v23-row-actions"><button title="Revalidar" onClick={() => void onRefresh(row)}><RefreshCw size={14} /></button><button title="Abrir inteligencia" onClick={() => onOpen(row)}><ChevronRight size={15} /></button></div></td></tr>)}</tbody></table>{!rows.length ? <div className="cit-v23-empty">No hay directorios para los filtros seleccionados.</div> : null}</div>;
}
function NapCell({ ok, value, expected }: { ok: boolean; value: unknown; expected: unknown }) {
  const found = text(value);
  const canonical = text(expected);
  const title = ok ? `Coincide con NAP maestro\nEncontrado: ${found}` : `Esperado: ${canonical}\nEncontrado: ${found}`;
  return <div className={`cit-v23-nap-cell ${ok ? 'ok' : 'bad'}`} title={title}><span>{ok ? <Check size={12} /> : <AlertTriangle size={12} />}</span><em>{found}</em></div>;
}

function Duplicates({ rows, onResolve }: { rows: Duplicate[]; onResolve: (row: Duplicate, resolution: 'open' | 'primary' | 'duplicate' | 'dismissed') => void }) {
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const open = rows.filter((row) => row.resolution === 'open');
  const resolved = rows.filter((row) => row.resolution !== 'open');
  const visible = filter === 'open' ? open : filter === 'resolved' ? resolved : rows;
  return <div className="cit-v23-duplicates"><div className="cit-v23-section-head"><div><small>CENTRO DE DUPLICADOS</small><h3>Revisar fichas potencialmente duplicadas</h3></div><div className="cit-v231-duplicate-tabs"><button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>Abiertos <b>{open.length}</b></button><button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>Resueltos <b>{resolved.length}</b></button><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todos <b>{rows.length}</b></button></div></div>{visible.map((row) => {
    const isOpen = row.resolution === 'open';
    return <article key={String(row.id)} className={isOpen ? 'open' : 'resolved'}><div className="cit-v23-dup-title"><div><b>{row.directoryName}</b><span>Coincidencia {num(row.matchScore)}% · Riesgo {riskLabel(row.risk)}</span></div><span className={`cit-v23-status ${row.resolution}`}>{resolutionLabel(row.resolution)}</span></div><div className="cit-v23-dup-urls"><div><small>Ficha principal</small><a href={row.primaryListing} target="_blank" rel="noreferrer">{row.primaryListing}<ExternalLink size={12} /></a></div><div><small>Posible duplicado</small><a href={row.duplicateListing} target="_blank" rel="noreferrer">{row.duplicateListing}<ExternalLink size={12} /></a></div></div><div className="cit-v23-dup-actions">{isOpen ? <><button onClick={() => void onResolve(row, 'primary')}>Marcar principal</button><button className="danger" onClick={() => void onResolve(row, 'duplicate')}>Confirmar duplicado</button><button onClick={() => void onResolve(row, 'dismissed')}>Descartar</button></> : <button onClick={() => void onResolve(row, 'open')}><RefreshCw size={13} />Reabrir</button>}</div></article>;
  })}{!visible.length ? <div className="cit-v23-empty">No hay duplicados en este estado.</div> : null}</div>;
}

function Competitors({ rows, citations, onBuilder, onMethodology }: { rows: Competitor[]; citations: Citation[]; onBuilder: (row: Citation) => void; onMethodology: () => void }) {
  const gaps = citations.filter((row) => row.opportunity).sort((a, b) => num(b.priority) - num(a.priority));
  return <div className="cit-v23-competitors"><div className="cit-v23-competitor-cards"><article className="own"><small>TU NEGOCIO</small><strong>{citations.filter((row) => row.status === 'live').length}</strong><span>Citaciones activas</span></article>{rows.map((row, index) => <article key={String(row.id)}><small>COMP. {index + 1}</small><b>{row.name}</b><strong>{num(row.liveCitations)}</strong><span>Activas · Clave {pct(row.keyCoverage)}</span></article>)}</div><div className="cit-v23-section-head"><div><small>MATRIZ COMPETITIVA</small><h3>Directorios donde ellos están y tú no</h3></div><div className="cit-v231-matrix-actions"><span>{gaps.length} oportunidades detectadas</span><button className="cit-v231-method-link" onClick={onMethodology}><CircleHelp size={14} />Prioridad</button></div></div><div className="cit-v23-matrix-wrap"><table className="cit-v23-matrix"><thead><tr><th>Directorio</th><th>Tu negocio</th>{rows.map((row) => <th key={String(row.id)}>{row.name}</th>)}<th>Autoridad</th><th>Prioridad</th><th></th></tr></thead><tbody>{gaps.map((row) => <tr key={String(row.id)}><td><b>{row.directoryName}</b><small>{categoryLabel(row.category)} · {row.pricing === 'paid' ? 'Pago' : 'Gratis'}</small></td><td><span className="no"><X size={13} />No</span></td>{rows.map((comp, index) => <td key={String(comp.id)}>{row.competitorPresence?.[index] ? <span className="yes"><Check size={13} />Sí</span> : <span className="no"><X size={13} />No</span>}</td>)}<td>{num(row.authority)}</td><td><span className={`cit-v23-priority ${priorityTone(num(row.priority))}`}>{num(row.priority)}</span></td><td><button onClick={() => void onBuilder(row)}><Send size={13} />Builder</button></td></tr>)}</tbody></table></div></div>;
}

function CitationDrawer({ row, master, note, setNote, onClose, onRefresh, onBuilder, onArchive, onSaveNote, onAction, onCase, onOrder }: { row: Citation; master: Nap; note: string; setNote: (value: string) => void; onClose: () => void; onRefresh: (row: Citation) => void; onBuilder: (row: Citation) => void; onArchive: (row: Citation) => void; onSaveNote: () => void; onAction: (title: string, description: string) => void; onCase: (title: string, description: string) => void; onOrder: (title: string, description: string) => void }) {
  const description = `${row.directoryName}: NAP ${num(row.napAccuracy)}%, Prioridad ${num(row.priority)}, estado ${statusLabel(row.status)}.`;
  return <div className="cit-v23-drawer-bg" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><aside className="cit-v23-drawer"><div className="cit-v23-drawer-head"><div><small>INTELIGENCIA DE CITACIÓN</small><h3>{row.directoryName}</h3><span>Autoridad {num(row.authority)} · Prioridad {num(row.priority)} · {row.pricing === 'paid' ? 'Pago' : 'Gratis'}</span></div><button onClick={onClose}><X size={19} /></button></div><div className="cit-v23-drawer-kpis"><div><span>Precisión NAP</span><strong>{pct(row.napAccuracy)}</strong></div><div><span>Competidores</span><strong>{num(row.competitorCount)}/5</strong></div><div><span>Estado</span><strong>{statusLabel(row.status)}</strong></div></div><section><h4>NAP esperado vs encontrado</h4>{(['name', 'address', 'phone', 'postcode'] as const).map((key) => <div className={`cit-v23-compare ${row.napMatches?.[key] ? 'ok' : 'bad'}`} key={key}><span>{key === 'name' ? 'Nombre' : key === 'address' ? 'Dirección' : key === 'phone' ? 'Teléfono' : 'Código postal'}</span><div><small>Esperado</small><b>{text(master[key])}</b></div><div><small>Encontrado</small><b>{text(row.foundNap?.[key])}</b></div><i>{row.napMatches?.[key] ? <CheckCircle2 /> : <AlertTriangle />}</i></div>)}</section><section className="cit-v23-meta"><h4>Ficha del directorio</h4><div><span>Última comprobación</span><b>{dateText(row.lastCheckedAt)}</b></div><div><span>URL de ficha</span><a href={row.listingUrl} target="_blank" rel="noreferrer">Abrir ficha <ExternalLink size={12} /></a></div><div><span>Sitio web canónico</span><a href={master.website} target="_blank" rel="noreferrer">{text(master.website)} <ExternalLink size={12} /></a></div><div><span>Builder</span><b>{row.supportsBuilder ? 'Disponible' : 'Manual'}</b></div><div><span>Categoría</span><b>{categoryLabel(row.category)}</b></div></section><section><h4>Notas</h4><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Añade contexto, evidencia o seguimiento..." /><button onClick={onSaveNote}>Guardar nota</button></section><div className="cit-v23-drawer-actions"><button className="primary" onClick={() => void onRefresh(row)}><RefreshCw size={14} />Revalidar NAP</button><button onClick={() => void onBuilder(row)}><Send size={14} />Citation Builder</button><button onClick={() => onAction(`Corregir cita · ${row.directoryName}`, description)}><ListChecks size={14} />Crear acción</button><details><summary><MoreHorizontal size={16} />Más</summary><div><button onClick={() => void onCase(`Caso de citación · ${row.directoryName}`, description)}>Crear caso</button><button onClick={() => void onOrder(`Orden citación · ${row.directoryName}`, description)}>Crear orden</button><button className="danger" onClick={() => void onArchive(row)}><Archive size={14} />Archivar cita</button></div></details></div></aside></div>;
}
