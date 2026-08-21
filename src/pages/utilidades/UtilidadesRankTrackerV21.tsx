/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarClock, ChevronRight, CircleDot,
  Download, Filter, Gauge, Import, LineChart, MapPin, Minus, Plus, RefreshCw,
  Search, Settings2, Smartphone, Target, Trash2, TrendingUp, Trophy, UsersRound, X,
  type LucideIcon,
} from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Loading, Modal, Status, formatDate, text } from './UtilidadesCommon';

type KeywordRow = Row & {
  keyword?: string;
  group?: string;
  searchVolume?: number;
  targetUrl?: string;
  bestPosition?: number;
  previousBest?: number;
  delta?: number;
  movement?: string;
  competitor?: string;
  positions?: Row;
  previous?: Row;
  history?: Row[];
  serpEvidence?: Row[];
};

type TrackerState = Row & {
  metrics?: Row;
  keywords?: KeywordRow[];
  history?: Row[];
  competitors?: Row[];
  schedule?: Row;
  latestRun?: Row | null;
  runs?: Row[];
  config?: Row;
};

const CHANNELS = [
  ['all', 'Todos'],
  ['organicDesktop', 'Google Organic'],
  ['organicMobile', 'Mobile'],
  ['localPack', 'Local Pack'],
  ['maps', 'Maps'],
  ['bing', 'Bing'],
] as const;

const WEEKDAYS = [
  ['monday', 'Lunes'], ['tuesday', 'Martes'], ['wednesday', 'Miércoles'], ['thursday', 'Jueves'],
  ['friday', 'Viernes'], ['saturday', 'Sábado'], ['sunday', 'Domingo'],
] as const;

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function position(row: KeywordRow, key: string) {
  return number((row.positions ?? {})[key], 100);
}

function rankLabel(value: unknown) {
  const parsed = number(value, 100);
  return parsed > 99 ? '—' : `#${parsed}`;
}

function movement(row: KeywordRow) {
  const delta = number(row.delta);
  if (row.movement === 'new') return { label: 'Nueva', className: 'new', icon: <CircleDot size={13} /> };
  if (delta > 0) return { label: `+${delta}`, className: 'up', icon: <ArrowUpRight size={13} /> };
  if (delta < 0) return { label: `${delta}`, className: 'down', icon: <ArrowDownRight size={13} /> };
  return { label: '0', className: 'stable', icon: <Minus size={13} /> };
}

function lineCoordinates(data: Row[], key: string, width = 720, height = 180, invert = false) {
  if (!data.length) return [] as Array<{ x: number; y: number }>;
  const values = data.map((row) => number(row[key]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return data.map((row, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
    const ratio = (number(row[key]) - min) / span;
    const y = invert ? 12 + ratio * (height - 24) : height - ratio * (height - 24) - 12;
    return { x, y };
  });
}

function linePoints(data: Row[], key: string, width = 720, height = 180, invert = false) {
  return lineCoordinates(data, key, width, height, invert).map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function TrendChart({ data, range, onRangeChange }: { data: Row[]; range: 30 | 90 | 180; onRangeChange: (range: 30 | 90 | 180) => void }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const visible = useMemo(() => data.slice(-range), [data, range]);
  if (!visible.length) return <Empty text="Todavía no existe historial de rankings." />;
  const visibilityCoords = lineCoordinates(visible, 'visibility');
  const positionCoords = lineCoordinates(visible, 'averagePosition', 720, 180, true);
  const activeIndex = hoverIndex == null ? visible.length - 1 : Math.min(visible.length - 1, hoverIndex);
  const active = visible[activeIndex];
  const activeVisibility = visibilityCoords[activeIndex];
  const activePosition = positionCoords[activeIndex];
  return (
    <div className="rank-v21-chart-wrap">
      <div className="rank-v21-chart-toolbar">
        <div className="rank-v21-chart-legend"><span><i className="visibility" />Visibilidad</span><span><i className="position" />Posición promedio <b>↑ mejor</b></span></div>
        <div className="rank-v21-range">{([30, 90, 180] as const).map((days) => <button key={days} className={range === days ? 'active' : ''} onClick={() => onRangeChange(days)}>{days}d</button>)}</div>
      </div>
      <div className="rank-v21-chart-stage">
        <svg className="rank-v21-chart" viewBox="0 0 720 210" preserveAspectRatio="none" role="img" aria-label={`Historial de visibilidad y posición promedio, ${range} días`} onMouseLeave={() => setHoverIndex(null)} onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))); setHoverIndex(Math.round(ratio * Math.max(0, visible.length - 1))); }}>
          {[35, 80, 125, 170].map((y) => <line key={y} x1="0" y1={y} x2="720" y2={y} className="grid" />)}
          <polyline points={visibilityCoords.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} className="visibility-line" />
          <polyline points={positionCoords.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} className="position-line" />
          {activeVisibility && activePosition ? <g className="rank-v21-chart-focus"><line x1={activeVisibility.x} y1="10" x2={activeVisibility.x} y2="185" /><circle cx={activeVisibility.x} cy={activeVisibility.y} r="5" className="visibility-dot" /><circle cx={activePosition.x} cy={activePosition.y} r="5" className="position-dot" /></g> : null}
        </svg>
        <div className="rank-v21-chart-tooltip"><strong>{String(active?.date ?? '')}</strong><span>Visibilidad <b>{number(active?.visibility)}%</b></span><span>Posición media <b>#{number(active?.averagePosition).toFixed(1)}</b></span></div>
      </div>
      <div className="rank-v21-chart-axis"><span>{String(visible[0]?.date ?? '')}</span><span>{String(visible[Math.floor(visible.length / 2)]?.date ?? '')}</span><span>{String(visible[visible.length - 1]?.date ?? '')}</span></div>
    </div>
  );
}

export default function UtilidadesRankTrackerV21({
  locationId,
  locationName,
  onAction,
}: {
  locationId: number;
  locationName: string;
  onAction: (title: string, description: string) => void;
}) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<TrackerState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [movementFilter, setMovementFilter] = useState('all');
  const [chartRange, setChartRange] = useState<30 | 90 | 180>(30);
  const [selected, setSelected] = useState<KeywordRow | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [keywordDraft, setKeywordDraft] = useState({ keyword: '', group: 'Prioridad', targetUrl: '' });
  const [scheduleDraft, setScheduleDraft] = useState({ frequency: 'manual', weekday: 'monday' });
  const [competitorsDraft, setCompetitorsDraft] = useState<string[]>(['', '', '', '']);

  async function load() {
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTracker(locationId) as TrackerState);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar Rank Tracker V21.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [locationId]);

  const metrics = (data.metrics ?? {}) as Row;
  const keywords = (Array.isArray(data.keywords) ? data.keywords : []) as KeywordRow[];
  const history = (Array.isArray(data.history) ? data.history : []) as Row[];
  const competitors = (Array.isArray(data.competitors) ? data.competitors : []) as Row[];
  const runs = (Array.isArray(data.runs) ? data.runs : []) as Row[];
  const schedule = (data.schedule ?? {}) as Row;
  const groups = useMemo(() => [...new Set(keywords.map((row) => String(row.group || 'Sin grupo')))].sort(), [keywords]);

  const movementCounts = useMemo(() => ({
    all: keywords.length,
    up: keywords.filter((row) => String(row.movement) === 'up').length,
    down: keywords.filter((row) => String(row.movement) === 'down').length,
    stable: keywords.filter((row) => String(row.movement || 'stable') === 'stable').length,
    top3: keywords.filter((row) => number(row.bestPosition, 100) <= 3).length,
    top10: keywords.filter((row) => number(row.bestPosition, 100) <= 10).length,
    unranked: keywords.filter((row) => number(row.bestPosition, 100) > 40).length,
  }), [keywords]);

  const positionDistribution = useMemo(() => {
    const buckets = { top3: 0, firstPage: 0, top20: 0, beyond20: 0 };
    keywords.forEach((row) => {
      const best = number(row.bestPosition, 100);
      if (best <= 3) buckets.top3 += 1;
      else if (best <= 10) buckets.firstPage += 1;
      else if (best <= 20) buckets.top20 += 1;
      else buckets.beyond20 += 1;
    });
    const total = Math.max(1, keywords.length);
    return {
      ...buckets,
      total: keywords.length,
      top3Pct: (buckets.top3 / total) * 100,
      firstPagePct: (buckets.firstPage / total) * 100,
      top20Pct: (buckets.top20 / total) * 100,
      beyond20Pct: (buckets.beyond20 / total) * 100,
    };
  }, [keywords]);

  const filtered = useMemo(() => keywords.filter((row) => {
    if (search && !String(row.keyword || '').toLocaleLowerCase().includes(search.toLocaleLowerCase())) return false;
    if (group !== 'all' && String(row.group || 'Sin grupo') !== group) return false;
    if (movementFilter === 'up' && String(row.movement) !== 'up') return false;
    if (movementFilter === 'down' && String(row.movement) !== 'down') return false;
    if (movementFilter === 'stable' && String(row.movement || 'stable') !== 'stable') return false;
    if (movementFilter === 'top3' && number(row.bestPosition, 100) > 3) return false;
    if (movementFilter === 'top10' && number(row.bestPosition, 100) > 10) return false;
    if (movementFilter === 'unranked' && number(row.bestPosition, 100) <= 40) return false;
    if (channel !== 'all' && position(row, channel) > 40) return false;
    return true;
  }), [keywords, search, group, movementFilter, channel]);
  const showChannel = (key: string) => channel === 'all' || channel === key;

  async function run() {
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTrackerRun(locationId) as TrackerState);
      setSuccess('Rankings actualizados y nueva ejecución guardada en PostgreSQL.');
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron actualizar los rankings.');
    } finally { setLoading(false); }
  }

  async function addKeyword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTrackerAddKeywords(locationId, [keywordDraft]) as TrackerState);
      setModal(null);
      setKeywordDraft({ keyword: '', group: 'Prioridad', targetUrl: '' });
      setSuccess('Palabra clave agregada y rankings recalculados.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo agregar la palabra clave.'); }
    finally { setLoading(false); }
  }

  async function deleteKeyword(keyword: string) {
    if (!window.confirm(`¿Eliminar “${keyword}” del seguimiento?`)) return;
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTrackerDeleteKeyword(locationId, keyword) as TrackerState);
      setSelected(null);
      setSuccess('Palabra clave retirada del seguimiento.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la palabra clave.'); }
    finally { setLoading(false); }
  }

  async function saveSchedule(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTrackerSchedule(locationId, scheduleDraft) as TrackerState);
      setModal(null);
      setSuccess(scheduleDraft.frequency === 'manual' ? 'Actualización automática desactivada.' : 'Programación guardada. NestJS ejecutará el seguimiento cuando corresponda.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar la programación.'); }
    finally { setLoading(false); }
  }

  async function saveCompetitors(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTrackerCompetitors(locationId, competitorsDraft) as TrackerState);
      setModal(null);
      setSuccess('Competidores actualizados y comparación recalculada.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron actualizar competidores.'); }
    finally { setLoading(false); }
  }

  function openSchedule() {
    setScheduleDraft({ frequency: String(schedule.frequency || 'manual'), weekday: String(schedule.weekday || 'monday') });
    setModal('schedule');
  }

  function openCompetitors() {
    const current = ((data.config as Row | undefined)?.competitors ?? []) as unknown[];
    setCompetitorsDraft([0, 1, 2, 3].map((index) => String(current[index] ?? '')));
    setModal('competitors');
  }

  async function importCsv(file?: File) {
    if (!file) return;
    const content = await file.text();
    const rows = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 100);
    const parsed = rows.map((line, index) => {
      const [keyword, keywordGroup = 'Importadas', targetUrl = ''] = line.split(',').map((value) => value.trim());
      return index === 0 && /keyword|palabra/i.test(keyword) ? null : { keyword, group: keywordGroup, targetUrl };
    }).filter((row): row is { keyword: string; group: string; targetUrl: string } => Boolean(row?.keyword));
    if (!parsed.length) { setError('El CSV no contiene palabras clave válidas. Usa: keyword,grupo,url.'); return; }
    setLoading(true);
    try {
      setData(await utilidadesV15Api.rankTrackerAddKeywords(locationId, parsed) as TrackerState);
      setSuccess(`${parsed.length} palabras clave importadas y recalculadas.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo importar el CSV.'); }
    finally { setLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  function exportCsv() {
    const header = ['Keyword', 'Grupo', 'Volumen', 'Organic Desktop', 'Organic Mobile', 'Local Pack', 'Maps', 'Bing', 'Delta', 'URL'];
    const rows = keywords.map((row) => [
      row.keyword, row.group, row.searchVolume, position(row, 'organicDesktop'), position(row, 'organicMobile'),
      position(row, 'localPack'), position(row, 'maps'), position(row, 'bing'), row.delta, row.targetUrl,
    ]);
    const csv = [header, ...rows].map((values) => values.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `rank-tracker-${locationId}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  if (loading && !keywords.length) return <Loading show label="Preparando Rank Tracker V21…" />;

  return (
    <div className="rank-v21">
      <ErrorBox message={error} onRetry={load} />
      {success ? <div className="rank-v21-success">{success}<button onClick={() => setSuccess(null)}>×</button></div> : null}

      <section className="rank-v21-hero">
        <div>
          <div className="rank-v21-badges"><span className="lab">LOCAL LAB V21</span><span className="ready">Persistencia activa</span></div>
          <h2>Rank Tracker Local</h2>
          <p>Seguimiento multicanal de {locationName}: Google Organic, Mobile, Local Pack, Maps y Bing, con histórico, competidores y evidencia SERP.</p>
          <div className="rank-v21-runtime"><span>Última ejecución <b>{formatDate((data.latestRun as Row | null)?.generatedAt)}</b></span><span>Próxima <b>{schedule.nextRunAt ? formatDate(schedule.nextRunAt) : 'Manual'}</b></span></div>
        </div>
        <div className="rank-v21-actions">
          <button className="util-btn" onClick={openSchedule}><CalendarClock size={15} />Programar</button>
          <button className="util-btn" onClick={openCompetitors}><UsersRound size={15} />Competidores</button>
          <button className="util-btn primary" onClick={() => void run()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} />Actualizar rankings</button>
        </div>
      </section>

      <section className="rank-v21-kpis">
        {([
          ['Visibilidad', `${number(metrics.visibility)}%`, TrendingUp, 'Índice ponderado de presencia'],
          ['Posición Google', `#${number(metrics.averagePosition).toFixed(1)}`, Gauge, 'Promedio multicanal'],
          ['Top 3', number(metrics.top3), Trophy, 'Keywords con máxima visibilidad'],
          ['Top 10', number(metrics.top10), Target, 'Primera página'],
          ['Top 20', number(metrics.top20), LineChart, 'Cobertura ampliada'],
          ['Ganadas', number(metrics.winners), ArrowUpRight, 'Mejoraron frente a 7 días'],
          ['Perdidas', number(metrics.losers), ArrowDownRight, 'Requieren revisión'],
          ['Nuevas', number(metrics.newRankings), CircleDot, 'Nuevas entradas detectadas'],
          ['Local Pack', `${number(metrics.localPackCoverage)}%`, MapPin, 'Cobertura de keywords'],
        ] as Array<[string, string | number, LucideIcon, string]>).map(([label, value, Icon, note]) => <article key={label}><div><Icon size={17} /></div><span>{label}</span><strong>{String(value)}</strong><small>{note}</small></article>)}
      </section>

      <section className="rank-v21-grid2">
        <div className="rank-v21-panel">
          <header><div><span className="eyebrow">Tendencia {chartRange} días</span><h3>Visibilidad y posición promedio</h3></div><Activity size={19} /></header>
          <TrendChart data={history} range={chartRange} onRangeChange={setChartRange} />
        </div>
        <div className="rank-v21-panel">
          <header><div><span className="eyebrow">Distribución SERP</span><h3>Dónde están tus keywords</h3></div><BarChart3 size={19} /></header>
          <div className="rank-v21-distribution">
            <div className="rank-v21-distribution-head"><strong>{positionDistribution.total}</strong><span>keywords monitorizadas distribuidas por su mejor posición multicanal.</span></div>
            <div className="rank-v21-distribution-bar" aria-label="Distribución de posiciones SERP">
              <i className="top3" style={{ width: `${positionDistribution.top3Pct}%` }} />
              <i className="first" style={{ width: `${positionDistribution.firstPagePct}%` }} />
              <i className="top20" style={{ width: `${positionDistribution.top20Pct}%` }} />
              <i className="beyond" style={{ width: `${positionDistribution.beyond20Pct}%` }} />
            </div>
            <div className="rank-v21-distribution-grid">
              <span><i className="top3" /><b>{positionDistribution.top3}</b><small>Top 3</small></span>
              <span><i className="first" /><b>{positionDistribution.firstPage}</b><small>Pos. 4–10</small></span>
              <span><i className="top20" /><b>{positionDistribution.top20}</b><small>Pos. 11–20</small></span>
              <span><i className="beyond" /><b>{positionDistribution.beyond20}</b><small>20+ / sin ranking</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="rank-v21-panel rank-v21-competitors">
        <header><div><span className="eyebrow">Competencia local</span><h3>Share de visibilidad y posiciones</h3></div><div className="rank-v21-competitor-actions"><button className="util-btn" onClick={() => setModal('comparison')}><BarChart3 size={14} />Comparación completa</button><button className="util-btn" onClick={openCompetitors}><Settings2 size={14} />Editar</button></div></header>
        <div className="rank-v21-competitor-grid">
          {[{ name: `${locationName} · Tu negocio`, visibility: number(metrics.visibility), change: number(metrics.visibilityChange), averagePosition: number(metrics.averagePosition), top3: number(metrics.top3), top10: number(metrics.top10), target: true }, ...competitors].map((item, index) => <article key={String(item.name)} className={item.target ? 'target' : ''}><span className="position">{item.target ? 'TU NEGOCIO' : `COMP. ${index}`}</span><div><strong>{text(item.name)}</strong><small>Posición media #{number(item.averagePosition).toFixed(1)}</small></div><div className="visibility"><b>{number(item.visibility)}%</b><span className={number(item.change) >= 0 ? 'up' : 'down'}>{number(item.change) >= 0 ? '+' : ''}{number(item.change)}%</span></div><div className="bar"><i style={{ width: `${number(item.visibility)}%` }} /></div><footer><span>Top 3 <b>{number(item.top3)}</b></span><span>Top 10 <b>{number(item.top10)}</b></span></footer></article>)}
          {!competitors.length ? <Empty text="Agrega hasta 4 competidores para activar la comparación." /> : null}
        </div>
      </section>

      <section className="rank-v21-panel">
        <header className="rank-v21-table-head"><div><span className="eyebrow">Centro de trabajo</span><h3>Palabras clave y superficies de ranking</h3></div><div className="rank-v21-table-actions"><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => void importCsv(event.target.files?.[0])} /><button className="util-btn" onClick={() => fileRef.current?.click()}><Import size={14} />Importar CSV</button><button className="util-btn" onClick={exportCsv}><Download size={14} />Exportar</button><button className="util-btn primary" onClick={() => setModal('keyword')}><Plus size={14} />Añadir keyword</button></div></header>
        <div className="rank-v21-channel-tabs">{CHANNELS.map(([key, label]) => <button key={key} className={channel === key ? 'active' : ''} onClick={() => setChannel(key)}>{label}</button>)}</div>
        <div className="rank-v21-filters"><label><Search size={14} /><input placeholder="Buscar keyword…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">Todos los grupos</option>{groups.map((value) => <option key={value}>{value}</option>)}</select><span><Filter size={14} />{filtered.length} de {keywords.length}</span></div>
        <div className="rank-v21-quickfilters">{([['all','Todas',movementCounts.all],['up','Ganadoras',movementCounts.up],['down','Perdidas',movementCounts.down],['stable','Sin cambios',movementCounts.stable],['top3','Top 3',movementCounts.top3],['top10','Top 10',movementCounts.top10],['unranked','Sin ranking',movementCounts.unranked]] as Array<[string,string,number]>).map(([key,label,count]) => <button key={key} className={movementFilter === key ? 'active' : ''} onClick={() => setMovementFilter(key)}>{label}<b>{count}</b></button>)}</div>
        <div className="rank-v21-table-wrap"><table className="rank-v21-table"><thead><tr><th>Keyword</th><th>Grupo</th><th>Volumen</th>{showChannel('organicDesktop') ? <th>Organic</th> : null}{showChannel('organicMobile') ? <th><Smartphone size={13} /> Mobile</th> : null}{showChannel('localPack') ? <th>Local Pack</th> : null}{showChannel('maps') ? <th>Maps</th> : null}{showChannel('bing') ? <th>Bing</th> : null}<th>Δ</th><th>URL / competidor</th><th /></tr></thead><tbody>{filtered.map((row) => { const mv = movement(row); return <tr key={String(row.keyword)}><td><button className="rank-v21-keyword" onClick={() => setSelected(row)}>{text(row.keyword)}<small>Mejor posición {rankLabel(row.bestPosition)}</small></button></td><td><span className="rank-v21-group">{text(row.group, 'Sin grupo')}</span></td><td>{number(row.searchVolume).toLocaleString('es-419')}</td>{showChannel('organicDesktop') ? <td className="rank">{rankLabel(position(row, 'organicDesktop'))}</td> : null}{showChannel('organicMobile') ? <td className="rank">{rankLabel(position(row, 'organicMobile'))}</td> : null}{showChannel('localPack') ? <td className="rank local">{rankLabel(position(row, 'localPack'))}</td> : null}{showChannel('maps') ? <td className="rank local">{rankLabel(position(row, 'maps'))}</td> : null}{showChannel('bing') ? <td className="rank">{rankLabel(position(row, 'bing'))}</td> : null}<td><span className={`rank-v21-movement ${mv.className}`}>{mv.icon}{mv.label}</span></td><td><span className="rank-v21-url">{text(row.targetUrl, '—')}</span><small>{text(row.competitor, 'Sin competidor')}</small></td><td><button className="rank-v21-open" title="Abrir detalle" onClick={() => setSelected(row)}><ChevronRight size={16} /></button></td></tr>; })}</tbody></table></div>
        {!filtered.length ? <Empty text="No hay keywords que coincidan con los filtros." /> : null}
      </section>

      <details className="rank-v21-runs"><summary>Fuentes y ejecuciones · {runs.length} registros recientes</summary><div>{runs.map((runItem) => <article key={Number(runItem.id)}><Status value={runItem.status} /><span>{formatDate(runItem.generatedAt)}</span><b>Visibilidad {number((runItem.metrics as Row | undefined)?.visibility)}%</b><b>Posición #{number((runItem.metrics as Row | undefined)?.averagePosition).toFixed(1)}</b></article>)}</div></details>

      {selected ? <KeywordDetail row={selected} onClose={() => setSelected(null)} onDelete={() => void deleteKeyword(String(selected.keyword))} onAction={() => { onAction(`Mejorar ranking · ${text(selected.keyword)}`, `Optimizar ${text(selected.keyword)}. Posición actual ${rankLabel(selected.bestPosition)}; revisar URL, Local Pack, Maps y competidores.`); setSelected(null); }} onGrid={() => navigate(`/utilidades/ubicaciones/${locationId}/cuadricula?keyword=${encodeURIComponent(String(selected.keyword || ''))}`)} /> : null}

      {modal === 'keyword' ? <Modal title="Añadir palabra clave" onClose={() => setModal(null)} footer={<><button className="util-btn" onClick={() => setModal(null)}>Cancelar</button><button className="util-btn primary" form="rank-keyword-form">Añadir y medir</button></>}><form id="rank-keyword-form" className="util-formgrid" onSubmit={addKeyword}><div className="util-field util-wide"><label>Palabra clave</label><input required value={keywordDraft.keyword} onChange={(e) => setKeywordDraft({ ...keywordDraft, keyword: e.target.value })} /></div><div className="util-field"><label>Grupo</label><input value={keywordDraft.group} onChange={(e) => setKeywordDraft({ ...keywordDraft, group: e.target.value })} /></div><div className="util-field util-wide"><label>URL objetivo</label><input placeholder="https://…" value={keywordDraft.targetUrl} onChange={(e) => setKeywordDraft({ ...keywordDraft, targetUrl: e.target.value })} /></div></form></Modal> : null}

      {modal === 'schedule' ? <Modal title="Programar Rank Tracker" onClose={() => setModal(null)} footer={<><button className="util-btn" onClick={() => setModal(null)}>Cancelar</button><button className="util-btn primary" form="rank-schedule-form">Guardar programación</button></>}><form id="rank-schedule-form" className="util-formgrid" onSubmit={saveSchedule}><div className="util-field"><label>Frecuencia</label><select value={scheduleDraft.frequency} onChange={(e) => setScheduleDraft({ ...scheduleDraft, frequency: e.target.value })}><option value="manual">Manual</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option></select></div>{scheduleDraft.frequency === 'weekly' ? <div className="util-field"><label>Día</label><select value={scheduleDraft.weekday} onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekday: e.target.value })}>{WEEKDAYS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div> : null}<div className="rank-v21-modal-note">Las ejecuciones semanales/mensuales se disparan automáticamente mientras el backend NestJS esté activo. Cada ejecución crea un nuevo histórico persistente.</div></form></Modal> : null}

      {modal === 'competitors' ? <Modal title="Competidores monitoreados" onClose={() => setModal(null)} footer={<><button className="util-btn" onClick={() => setModal(null)}>Cancelar</button><button className="util-btn primary" form="rank-competitors-form">Guardar y comparar</button></>}><form id="rank-competitors-form" className="util-formgrid" onSubmit={saveCompetitors}>{competitorsDraft.map((value, index) => <div className="util-field util-wide" key={index}><label>Competidor {index + 1}</label><input value={value} onChange={(e) => setCompetitorsDraft(competitorsDraft.map((current, positionIndex) => positionIndex === index ? e.target.value : current))} /></div>)}</form></Modal> : null}
      {modal === 'comparison' ? <CompetitorComparison locationName={locationName} keywords={keywords} competitors={competitors} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

function competitorKeywordPosition(competitor: Row, keyword: string) {
  const rows = Array.isArray(competitor.keywordPositions) ? competitor.keywordPositions as Row[] : [];
  return number(rows.find((item) => String(item.keyword) === keyword)?.position, 100);
}

function CompetitorComparison({ locationName, keywords, competitors, onClose }: { locationName: string; keywords: KeywordRow[]; competitors: Row[]; onClose: () => void }) {
  return <Modal title="Comparación completa de competidores" onClose={onClose} wide footer={<button className="util-btn primary" onClick={onClose}>Cerrar comparación</button>}>
    <div className="rank-v21-compare-intro"><BarChart3 size={18} /><div><strong>Matriz keyword × competidor</strong><span>Compara la posición orgánica actual de tu ubicación contra hasta 4 competidores monitoreados.</span></div></div>
    <div className="rank-v21-compare-wrap"><table className="rank-v21-compare-table"><thead><tr><th>Keyword</th><th>{locationName}</th>{competitors.map((item) => <th key={String(item.name)}>{text(item.name)}</th>)}</tr></thead><tbody>{keywords.slice(0, 30).map((row) => <tr key={String(row.keyword)}><td>{text(row.keyword)}</td><td className="target">{rankLabel(position(row, 'organicDesktop'))}</td>{competitors.map((item) => { const value = competitorKeywordPosition(item, String(row.keyword)); const ours = position(row, 'organicDesktop'); return <td key={`${String(item.name)}-${String(row.keyword)}`} className={value < ours ? 'ahead' : value > ours ? 'behind' : ''}>{rankLabel(value)}</td>; })}</tr>)}</tbody></table></div>
  </Modal>;
}

function MiniPositionChart({ data, range, onRangeChange }: { data: Row[]; range: 30 | 90 | 180; onRangeChange: (range: 30 | 90 | 180) => void }) {
  const visible = data.slice(-range);
  return <div className="rank-v21-mini-wrap"><div className="rank-v21-range">{([30,90,180] as const).map((days) => <button key={days} className={range === days ? 'active' : ''} onClick={() => onRangeChange(days)}>{days}d</button>)}</div><svg className="rank-v21-mini-chart" viewBox="0 0 680 150" preserveAspectRatio="none"><polyline points={linePoints(visible, 'position', 680, 140, true)} /></svg><div className="rank-v21-mini-axis"><span>{String(visible[0]?.date ?? '')}</span><span>↑ una posición menor es mejor</span><span>{String(visible[visible.length - 1]?.date ?? '')}</span></div></div>;
}

function KeywordDetail({ row, onClose, onDelete, onAction, onGrid }: { row: KeywordRow; onClose: () => void; onDelete: () => void; onAction: () => void; onGrid: () => void }) {
  const [range, setRange] = useState<30 | 90 | 180>(90);
  const history = Array.isArray(row.history) ? row.history : [];
  const serp = Array.isArray(row.serpEvidence) ? row.serpEvidence : [];
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  const mv = movement(row);
  const surfaces = [['Organic','organicDesktop'],['Mobile','organicMobile'],['Local Pack','localPack'],['Maps','maps'],['Bing','bing']] as const;
  return <div className="rank-v21-drawer-shell" role="dialog" aria-modal="true" aria-label={`Detalle ${text(row.keyword)}`}>
    <button className="rank-v21-drawer-backdrop" aria-label="Cerrar detalle" onClick={onClose} />
    <aside className="rank-v21-drawer">
      <header><div><span className="eyebrow">Keyword Intelligence</span><h3>{text(row.keyword, 'Detalle de keyword')}</h3><div className="rank-v21-drawer-meta"><span className="rank-v21-group">{text(row.group, 'Sin grupo')}</span><span className={`rank-v21-movement ${mv.className}`}>{mv.icon}{mv.label}</span><span>Volumen {number(row.searchVolume).toLocaleString('es-419')}</span></div></div><button className="rank-v21-drawer-close" onClick={onClose}><X size={19} /></button></header>
      <div className="rank-v21-drawer-scroll">
        <div className="rank-v21-detail-kpis">{surfaces.map(([label,key]) => <div key={key}><span>{label}</span><strong>{rankLabel(position(row,key))}</strong><small>Anterior {rankLabel(number((row.previous ?? {})[key],100))}</small></div>)}</div>
        <div className="rank-v21-intel-strip"><div><span>URL posicionada</span><b>{text(row.targetUrl,'—')}</b></div><div><span>Competidor principal</span><b>{text(row.competitor,'Sin competidor')}</b></div><div><span>Mejor posición</span><b>{rankLabel(row.bestPosition)}</b></div></div>
        <section><div className="rank-v21-detail-section-head"><div><span className="eyebrow">Evolución</span><h4>Historial individual</h4></div></div><MiniPositionChart data={history} range={range} onRangeChange={setRange} /></section>
        <section><div className="rank-v21-detail-section-head"><div><span className="eyebrow">Superficies</span><h4>Actual vs. anterior</h4></div></div><div className="rank-v21-surface-list">{surfaces.map(([label,key]) => { const current=position(row,key); const previous=number((row.previous ?? {})[key],100); const delta=previous-current; return <article key={key}><strong>{label}</strong><span>Actual <b>{rankLabel(current)}</b></span><span>Anterior <b>{rankLabel(previous)}</b></span><span className={delta>0?'up':delta<0?'down':'stable'}>{delta>0?`↑ ${delta}`:delta<0?`↓ ${Math.abs(delta)}`:'—'}</span></article>; })}</div></section>
        <section><div className="rank-v21-detail-section-head"><div><span className="eyebrow">SERP Evidence</span><h4>Evidencia SERP · Local Lab</h4></div></div><p className="rank-v21-evidence-note">Estos resultados son evidencia determinista de laboratorio para validar el flujo. Al conectar un proveedor SERP real, esta misma vista mostrará resultados verificados.</p><div className="rank-v21-serp">{serp.map((item) => <article key={number(item.position)} className={item.isTarget ? 'target' : ''}><span>{number(item.position)}</span><div><b>{text(item.name)}</b><small>{text(item.type)} · {text(item.url)}</small></div>{item.isTarget ? <strong>Tu negocio</strong> : null}</article>)}</div></section>
      </div>
      <footer><button className="util-btn danger" onClick={onDelete}><Trash2 size={14} />Eliminar</button><button className="util-btn" onClick={onGrid}><MapPin size={14} />Search Grid</button><button className="util-btn primary" onClick={onAction}><Plus size={14} />Crear acción</button></footer>
    </aside>
  </div>;
}

