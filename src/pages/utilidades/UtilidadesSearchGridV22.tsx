/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CalendarClock, Crosshair, Download, GitCompareArrows, Info,
  Layers3, MapPinned, MousePointer2, Plus, RefreshCw, Settings2, Target,
  TrendingDown, TrendingUp, UsersRound, X,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Loading, Modal, Status, SuccessBox, formatDate, text } from './UtilidadesCommon';

type GridCell = Row & {
  pointKey?: string; row?: number; col?: number; lat?: number; lng?: number; distanceKm?: number;
  bearing?: string; rank?: number | null; previousRank?: number | null; delta?: number; active?: boolean;
  opportunityScore?: number; competitorCount?: number; topCompetitor?: string; competitorRanks?: Row;
};
type GridState = Row & {
  location?: Row; config?: Row; schedule?: Row; metrics?: Row; cells?: GridCell[]; history?: Row[];
  competitors?: Row[]; allCompetitors?: Row[]; availableKeywords?: string[]; runs?: Row[]; latestRun?: Row | null;
  insights?: Row[]; methodology?: Row;
};
type ViewMode = 'current' | 'previous' | 'delta';
type CompareMode = 'none' | 'time' | 'competitor';
const GRID_SIZES = [3, 5, 7, 9, 11, 15] as const;
const WEEKDAYS = [
  ['monday', 'Lunes'], ['tuesday', 'Martes'], ['wednesday', 'Miércoles'], ['thursday', 'Jueves'],
  ['friday', 'Viernes'], ['saturday', 'Sábado'], ['sunday', 'Domingo'],
] as const;

function num(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function rank(cell: GridCell, mode: ViewMode, competitor: string) {
  if (!cell.active) return null;
  if (competitor !== 'business') return num((cell.competitorRanks ?? {})[competitor], 99);
  if (mode === 'previous') return cell.previousRank == null ? null : num(cell.previousRank, 99);
  return cell.rank == null ? null : num(cell.rank, 99);
}
function tone(value: number | null) { if (value == null || value > 20) return 'nf'; if (value <= 3) return 'top3'; if (value <= 10) return 'top10'; return 'top20'; }
function markerColor(t: string) { return t === 'top3' ? '#2e9d5b' : t === 'top10' ? '#e4a400' : t === 'top20' ? '#d95336' : '#8b95a1'; }
function changeLabel(delta: number) { return delta > 0 ? `+${delta}` : `${delta}`; }
function markerRadius(size: number, custom = false) { if (custom) return size >= 15 ? 8 : 11; if (size >= 15) return 8; if (size >= 11) return 11; if (size >= 9) return 13; if (size >= 7) return 17; return 20; }

function MapSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const c = map.getCenter();
    if (Math.abs(c.lat - center[0]) > .00001 || Math.abs(c.lng - center[1]) > .00001 || map.getZoom() !== zoom) map.setView(center, zoom, { animate: false });
  }, [center[0], center[1], zoom]);
  return null;
}
function MapAutoFit({ cells, center, fitKey }: { cells: GridCell[]; center: [number, number]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = cells
      .filter((cell) => {
        const custom = String(cell.pointKey).startsWith('custom-');
        return (!custom || cell.active !== false) && Number.isFinite(Number(cell.lat)) && Number.isFinite(Number(cell.lng));
      })
      .map((cell) => [num(cell.lat), num(cell.lng)] as [number, number]);
    points.push(center);
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: false });
      return;
    }
    const lats = points.map(([lat]) => lat);
    const lngs = points.map(([, lng]) => lng);
    const southWest: [number, number] = [Math.min(...lats), Math.min(...lngs)];
    const northEast: [number, number] = [Math.max(...lats), Math.max(...lngs)];
    map.fitBounds([southWest, northEast], {
      animate: false,
      paddingTopLeft: [54, 54],
      paddingBottomRight: [54, 54],
      maxZoom: 15,
    });
  }, [fitKey]);
  return null;
}
function ViewportReporter({ onChange }: { onChange: (center: [number, number], zoom: number) => void }) {
  const map = useMapEvents({ moveend() { const c = map.getCenter(); onChange([c.lat, c.lng], map.getZoom()); } });
  return null;
}
function MapClickHandler({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(event) { if (active) onPick(event.latlng.lat, event.latlng.lng); } });
  return null;
}

function MiniHistory({ rows, range }: { rows: Row[]; range: 30 | 90 | 180 }) {
  const visible = rows.slice(-range);
  if (!visible.length) return <Empty text="Todavía no existe historial del Grid." />;
  const width = 700, height = 150;
  const values = visible.map((row) => num(row.averageMapRank));
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(1, max - min);
  const points = visible.map((row, i) => {
    const x = visible.length === 1 ? width / 2 : i / (visible.length - 1) * width;
    const y = 12 + (num(row.averageMapRank) - min) / span * (height - 24);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return <div className="grid-v22-history"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><line x1="0" y1="40" x2={width} y2="40"/><line x1="0" y1="80" x2={width} y2="80"/><line x1="0" y1="120" x2={width} y2="120"/><polyline points={points}/></svg><div><span>{String(visible[0]?.date ?? '')}</span><b>Average Map Rank · menor es mejor</b><span>{String(visible[visible.length - 1]?.date ?? '')}</span></div></div>;
}


function GridMapView({
  cells, gridSize, effectiveCenter, zoom, center, mode, target, title, interactive = true, mapMode, fitKey,
  onViewport, onPick, onPoint,
}: {
  cells: GridCell[]; gridSize: number; effectiveCenter: [number, number]; zoom: number; center: [number, number];
  mode: ViewMode; target: string; title?: string; interactive?: boolean; mapMode: 'none'|'recenter'|'add'|'move'; fitKey: string;
  onViewport: (center: [number, number], zoom: number) => void; onPick: (lat: number, lng: number) => void; onPoint: (cell: GridCell) => void;
}) {
  return <div className="grid-v221-map-card">{title?<div className="grid-v221-map-title"><b>{title}</b><span>{target==='business'?'Tu negocio':target}</span></div>:null}<div className={`grid-v22-map ${mapMode!=='none'&&interactive?'is-recenter':''}`}>
    <MapContainer center={effectiveCenter} zoom={zoom} scrollWheelZoom className="grid-v22-leaflet">
      <MapSync center={effectiveCenter} zoom={zoom}/><MapAutoFit cells={cells} center={center} fitKey={fitKey}/>{interactive?<ViewportReporter onChange={onViewport}/>:null}<MapClickHandler active={interactive&&mapMode!=='none'} onPick={onPick}/>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <CircleMarker center={center} radius={Math.max(10, markerRadius(gridSize) + 5)} pathOptions={{ color:'#1f2937', fillColor:'#ffffff', fillOpacity:0, weight:3, opacity:.88, dashArray:'2 2' }}><Tooltip direction="top" offset={[0,-10]} className="grid-v22-business-label">Sede</Tooltip></CircleMarker>
      {cells.map((cell)=>{const r=rank(cell,mode,target);const delta=num(cell.delta);const display=mode==='delta'?(delta>0?`+${delta}`:String(delta)):r==null?'NF':String(r);const c=mode==='delta'?(delta>0?'#2e9d5b':delta<0?'#d95336':'#8b95a1'):markerColor(tone(r));const custom=String(cell.pointKey).startsWith('custom-');return <CircleMarker key={`${mode}-${target}-${String(cell.pointKey)}`} center={[num(cell.lat),num(cell.lng)]} radius={cell.active?markerRadius(gridSize,custom):Math.max(7,markerRadius(gridSize,custom)-3)} pathOptions={{color:custom?'#5423a7':cell.active?'white':'#9ca3af',weight:custom?4:2.5,fillColor:cell.active?c:'#d4d8dd',fillOpacity:.95}} eventHandlers={interactive?{click:()=>onPoint(cell)}:undefined}><Tooltip permanent direction="center" className="grid-v22-rank-label">{cell.active?display:'×'}</Tooltip></CircleMarker>;})}
    </MapContainer>
    {interactive&&mapMode!=='none'?<div className="grid-v22-map-hint"><MousePointer2 size={14}/>{mapMode==='recenter'?'Haz clic para definir el nuevo centro del grid':mapMode==='add'?'Haz clic para añadir un punto personalizado':'Haz clic para mover el punto personalizado'}</div>:null}
  </div></div>;
}

export default function UtilidadesSearchGridV22({
  locationId, locationName, onAction,
}: { locationId: number; locationName: string; onAction: (title: string, description: string) => void }) {
  const navigate = useNavigate();
  const [data, setData] = useState<GridState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('current');
  const [competitor, setCompetitor] = useState('business');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [compareCompetitor, setCompareCompetitor] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<Row | null>(null);
  const [pointLoading, setPointLoading] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<30 | 90 | 180>(30);
  const [mapMode, setMapMode] = useState<'none'|'recenter'|'add'|'move'>('none');
  const [movePointKey, setMovePointKey] = useState<string>('');
  const [viewportCenter, setViewportCenter] = useState<[number, number] | null>(null);
  const [viewportZoom, setViewportZoom] = useState<number | null>(null);
  const [configDraft, setConfigDraft] = useState({ gridSize: 7, spacingKm: 0.8, centerLat: 0, centerLng: 0, keyword: '' });
  const [scheduleDraft, setScheduleDraft] = useState({ frequency: 'manual', weekday: 'monday' });

  async function load() {
    setLoading(true);
    try { setData(await utilidadesV15Api.searchGrid(locationId) as GridState); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar Local Search Grid V22.1.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [locationId]);

  const config = (data.config ?? {}) as Row;
  const metrics = (data.metrics ?? {}) as Row;
  const cells = (Array.isArray(data.cells) ? data.cells : []) as GridCell[];
  const history = (Array.isArray(data.history) ? data.history : []) as Row[];
  const competitors = (Array.isArray(data.competitors) ? data.competitors : []) as Row[];
  const allCompetitors = (Array.isArray(data.allCompetitors) ? data.allCompetitors : competitors) as Row[];
  const insights = (Array.isArray(data.insights) ? data.insights : []) as Row[];
  const methodology = (data.methodology ?? {}) as Row;
  const runs = (Array.isArray(data.runs) ? data.runs : []) as Row[];
  const keywords = (Array.isArray(data.availableKeywords) ? data.availableKeywords : []) as string[];
  const centerRow = (config.center ?? {}) as Row;
  const center: [number, number] = [num(centerRow.lat, 4.711), num(centerRow.lng, -74.0721)];
  const gridSize = num(config.gridSize, 7);
  const zoom = viewportZoom ?? (gridSize >= 15 ? 11 : gridSize >= 11 ? 12 : gridSize >= 7 ? 13 : 14);
  const effectiveCenter = viewportCenter ?? center;
  const customPointCount = cells.filter((cell) => String(cell.pointKey).startsWith('custom-')).length;
  const boundsSignature = useMemo(() => cells
    .filter((cell) => !String(cell.pointKey).startsWith('custom-') || cell.active !== false)
    .map((cell) => `${String(cell.pointKey)}:${num(cell.lat).toFixed(6)}:${num(cell.lng).toFixed(6)}`)
    .sort()
    .join('|'), [cells]);
  const mapFitBaseKey = `${locationId}|${gridSize}|${String(config.keyword || '')}|${String((data.latestRun as Row | undefined)?.id || '')}|${boundsSignature}`;

  useEffect(() => { if (!compareCompetitor && competitors[0]?.name) setCompareCompetitor(String(competitors[0].name)); }, [competitors.length]);
  useEffect(() => { setViewportCenter(center); setViewportZoom(null); }, [center[0], center[1], gridSize]);

  const visibleMetrics = useMemo(() => {
    if (competitor === 'business' && view === 'current') return metrics;
    const active = cells.filter((cell) => cell.active);
    const ranks = active.map((cell) => rank(cell, view, competitor)).filter((v): v is number => typeof v === 'number' && v <= 30);
    const pct = (n: number) => active.length ? Math.round(n / active.length * 100) : 0;
    return {
      averageMapRank: ranks.length ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length * 10) / 10 : 0,
      top3Coverage: pct(ranks.filter((r) => r <= 3).length), top10Coverage: pct(ranks.filter((r) => r <= 10).length), top20Coverage: pct(ranks.filter((r) => r <= 20).length),
      notFound: pct(active.length - ranks.filter((r) => r <= 20).length), shareOfLocalVoice: ranks.length ? Math.round(ranks.reduce((s, r) => s + Math.max(0, 21 - r) / 20, 0) / ranks.length * 100) : 0,
      improved: active.filter((cell) => num(cell.delta) > 0).length, worsened: active.filter((cell) => num(cell.delta) < 0).length, activePoints: active.length, centerRank: null,
    } as Row;
  }, [cells, metrics, competitor, view]);

  async function runGrid() {
    setLoading(true);
    try { setData(await utilidadesV15Api.searchGridRun(locationId) as GridState); setSuccess('Cuadrícula actualizada y nueva ejecución guardada en PostgreSQL.'); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la cuadrícula.'); }
    finally { setLoading(false); }
  }
  function openConfig() {
    setConfigDraft({ gridSize, spacingKm: num(config.spacingKm, .8), centerLat: center[0], centerLng: center[1], keyword: String(config.keyword || keywords[0] || '') });
    setModal('config');
  }
  async function saveConfig(event?: FormEvent) {
    event?.preventDefault(); setLoading(true);
    try { setData(await utilidadesV15Api.searchGridConfig(locationId, configDraft) as GridState); setModal(null); setMapMode('none'); setSuccess('Configuración geográfica actualizada y Grid regenerado.'); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.'); }
    finally { setLoading(false); }
  }
  async function setPoint(cell: GridCell, active: boolean) {
    setLoading(true);
    try { setData(await utilidadesV15Api.searchGridPoint(locationId, String(cell.pointKey), active) as GridState); setSuccess(active ? 'Punto reactivado.' : 'Punto desactivado y excluido de métricas.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el punto.'); }
    finally { setLoading(false); }
  }
  async function openPoint(cell: GridCell) {
    setPointLoading(true); setSelectedPoint({ point: cell });
    try { setSelectedPoint(await utilidadesV15Api.searchGridPointDetail(locationId, String(cell.pointKey))); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir la inteligencia del punto.'); setSelectedPoint(null); }
    finally { setPointLoading(false); }
  }
  async function saveSchedule(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try { setData(await utilidadesV15Api.searchGridSchedule(locationId, scheduleDraft) as GridState); setModal(null); setSuccess('Programación del Local Search Grid actualizada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la programación.'); }
    finally { setLoading(false); }
  }
  async function handleMapPick(lat: number, lng: number) {
    setLoading(true);
    try {
      if (mapMode === 'recenter') {
        setConfigDraft({gridSize,spacingKm:num(config.spacingKm,.8),centerLat:lat,centerLng:lng,keyword:String(config.keyword||'')}); setModal('config');
      } else if (mapMode === 'add') {
        setData(await utilidadesV15Api.searchGridCustomPoint(locationId,{lat,lng}) as GridState); setSuccess('Punto personalizado añadido al Grid.');
      } else if (mapMode === 'move' && movePointKey) {
        setData(await utilidadesV15Api.searchGridCustomPoint(locationId,{pointKey:movePointKey,lat,lng}) as GridState); setSuccess('Punto personalizado movido y Grid recalculado.');
      }
      setMapMode('none'); setMovePointKey(''); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la geometría del Grid.'); }
    finally { setLoading(false); }
  }
  async function deleteCustomPoint(pointKey: string) {
    setLoading(true);
    try { setData(await utilidadesV15Api.searchGridDeleteCustomPoint(locationId,pointKey) as GridState); setSelectedPoint(null); setSuccess('Punto personalizado eliminado.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el punto.'); }
    finally { setLoading(false); }
  }
  async function createCaseFromInsight(insight: Row) {
    setLoading(true); try { await utilidadesV15Api.createCase({ locationId, title:text(insight.title,'Inteligencia territorial'), description:text(insight.detail), priority: insight.severity === 'high' ? 'high' : 'medium' }); setSuccess('Caso creado desde Inteligencia territorial.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear el caso.'); } finally { setLoading(false); }
  }
  async function createWorkOrderFromInsight(insight: Row) {
    setLoading(true); try { await utilidadesV15Api.createWorkOrder({ locationId, title:`Geo Grid · ${text(insight.title)}`, description:text(insight.detail), scope:text(insight.action), deliverables:['Optimización de microzonas','Evidencia antes/después','Validación en Local Search Grid'], priority: insight.severity === 'high' ? 'high' : 'medium', status:'borrador' }); setSuccess('Orden de trabajo creada en borrador.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la orden.'); } finally { setLoading(false); }
  }
  function exportCsv() {
    const header = ['point','lat','lng','rank','previous','delta','active','distance_km','top_competitor'];
    const rows = cells.map((cell) => [cell.pointKey, cell.lat, cell.lng, rank(cell, view, competitor) ?? 'NF', cell.previousRank ?? 'NF', cell.delta ?? 0, cell.active ? 'yes' : 'no', cell.distanceKm, cell.topCompetitor]);
    const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `local-search-grid-${locationId}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function exportPng() {
    const size = 850, pad = 70, canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#f7f8fa'; ctx.fillRect(0,0,size,size); ctx.fillStyle='#20252b'; ctx.font='bold 28px Arial'; ctx.fillText('SEOLOCAL · Local Search Grid V22.1', 30, 40); ctx.font='16px Arial'; ctx.fillText(String(config.keyword || ''),30,65);
    const baseCells=cells.filter((cell)=>num(cell.row)>0); const n=gridSize, step=(size-pad*2)/Math.max(1,n-1); baseCells.forEach((cell)=>{const x=pad+(num(cell.col)-1)*step,y=pad+(num(cell.row)-1)*step;const r=rank(cell,view,competitor);ctx.beginPath();ctx.arc(x,y,Math.max(9,24-gridSize),0,Math.PI*2);ctx.fillStyle=cell.active?markerColor(tone(r)):'#d4d8dd';ctx.fill();ctx.fillStyle='white';ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cell.active?(r==null?'NF':String(r)):'×',x,y);});
    const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`local-search-grid-${locationId}.png`;a.click();
  }
  function printPdf() { window.print(); }

  return <div className="grid-v22 grid-v221">
    <ErrorBox message={error} onRetry={load} /><SuccessBox message={success} />
    <section className="grid-v22-hero">
      <div><div className="grid-v22-badges"><span>LOCAL LAB V22.1</span><b>Persistencia activa</b></div><h2>Local Search Grid</h2><p>Visibilidad geográfica de {locationName}: ranking por coordenada, comparación temporal, competencia, custom points e inteligencia territorial.</p><small>Última ejecución {formatDate((data.latestRun as Row | undefined)?.generatedAt)} · {gridSize}×{gridSize} · {num(config.spacingKm,.8)} km · {customPointCount} puntos personalizados</small></div>
      <div className="grid-v22-hero-actions"><button className="util-btn" onClick={() => navigate(`/utilidades/ubicaciones/${locationId}/posicionamiento`)}><TrendingUp size={15}/>Rank Tracker</button><button className="util-btn" onClick={() => { setScheduleDraft({ frequency: String((data.schedule as Row | undefined)?.frequency || 'manual'), weekday: String((data.schedule as Row | undefined)?.weekday || 'monday') }); setModal('schedule'); }}><CalendarClock size={15}/>Programar</button><button className="util-btn" onClick={openConfig}><Settings2 size={15}/>Configurar Grid</button><button className="util-btn primary" onClick={() => void runGrid()}><RefreshCw size={15}/>Actualizar Grid</button></div>
    </section>

    <div className="grid-v22-kpis">
      <K label="Average Map Rank" value={`#${num(visibleMetrics.averageMapRank).toFixed(1)}`} hint="Promedio geográfico" icon={<Target/>}/>
      <K label="Posición en sede" value={num(metrics.centerRank,99)>30?'NF':`#${num(metrics.centerRank)}`} hint="Ranking en la coordenada del negocio" icon={<Crosshair/>}/>
      <K label="Top 3" value={`${num(visibleMetrics.top3Coverage)}%`} hint="Cobertura" icon={<TrendingUp/>}/>
      <K label="Top 10" value={`${num(visibleMetrics.top10Coverage)}%`} hint="Cobertura" icon={<Activity/>}/>
      <K label="Top 20" value={`${num(visibleMetrics.top20Coverage)}%`} hint="Cobertura" icon={<Layers3/>}/>
      <K label="Mejorados" value={num(visibleMetrics.improved)} hint="Vs. ejecución anterior" icon={<TrendingUp/>}/>
      <K label="Empeorados" value={num(visibleMetrics.worsened)} hint="Requieren atención" icon={<TrendingDown/>}/>
      <K label="Share of Local Voice" value={`${num(visibleMetrics.shareOfLocalVoice)}%`} hint="Dominio del área" icon={<UsersRound/>}/>
    </div>

    <section className="grid-v22-map-panel">
      <div className="grid-v22-map-toolbar">
        <div className="grid-v22-field"><label>Keyword</label><select value={String(config.keyword || '')} onChange={(e) => { void utilidadesV15Api.searchGridConfig(locationId,{keyword:e.target.value}).then((v)=>setData(v as GridState)).catch((cause)=>setError(cause instanceof Error?cause.message:'Error')); }}>{keywords.map((kw)=><option key={kw}>{kw}</option>)}</select></div>
        <div className="grid-v22-field"><label>Visualizar</label><select value={competitor} onChange={(e)=>setCompetitor(e.target.value)}><option value="business">Tu negocio</option>{competitors.map((row)=><option key={String(row.name)} value={String(row.name)}>{String(row.name)}</option>)}</select></div>
        <div className="grid-v22-segment">{(['current','previous','delta'] as const).map((mode)=><button key={mode} className={view===mode&&compareMode==='none'?'active':''} onClick={()=>{setView(mode);setCompareMode('none');}}>{mode==='current'?'Ahora':mode==='previous'?'Anterior':'Cambios'}</button>)}</div>
        <div className="grid-v221-compare"><button className={`util-btn ${compareMode==='time'?'active':''}`} onClick={()=>setCompareMode(compareMode==='time'?'none':'time')}><GitCompareArrows size={14}/>Antes / Ahora</button><button className={`util-btn ${compareMode==='competitor'?'active':''}`} onClick={()=>setCompareMode(compareMode==='competitor'?'none':'competitor')}><UsersRound size={14}/>Vs. competidor</button></div>
        <button className={`util-btn ${mapMode==='recenter'?'active':''}`} onClick={()=>setMapMode(mapMode==='recenter'?'none':'recenter')}><MousePointer2 size={15}/>Recentrar grid</button>
        <button className={`util-btn ${mapMode==='add'?'active':''}`} onClick={()=>setMapMode(mapMode==='add'?'none':'add')}><MapPinned size={15}/>Añadir punto</button>
        <div className="grid-v22-export"><button className="util-btn" onClick={exportCsv}><Download size={15}/>CSV</button><button className="util-btn" onClick={exportPng}>PNG</button><button className="util-btn" onClick={printPdf}>PDF</button></div>
      </div>
      {mapMode!=='none'?<div className="grid-v221-mode-status"><span><MousePointer2 size={14}/><b>{mapMode==='recenter'?'Modo Recentrar grid':mapMode==='add'?'Modo Añadir punto':'Modo Mover punto'}</b><em>{mapMode==='recenter'?'El próximo clic define el nuevo centro geográfico del muestreo.':mapMode==='add'?'El próximo clic añade un punto personalizado al análisis.':'El próximo clic mueve el punto personalizado seleccionado.'}</em></span><button type="button" onClick={()=>{setMapMode('none');setMovePointKey('');}}>Cancelar</button></div>:null}
      {compareMode==='time'?<div className="grid-v221-dual"><GridMapView cells={cells} gridSize={gridSize} effectiveCenter={effectiveCenter} zoom={zoom} center={center} mapMode={mapMode} fitKey={`${mapFitBaseKey}|previous|business|time|before`} onViewport={(c,z)=>{setViewportCenter(c);setViewportZoom(z);}} onPick={(lat,lng)=>void handleMapPick(lat,lng)} onPoint={(cell)=>void openPoint(cell)} mode="previous" target="business" title="ANTES · ejecución anterior"/><GridMapView cells={cells} gridSize={gridSize} effectiveCenter={effectiveCenter} zoom={zoom} center={center} mapMode={mapMode} fitKey={`${mapFitBaseKey}|current|business|${compareMode}|after`} onViewport={(c,z)=>{setViewportCenter(c);setViewportZoom(z);}} onPick={(lat,lng)=>void handleMapPick(lat,lng)} onPoint={(cell)=>void openPoint(cell)} mode="current" target="business" title="AHORA · ejecución actual" interactive={false}/></div>:compareMode==='competitor'?<div className="grid-v221-compare-shell"><div className="grid-v221-compare-select"><label>Competidor para comparar</label><select value={compareCompetitor} onChange={(e)=>setCompareCompetitor(e.target.value)}>{competitors.map((row)=><option key={String(row.name)} value={String(row.name)}>{String(row.name)}</option>)}</select></div><div className="grid-v221-dual"><GridMapView cells={cells} gridSize={gridSize} effectiveCenter={effectiveCenter} zoom={zoom} center={center} mapMode={mapMode} fitKey={`${mapFitBaseKey}|current|business|${compareMode}|own`} onViewport={(c,z)=>{setViewportCenter(c);setViewportZoom(z);}} onPick={(lat,lng)=>void handleMapPick(lat,lng)} onPoint={(cell)=>void openPoint(cell)} mode="current" target="business" title="TU NEGOCIO"/><GridMapView cells={cells} gridSize={gridSize} effectiveCenter={effectiveCenter} zoom={zoom} center={center} mapMode={mapMode} fitKey={`${mapFitBaseKey}|current|${compareCompetitor}|${compareMode}|competitor`} onViewport={(c,z)=>{setViewportCenter(c);setViewportZoom(z);}} onPick={(lat,lng)=>void handleMapPick(lat,lng)} onPoint={(cell)=>void openPoint(cell)} mode="current" target={compareCompetitor} title="COMPETIDOR" interactive={false}/></div></div>:<div className="grid-v22-map-layout"><GridMapView cells={cells} gridSize={gridSize} effectiveCenter={effectiveCenter} zoom={zoom} center={center} mapMode={mapMode} fitKey={`${mapFitBaseKey}|${view}|${competitor}|${compareMode}|single`} onViewport={(c,z)=>{setViewportCenter(c);setViewportZoom(z);}} onPick={(lat,lng)=>void handleMapPick(lat,lng)} onPoint={(cell)=>void openPoint(cell)} mode={view} target={competitor}/><aside className="grid-v22-insight"><span className="util-eyebrow">Lectura geográfica</span><h3>Tu cobertura local</h3><div className="grid-v22-big-rank">#{num(visibleMetrics.averageMapRank).toFixed(1)}<small>Average Map Rank <button className="grid-v221-info" title={text(methodology.averageMapRank)} onClick={()=>setModal('methodology')}><Info size={12}/></button></small></div><div className="grid-v22-bars"><Coverage label="Top 3" value={num(visibleMetrics.top3Coverage)} className="green"/><Coverage label="Top 10" value={num(visibleMetrics.top10Coverage)} className="amber"/><Coverage label="Top 20" value={num(visibleMetrics.top20Coverage)} className="red"/><Coverage label="NF" value={num(visibleMetrics.notFound)} className="gray"/></div><div className="grid-v22-legend"><span><i className="top3"/>1–3</span><span><i className="top10"/>4–10</span><span><i className="top20"/>11–20</span><span><i className="nf"/>20+ / NF</span></div><p>{num(visibleMetrics.activePoints)} puntos activos. Haz clic en cualquier círculo para abrir competidores, distancia, SERP y acciones de esa coordenada.</p><button className="grid-v221-method" onClick={()=>setModal('methodology')}><Info size={13}/>Metodología AMR / Share of Voice</button></aside></div>}
    </section>

    <section className="grid-v22-section"><div className="grid-v22-section-head"><div><span className="util-eyebrow">Evolución territorial</span><h3>Average Map Rank · {historyRange} días</h3></div><div className="grid-v22-segment">{([30,90,180] as const).map((d)=><button key={d} className={historyRange===d?'active':''} onClick={()=>setHistoryRange(d)}>{d}d</button>)}</div></div><MiniHistory rows={history} range={historyRange}/></section>

    <section className="grid-v22-section grid-v221-intelligence"><div className="grid-v22-section-head"><div><span className="util-eyebrow">Inteligencia territorial</span><h3>Qué está ocurriendo y qué hacer después</h3></div></div><div className="grid-v221-insights">{insights.map((insight,index)=><article key={`${text(insight.title)}-${index}`} className={`severity-${text(insight.severity,'medium')}`}><span>{text(insight.severity,'medium')}</span><h4>{text(insight.title)}</h4><p>{text(insight.detail)}</p><small>{text(insight.action)}</small><div className="grid-v221-insight-actions"><button className="is-primary" onClick={()=>onAction(text(insight.title),`${text(insight.detail)} ${text(insight.action)}`)}>Crear acción</button><details className="grid-v221-more-actions"><summary>Más acciones</summary><div><button onClick={()=>void createCaseFromInsight(insight)}>Crear caso</button><button onClick={()=>void createWorkOrderFromInsight(insight)}>Crear orden</button></div></details></div></article>)}</div></section>

    <section className="grid-v22-section"><div className="grid-v22-section-head"><div><span className="util-eyebrow">Competencia geográfica</span><h3>Share of Local Voice y cobertura</h3></div><button className="util-btn" onClick={()=>setModal('competitors')}>Ver Top 20 competidores</button></div><div className="grid-v22-competitors"><article className="is-own"><span>TU NEGOCIO</span><strong>{num(metrics.shareOfLocalVoice)}%</strong><small>AMR #{num(metrics.averageMapRank).toFixed(1)} · Top 3 {num(metrics.top3Coverage)}%</small><button onClick={()=>{setCompetitor('business');setCompareMode('none');}}>Ver Grid</button></article>{competitors.map((row,index)=><article key={String(row.name)}><span>COMP. {index+1}</span><h4>{text(row.name)}</h4><strong>{num(row.shareOfLocalVoice)}%</strong><small>AMR #{num(row.averageMapRank).toFixed(1)} · ★ {num(row.rating).toFixed(1)} · {num(row.reviews)} reseñas</small><button onClick={()=>{setCompetitor(String(row.name));setCompareCompetitor(String(row.name));setCompareMode('competitor');}}>Comparar Grid</button></article>)}</div><div className="grid-v22-competitor-table"><table className="util-table"><thead><tr><th>Negocio</th><th>Average Map Rank</th><th>Share of Local Voice</th><th>Top 3</th><th>Top 10</th><th>Rating</th><th>Reseñas</th><th>Distancia</th></tr></thead><tbody><tr className="is-own"><td><b>{locationName}</b></td><td>#{num(metrics.averageMapRank).toFixed(1)}</td><td>{num(metrics.shareOfLocalVoice)}%</td><td>{num(metrics.top3Coverage)}%</td><td>{num(metrics.top10Coverage)}%</td><td>4.7</td><td>324</td><td>0 km</td></tr>{competitors.map((row)=><tr key={`table-${String(row.name)}`}><td>{text(row.name)}</td><td>#{num(row.averageMapRank).toFixed(1)}</td><td>{num(row.shareOfLocalVoice)}%</td><td>{num(row.top3Coverage)}%</td><td>{num(row.top10Coverage)}%</td><td>{num(row.rating).toFixed(1)}</td><td>{num(row.reviews)}</td><td>{num(row.distanceKm).toFixed(1)} km</td></tr>)}</tbody></table></div></section>

    <details className="grid-v22-runs"><summary>Fuentes y ejecuciones · {runs.length} registros recientes</summary><div className="grid-v22-run-list">{runs.map((row)=><div key={Number(row.id)}><span>{formatDate(row.generatedAt)}</span><b>{text(row.keyword)}</b><span>{text(row.gridSize)}×{text(row.gridSize)}</span><Status value={row.status}/></div>)}</div></details>

    {selectedPoint ? <PointDrawer data={selectedPoint} loading={pointLoading} onClose={()=>setSelectedPoint(null)} onToggle={(cell,active)=>void setPoint(cell,active)} onAction={onAction} onMove={(key)=>{setMovePointKey(key);setMapMode('move');setSelectedPoint(null);}} onDelete={(key)=>void deleteCustomPoint(key)}/>:null}
    {modal==='config'?<Modal title="Configurar Local Search Grid" subtitle="Tamaño, separación, centro y keyword quedan persistidos por ubicación." onClose={()=>setModal(null)} footer={<><button className="util-btn" onClick={()=>setModal(null)}>Cancelar</button><button className="util-btn primary" form="grid-config-form">Guardar y regenerar</button></>}><form id="grid-config-form" onSubmit={saveConfig} className="util-formgrid"><div className="util-field"><label>Tamaño</label><select value={configDraft.gridSize} onChange={(e)=>setConfigDraft({...configDraft,gridSize:Number(e.target.value)})}>{GRID_SIZES.map((n)=><option key={n} value={n}>{n}×{n}{n===15?' · 225 puntos':''}</option>)}</select></div><div className="util-field"><label>Separación (km)</label><input type="number" step="0.1" min="0.1" max="20" value={configDraft.spacingKm} onChange={(e)=>setConfigDraft({...configDraft,spacingKm:Number(e.target.value)})}/></div><div className="util-field"><label>Latitud centro</label><input type="number" step="0.000001" value={configDraft.centerLat} onChange={(e)=>setConfigDraft({...configDraft,centerLat:Number(e.target.value)})}/></div><div className="util-field"><label>Longitud centro</label><input type="number" step="0.000001" value={configDraft.centerLng} onChange={(e)=>setConfigDraft({...configDraft,centerLng:Number(e.target.value)})}/></div><div className="util-field util-wide"><label>Keyword</label><select value={configDraft.keyword} onChange={(e)=>setConfigDraft({...configDraft,keyword:e.target.value})}>{keywords.map((kw)=><option key={kw}>{kw}</option>)}</select></div></form></Modal>:null}
    {modal==='schedule'?<Modal title="Programar Local Search Grid" subtitle="Ejecuta mediciones territoriales automáticamente mientras NestJS esté activo." onClose={()=>setModal(null)} footer={<><button className="util-btn" onClick={()=>setModal(null)}>Cancelar</button><button className="util-btn primary" form="grid-schedule-form">Guardar programación</button></>}><form id="grid-schedule-form" onSubmit={saveSchedule} className="util-formgrid"><div className="util-field"><label>Frecuencia</label><select value={scheduleDraft.frequency} onChange={(e)=>setScheduleDraft({...scheduleDraft,frequency:e.target.value})}><option value="manual">Manual</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></div>{scheduleDraft.frequency==='weekly'?<div className="util-field"><label>Día</label><select value={scheduleDraft.weekday} onChange={(e)=>setScheduleDraft({...scheduleDraft,weekday:e.target.value})}>{WEEKDAYS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>:null}</form></Modal>:null}
    {modal==='methodology'?<Modal title="Metodología geográfica" subtitle="Cómo interpreta SEOLOCAL las métricas del Local Lab V22.1." onClose={()=>setModal(null)} footer={<button className="util-btn primary" onClick={()=>setModal(null)}>Entendido</button>}><div className="grid-v221-methodology"><article><h4>Average Map Rank</h4><p>{text(methodology.averageMapRank,'Promedio de posiciones activas. Menor es mejor.')}</p></article><article><h4>Share of Local Voice</h4><p>{text(methodology.shareOfLocalVoice,'Índice ponderado de presencia entre Top 1 y Top 20.')}</p></article><small>LOCAL LAB: estas métricas son deterministas para pruebas. Al conectar un proveedor real, la misma metodología se aplicará a posiciones observadas.</small></div></Modal>:null}
    {modal==='competitors'?<Modal title="Top 20 competidores locales" subtitle="Benchmark ampliado del área de búsqueda." onClose={()=>setModal(null)} footer={<button className="util-btn primary" onClick={()=>setModal(null)}>Cerrar</button>}><div className="grid-v221-top20"><table className="util-table"><thead><tr><th>#</th><th>Competidor</th><th>AMR</th><th>SoLV</th><th>Top 3</th><th>Rating</th><th>Reseñas</th><th>Distancia</th></tr></thead><tbody>{allCompetitors.map((row,index)=><tr key={`${text(row.name)}-${index}`}><td>{index+1}</td><td><b>{text(row.name)}</b></td><td>#{num(row.averageMapRank).toFixed(1)}</td><td>{num(row.shareOfLocalVoice)}%</td><td>{num(row.top3Coverage)}%</td><td>★ {num(row.rating).toFixed(1)}</td><td>{num(row.reviews)}</td><td>{num(row.distanceKm).toFixed(1)} km</td></tr>)}</tbody></table></div></Modal>:null}
    <Loading show={loading}/>
  </div>;
}

function K({label,value,hint,icon}:{label:string;value:unknown;hint:string;icon:ReactNode}){return <div className="grid-v22-kpi"><span>{icon}{label}</span><strong>{String(value)}</strong><small>{hint}</small></div>;}
function Coverage({label,value,className}:{label:string;value:number;className:string}){return <div><span><b>{label}</b><em>{value}%</em></span><i><b className={className} style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></i></div>;}
function PointDrawer({data,loading,onClose,onToggle,onAction,onMove,onDelete}:{data:Row;loading:boolean;onClose:()=>void;onToggle:(cell:GridCell,active:boolean)=>void;onAction:(title:string,description:string)=>void;onMove:(key:string)=>void;onDelete:(key:string)=>void}){
  const point=(data.point??{}) as GridCell;const results=(Array.isArray(data.results)?data.results:[]) as Row[];const custom=String(point.pointKey).startsWith('custom-');
  return <div className="grid-v22-drawer-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}><aside className="grid-v22-drawer"><header><div><span className="util-eyebrow">Geo Intelligence · {text(point.pointKey)}</span><h3>{text(data.keyword,'Keyword')}</h3><p>{num(point.distanceKm).toFixed(2)} km de la sede · {text(point.bearing)} {custom?'· PUNTO PERSONALIZADO':''}</p></div><button className="util-icon-btn" onClick={onClose}><X size={18}/></button></header>{loading?<p>Cargando evidencia…</p>:<><div className="grid-v22-point-kpis"><div><span>Posición</span><strong>{point.rank==null?'NF':`#${num(point.rank)}`}</strong></div><div><span>Anterior</span><strong>{point.previousRank==null?'NF':`#${num(point.previousRank)}`}</strong></div><div><span>Cambio</span><strong className={num(point.delta)>0?'up':num(point.delta)<0?'down':''}>{changeLabel(num(point.delta))}</strong></div><div><span>Oportunidad</span><strong>{num(point.opportunityScore)}%</strong></div></div><div className="grid-v22-point-actions"><button className="util-btn" onClick={()=>onToggle(point,!point.active)}>{point.active?'Desactivar punto':'Reactivar punto'}</button>{custom?<button className="util-btn" onClick={()=>onMove(String(point.pointKey))}>Mover punto</button>:null}{custom?<button className="util-btn danger" onClick={()=>onDelete(String(point.pointKey))}>Eliminar</button>:null}<button className="util-btn primary" onClick={()=>onAction(`Optimizar microzona ${text(point.pointKey)}`,`Punto ${text(point.pointKey)} del Local Search Grid: posición ${point.rank??'NF'}, distancia ${num(point.distanceKm).toFixed(2)} km.`)}><Plus size={14}/>Crear acción</button></div><h4>Top 20 local · evidencia Local Lab</h4><div className="grid-v22-serp">{results.map((row)=><div key={num(row.position)} className={row.isTarget?'is-target':''}><b>#{num(row.position)}</b><span><strong>{text(row.name)}</strong><small>{text(row.category,'Negocio local')} · ★ {num(row.rating).toFixed(1)} · {num(row.reviews)} reseñas · {num(row.distanceKm).toFixed(1)} km</small></span>{row.isTarget?<em>TU NEGOCIO</em>:null}</div>)}</div></>}</aside></div>;
}
