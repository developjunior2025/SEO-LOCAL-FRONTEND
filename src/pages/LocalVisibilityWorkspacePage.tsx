import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Crosshair,
  ExternalLink,
  ImageOff,
  Layers3,
  Loader2,
  LocateFixed,
  Plus,
  Radar,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  Store,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LocalPackBusiness,
  LocalPackMarketSummary,
  LocalVisibilityPreviewResponse,
  marketplaceApi,
} from '@/services/marketplaceApi';

const EXECUTIVE_WORKSPACE_VERSION = 'V2.0-A1';
const HISTORY_KEY = 'seolocal.localVisibility.workspace.history.v2';
const KEYWORDS_KEY = 'seolocal.localVisibility.workspace.keywords.v2';
const ACTIONS_KEY = 'seolocal.localVisibility.workspace.actions.v2';
const HANDOFF_KEY = 'seolocal.localVisibility.workspace.handoff.v2';

type WorkspaceTab =
  | 'overview'
  | 'geogrid'
  | 'competitors'
  | 'serp'
  | 'diagnosis'
  | 'actions';

type LoadingState = 'location' | 'pack' | 'details' | 'grid' | 'competitor-grid' | null;

type BrowserLocation = {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
};

type HistoryEntry = {
  id: string;
  at: string;
  query: string;
  business: string;
  position: number | null;
  averageRank: number | null;
  top3Coverage: number | null;
  top10Coverage: number | null;
  visibilityScore: number | null;
};


type WorkspaceHandoff = {
  version: string;
  savedAt: string;
  query: string;
  targetName: string;
  radiusKm: number;
  location: BrowserLocation | null;
  packData: LocalVisibilityPreviewResponse | null;
  detailsData: LocalVisibilityPreviewResponse | null;
  gridData: LocalVisibilityPreviewResponse | null;
  selectedBusiness: LocalPackBusiness | null;
};

type DiagnosticItem = {
  key: string;
  level: 'high' | 'medium' | 'good' | 'review';
  label: string;
  title: string;
  finding: string;
  evidence: string;
  actionCode?: 'LOCAL_PACK_RANKING' | 'REPUTATION' | 'GBP_AUDIT';
  fallbackRoute?: string;
};

type WorkspaceAction = {
  key: string;
  priority: number;
  title: string;
  reason: string;
  evidence: string;
  route: string;
  impact: 'Alto' | 'Medio';
  effort: 'Bajo' | 'Medio' | 'Alto';
};

const TABS: Array<{ id: WorkspaceTab; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'geogrid', label: 'GeoGrid', icon: Crosshair },
  { id: 'competitors', label: 'Competidores', icon: UsersRound },
  { id: 'serp', label: 'SERP Local', icon: Search },
  { id: 'diagnosis', label: 'Diagnóstico', icon: ClipboardCheck },
  { id: 'actions', label: 'Acciones', icon: Sparkles },
];


function readHandoff(): WorkspaceHandoff | null {
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceHandoff;
    // SEOLOCAL_EXECUTIVE_HANDOFF_COMPAT_V2_0_A1
    // UI/entry-flow revisions may suffix the handoff version (for example V2.0-A1-R2)
    // without changing the serialized handoff schema. Accept that compatible family instead
    // of discarding LIVE pack data merely because the UI revision changed.
    if (
      !parsed ||
      (parsed.version !== EXECUTIVE_WORKSPACE_VERSION &&
        !parsed.version.startsWith(`${EXECUTIVE_WORKSPACE_VERSION}-`))
    )
      return null;
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    return Number.isFinite(age) && age <= 2 * 60 * 60 * 1000 ? parsed : null;
  } catch {
    return null;
  }
}

function readStringList(key: string): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function readHistory(): HistoryEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is optional; LIVE analysis still works if storage is unavailable.
  }
}

function rankColor(rank: number | null) {
  if (rank === null) return '#dc2626';
  if (rank <= 3) return '#16a34a';
  if (rank <= 10) return '#f59e0b';
  if (rank <= 20) return '#f97316';
  return '#dc2626';
}

function gridIcon(rank: number | null, selected = false) {
  return L.divIcon({
    className: 'seolocal-executive-grid-marker',
    html: `<div style="width:${selected ? 46 : 38}px;height:${selected ? 46 : 38}px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:${selected ? '#102f46' : rankColor(rank)};color:white;border:${selected ? 4 : 3}px solid white;box-shadow:0 7px 20px rgba(15,23,42,.28);font-size:${selected ? 14 : 11}px;font-weight:900;">${selected ? '★' : rank === null ? 'NF' : `#${rank}`}</div>`,
    iconSize: [selected ? 46 : 38, selected ? 46 : 38],
    iconAnchor: [selected ? 23 : 19, selected ? 23 : 19],
  });
}

function FitWorkspaceMap({ data }: { data: LocalVisibilityPreviewResponse }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[data.origin.lat, data.origin.lng]];
    data.grid.forEach((cell) => points.push([cell.lat, cell.lng]));
    if (data.selectedBusiness?.lat !== null && data.selectedBusiness?.lat !== undefined && data.selectedBusiness?.lng !== null && data.selectedBusiness?.lng !== undefined) {
      points.push([data.selectedBusiness.lat, data.selectedBusiness.lng]);
    }
    if (points.length > 1) map.fitBounds(points, { padding: [34, 34], maxZoom: 14, animate: true });
  }, [data, map]);
  return null;
}

function SafeImage({ business }: { business: LocalPackBusiness }) {
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [business.imageUrl, business.imageFallbackUrl].filter(
    (value, index, rows) => Boolean(value) && rows.indexOf(value) === index,
  );
  const source = candidates.find((url) => !failed.includes(url)) ?? '';
  if (!source) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    <img
      src={source}
      alt={business.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-12 w-12 shrink-0 rounded-xl object-cover"
      onError={() => setFailed((current) => (current.includes(source) ? current : [...current, source]))}
    />
  );
}

function Stars({ rating }: { rating: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-black text-slate-800">
      {rating ?? '—'} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
    </span>
  );
}

function KpiCard({ label, value, hint, tone = 'slate' }: { label: string; value: string; hint: string; tone?: 'slate' | 'green' | 'blue' | 'amber' }) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-200 bg-emerald-50/50'
      : tone === 'blue'
        ? 'border-blue-200 bg-blue-50/50'
        : tone === 'amber'
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-slate-200 bg-white';
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <strong className="mt-1 block text-2xl font-black text-slate-950">{value}</strong>
      <small className="text-[11px] text-slate-500">{hint}</small>
    </div>
  );
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

function PanelHeading({ kicker, title, text, action }: { kicker?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
      <div>
        {kicker ? <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D32323]">{kicker}</span> : null}
        <h3 className="mt-0.5 text-base font-black text-slate-950">{title}</h3>
        {text ? <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p> : null}
      </div>
      {action ? <div className="sm:ml-auto">{action}</div> : null}
    </div>
  );
}

function LoadingButton({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {active ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </span>
  );
}

export default function LocalVisibilityWorkspacePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialLatRaw = searchParams.get('lat');
  const initialLngRaw = searchParams.get('lng');
  const initialAccuracyRaw = searchParams.get('accuracy');
  const initialLat = initialLatRaw === null ? Number.NaN : Number(initialLatRaw);
  const initialLng = initialLngRaw === null ? Number.NaN : Number(initialLngRaw);
  const initialAccuracy = initialAccuracyRaw === null ? Number.NaN : Number(initialAccuracyRaw);
  const initialLocation =
    Number.isFinite(initialLat) && Number.isFinite(initialLng)
      ? {
          lat: initialLat,
          lng: initialLng,
          accuracyMeters: Number.isFinite(initialAccuracy) ? initialAccuracy : null,
        }
      : null;

  const [handoff] = useState<WorkspaceHandoff | null>(() => readHandoff());
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    initialTab === 'geogrid' ||
      initialTab === 'competitors' ||
      initialTab === 'serp' ||
      initialTab === 'diagnosis' ||
      initialTab === 'actions'
      ? initialTab
      : 'overview',
  ); // SEOLOCAL_EXECUTIVE_WORKSPACE_ENTRY_FLOW_R2
  const [query, setQuery] = useState(searchParams.get('q') ?? handoff?.query ?? '');
  const [targetName, setTargetName] = useState(searchParams.get('target') ?? handoff?.targetName ?? '');
  const [radiusKm, setRadiusKm] = useState(handoff?.radiusKm ?? 2.5);
  const [location, setLocation] = useState<BrowserLocation | null>(initialLocation ?? handoff?.location ?? null);
  const [packData, setPackData] = useState<LocalVisibilityPreviewResponse | null>(handoff?.packData ?? null);
  const [detailsData, setDetailsData] = useState<LocalVisibilityPreviewResponse | null>(handoff?.detailsData ?? null);
  const [gridData, setGridData] = useState<LocalVisibilityPreviewResponse | null>(handoff?.gridData ?? null);
  const [competitorGrid, setCompetitorGrid] = useState<LocalVisibilityPreviewResponse | null>(null);
  const [mapMode, setMapMode] = useState<'target' | 'competitor'>('target');
  const [trackedBusiness, setTrackedBusiness] = useState<LocalPackBusiness | null>(handoff?.selectedBusiness ?? null);
  const [selectedBusiness, setSelectedBusiness] = useState<LocalPackBusiness | null>(handoff?.selectedBusiness ?? handoff?.packData?.selectedBusiness ?? null);
  const [selectedCellKey, setSelectedCellKey] = useState(() => {
    const initialGrid = handoff?.gridData;
    const center = initialGrid?.grid.find((cell) => cell.row === 3 && cell.col === 3) ?? initialGrid?.grid[0];
    return center ? `${center.row}-${center.col}` : '';
  });
  const [selectedCompetitorKey, setSelectedCompetitorKey] = useState('');
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState('');
  const [storedKeywords, setStoredKeywords] = useState<string[]>(() => readStringList(KEYWORDS_KEY));
  const [history, setHistory] = useState<HistoryEntry[]>(() => readHistory());
  const [completedActions, setCompletedActions] = useState<string[]>(() => readStringList(ACTIONS_KEY));

  const rankingEligible = packData?.searchInterpretation?.rankingEligible !== false;
  const businessIntentMatch =
    packData?.action === 'pack' && packData.searchInterpretation?.rankingEligible === false
      ? packData.directMatch ?? null
      : null;
  const effectiveBusiness = detailsData?.selectedBusiness ?? selectedBusiness ?? trackedBusiness;
  const market = detailsData?.market ?? packData?.market ?? null;
  const metrics = gridData?.metrics ?? null;
  const activeMapData = mapMode === 'competitor' && competitorGrid ? competitorGrid : gridData;
  const competitorLeaders = gridData?.metrics?.competitorLeaders ?? [];
  const selectedCell = activeMapData?.grid.find((cell) => `${cell.row}-${cell.col}` === selectedCellKey) ?? activeMapData?.grid[0] ?? null;

  const trackedKeywords = (() => {
    const candidates = [
      query,
      ...(packData?.keywordSuggestions ?? []),
      ...storedKeywords,
    ]
      .map((value) => value.trim())
      .filter(Boolean);
    return [...new Set(candidates)].slice(0, 8);
  })();

  const selectedCompetitor = (() => {
    if (!competitorLeaders.length) return null;
    return (
      competitorLeaders.find((row) => (row.placeId || row.title) === selectedCompetitorKey) ??
      competitorLeaders[0]
    );
  })();

  const routeFor = (code: string, fallback: string) =>
    detailsData?.productMatches.find((match) => match.code === code)?.route ??
    packData?.productMatches.find((match) => match.code === code)?.route ??
    fallback;

  const diagnostics: DiagnosticItem[] = (() => {
    const rows: DiagnosticItem[] = [];
    if (!effectiveBusiness || !packData || !rankingEligible) return rows;

    if (metrics) {
      const top3Points = Math.round((metrics.top3Coverage / 100) * metrics.points);
      if (metrics.top3Coverage < 50) {
        rows.push({
          key: 'coverage-high',
          level: 'high',
          label: 'ALTO IMPACTO',
          title: 'Cobertura Top 3 limitada',
          finding: `${top3Points} de ${metrics.points} puntos están en Top 3.`,
          evidence: `GeoGrid LIVE · posición media ${metrics.averageRank ? `#${metrics.averageRank}` : 'sin dato'} · ${metrics.notFound} puntos sin aparecer.`,
          actionCode: 'LOCAL_PACK_RANKING',
          fallbackRoute: '/categorias/local-pack-y-ranking',
        });
      } else if (metrics.top3Coverage < 80) {
        rows.push({
          key: 'coverage-medium',
          level: 'medium',
          label: 'OPORTUNIDAD',
          title: 'Cobertura territorial mejorable',
          finding: `${top3Points} de ${metrics.points} puntos están en Top 3.`,
          evidence: `GeoGrid LIVE · la dirección más débil observada es ${metrics.weakestDirection}.`,
          actionCode: 'LOCAL_PACK_RANKING',
          fallbackRoute: '/categorias/local-pack-y-ranking',
        });
      } else {
        rows.push({
          key: 'coverage-good',
          level: 'good',
          label: 'FORTALEZA',
          title: 'Cobertura territorial fuerte',
          finding: `${top3Points} de ${metrics.points} puntos están en Top 3.`,
          evidence: 'GeoGrid LIVE · no fuerza una recomendación de ranking cuando la cobertura ya es alta.',
        });
      }
    } else if (packData.target?.position !== null && packData.target?.position !== undefined) {
      const position = packData.target.position;
      rows.push({
        key: 'point-rank',
        level: position <= 3 ? 'good' : position <= 10 ? 'medium' : 'high',
        label: position <= 3 ? 'FORTALEZA' : position <= 10 ? 'OPORTUNIDAD' : 'ALTO IMPACTO',
        title: 'Posición desde tu ubicación',
        finding: `El negocio aparece #${position} en el Local Pack observado.`,
        evidence: 'Dato confirmado desde la ubicación base. Ejecuta GeoGrid para saber si se mantiene por territorio.',
        actionCode: position > 3 ? 'LOCAL_PACK_RANKING' : undefined,
        fallbackRoute: position > 3 ? '/categorias/local-pack-y-ranking' : undefined,
      });
    }

    const reviews = effectiveBusiness.reviews;
    const top3Reviews = market?.top3AverageReviews ?? null;
    if (reviews !== null && top3Reviews !== null && top3Reviews > 0) {
      const ratio = reviews / top3Reviews;
      if (ratio < 0.65) {
        rows.push({
          key: 'reviews-high',
          level: 'high',
          label: 'ALTO IMPACTO',
          title: 'Brecha de reseñas',
          finding: `${reviews} reseñas frente a ${top3Reviews} de promedio entre los líderes.`,
          evidence: 'Benchmark del Top 3 observado en el pack competitivo.',
          actionCode: 'REPUTATION',
          fallbackRoute: '/categorias/reputacion-y-resenas',
        });
      } else if (ratio < 0.9) {
        rows.push({
          key: 'reviews-medium',
          level: 'medium',
          label: 'OPORTUNIDAD',
          title: 'Volumen de reseñas por debajo del Top 3',
          finding: `${reviews} reseñas frente a ${top3Reviews} de promedio entre los líderes.`,
          evidence: 'Benchmark del Top 3 observado en el pack competitivo.',
          actionCode: 'REPUTATION',
          fallbackRoute: '/categorias/reputacion-y-resenas',
        });
      } else {
        rows.push({
          key: 'reviews-good',
          level: 'good',
          label: 'FORTALEZA',
          title: 'Reputación competitiva',
          finding: `El volumen de reseñas está cerca o por encima del promedio Top 3 (${top3Reviews}).`,
          evidence: 'Benchmark del Top 3 observado.',
        });
      }
    }

    const rating = effectiveBusiness.rating;
    const top3Rating = market?.top3AverageRating ?? null;
    if (rating !== null && top3Rating !== null) {
      const gap = Math.round((rating - top3Rating) * 10) / 10;
      if (gap <= -0.3) {
        rows.push({
          key: 'rating-medium',
          level: 'medium',
          label: 'OPORTUNIDAD',
          title: 'Valoración por debajo de los líderes',
          finding: `${rating}★ frente a ${top3Rating}★ de promedio Top 3.`,
          evidence: 'Rating visible en Google Maps; no se sustituye un dato ausente por cero.',
          actionCode: 'REPUTATION',
          fallbackRoute: '/categorias/reputacion-y-resenas',
        });
      }
    }

    const profileScore = detailsData?.placeDetails?.visibleSignals.score ?? null;
    if (profileScore !== null && profileScore < 84) {
      rows.push({
        key: 'profile-review',
        level: 'review',
        label: 'REVISIÓN',
        title: 'Señales visibles de la ficha',
        finding: `${profileScore}% de las señales evaluadas fueron visibles en esta consulta.`,
        evidence: 'Señal parcial: no demuestra que la información falte en el GBP completo.',
        actionCode: 'GBP_AUDIT',
        fallbackRoute: '/categorias/google-business-profile',
      });
    }

    return rows.slice(0, 6);
  })();

  const actions: WorkspaceAction[] = (() => {
    const seen = new Set<string>();
    const rows: WorkspaceAction[] = [];
    diagnostics.forEach((item) => {
      if (!item.actionCode || !item.fallbackRoute || item.level === 'good') return;
      const route = routeFor(item.actionCode, item.fallbackRoute);
      if (seen.has(route)) return;
      seen.add(route);
      rows.push({
        key: item.key,
        priority: item.level === 'high' ? 1 : item.level === 'medium' ? 2 : 3,
        title:
          item.actionCode === 'LOCAL_PACK_RANKING'
            ? 'Reforzar visibilidad territorial'
            : item.actionCode === 'REPUTATION'
              ? 'Fortalecer reputación y reseñas'
              : 'Revisar Google Business Profile',
        reason: item.finding,
        evidence: item.evidence,
        route,
        impact: item.level === 'high' ? 'Alto' : 'Medio',
        effort: item.actionCode === 'GBP_AUDIT' ? 'Bajo' : 'Medio',
      });
    });
    return rows.sort((a, b) => a.priority - b.priority);
  })();

  const requestLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Este navegador no expone geolocalización.');
      return;
    }
    setLoading('location');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
        });
        setLoading(null);
      },
      (cause) => {
        setLoading(null);
        setError(
          cause.code === 1
            ? 'Debes permitir la ubicación para ejecutar un análisis local real.'
            : 'No fue posible obtener tu ubicación. Revisa permisos del navegador.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const persistHistory = (entry: HistoryEntry) => {
    setHistory((current) => {
      const next = [entry, ...current.filter((row) => row.id !== entry.id)].slice(0, 12);
      writeJson(HISTORY_KEY, next);
      return next;
    });
  };

  const rememberKeyword = (keyword: string) => {
    const cleaned = keyword.trim();
    if (!cleaned) return;
    setStoredKeywords((current) => {
      const next = [cleaned, ...current.filter((row) => row.toLowerCase() !== cleaned.toLowerCase())].slice(0, 10);
      writeJson(KEYWORDS_KEY, next);
      return next;
    });
  };

  const importDetails = async (
    business: LocalPackBusiness,
    localMarket: LocalPackMarketSummary | null,
    keyword: string,
  ) => {
    if (!location) return null;
    setLoading('details');
    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'details',
        query: keyword,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
        identity: business,
        market: localMarket,
      });
      setDetailsData(response);
      setSelectedBusiness(response.selectedBusiness ?? business);
      return response;
    } finally {
      setLoading(null);
    }
  };

  const runPack = async (
    keyword: string,
    target: string,
    identityHint?: LocalPackBusiness | null,
  ) => {
    const cleaned = keyword.trim();
    if (!location) {
      setError('Primero confirma tu ubicación.');
      return;
    }
    if (!cleaned) {
      setError('Escribe una categoría, servicio o búsqueda local.');
      return;
    }
    setError('');
    setLoading('pack');
    setGridData(null);
    setCompetitorGrid(null);
    setMapMode('target');
    setSelectedCellKey('');
    setDetailsData(null);
    setSelectedBusiness(null);
    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'pack',
        query: cleaned,
        targetName: target.trim() || undefined,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
      });
      setPackData(response);
      setQuery(cleaned);
      rememberKeyword(cleaned);

      if (response.searchInterpretation?.rankingEligible === false) {
        const match = response.directMatch ?? null;
        setTrackedBusiness(match);
        if (match) setTargetName(match.title);
        setActiveTab('overview');
        return;
      }

      const nextBusiness = response.selectedBusiness ?? identityHint ?? trackedBusiness;
      if (nextBusiness) {
        setTrackedBusiness(nextBusiness);
        setSelectedBusiness(response.selectedBusiness ?? nextBusiness);
        setTargetName(nextBusiness.title);
        await importDetails(nextBusiness, response.market, cleaned);
      }

      persistHistory({
        id: `${cleaned.toLowerCase()}::${nextBusiness?.placeId || nextBusiness?.title || target || 'market'}::pack`,
        at: new Date().toISOString(),
        query: cleaned,
        business: nextBusiness?.title || target || 'Mercado local',
        position: response.target?.position ?? null,
        averageRank: null,
        top3Coverage: null,
        top10Coverage: null,
        visibilityScore: null,
      });
      setActiveTab('overview');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible consultar Google Maps.');
    } finally {
      setLoading(null);
    }
  };

  const submitPack = (event: FormEvent) => {
    event.preventDefault();
    void runPack(query, targetName, trackedBusiness);
  };

  const runCompetitiveKeyword = (keyword: string, business: LocalPackBusiness) => {
    setQuery(keyword);
    setTargetName(business.title);
    setTrackedBusiness(business);
    void runPack(keyword, business.title, business);
  };

  const selectPackBusiness = (business: LocalPackBusiness) => {
    setTrackedBusiness(business);
    setSelectedBusiness(business);
    setTargetName(business.title);
    setActiveTab('overview'); // SEOLOCAL_EXECUTIVE_WORKSPACE_ENTRY_FLOW_R2
    void importDetails(business, packData?.market ?? null, query).catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'No fue posible importar la ficha.');
    });
  };

  const runGrid = async () => {
    if (!location || !effectiveBusiness) {
      setError('Selecciona primero el negocio que quieres medir.');
      return;
    }
    if (!rankingEligible) {
      setError('El GeoGrid requiere una categoría o servicio competitivo; una búsqueda por nombre no genera ranking.');
      return;
    }
    setError('');
    setLoading('grid');
    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'grid',
        query,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
        radiusKm,
        identity: effectiveBusiness,
      });
      setGridData(response);
      setMapMode('target');
      const center = response.grid.find((cell) => cell.row === 3 && cell.col === 3) ?? response.grid[0];
      setSelectedCellKey(center ? `${center.row}-${center.col}` : '');
      persistHistory({
        id: `${query.toLowerCase()}::${effectiveBusiness.placeId || effectiveBusiness.title}::grid`,
        at: new Date().toISOString(),
        query,
        business: effectiveBusiness.title,
        position: packData?.target?.position ?? null,
        averageRank: response.metrics?.averageRank ?? null,
        top3Coverage: response.metrics?.top3Coverage ?? null,
        top10Coverage: response.metrics?.top10Coverage ?? null,
        visibilityScore: response.metrics?.visibilityScore ?? null,
      });
      setActiveTab('geogrid');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible generar el GeoGrid.');
    } finally {
      setLoading(null);
    }
  };

  const runCompetitorGrid = async () => {
    if (!location || !selectedCompetitor || !packData) return;
    const identity = packData.localResults.find(
      (business) =>
        (selectedCompetitor.placeId && business.placeId === selectedCompetitor.placeId) ||
        business.title.toLowerCase() === selectedCompetitor.title.toLowerCase(),
    );
    if (!identity) {
      setError('Este competidor no tiene identidad completa en el pack base. No ejecutaremos un GeoGrid incompleto.');
      return;
    }
    if (!window.confirm(`Comparar el GeoGrid de ${identity.title} ejecutará otras 25 búsquedas LIVE. ¿Continuar?`)) return;
    setError('');
    setLoading('competitor-grid');
    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'grid',
        query,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
        radiusKm,
        identity,
      });
      setCompetitorGrid(response);
      setMapMode('competitor');
      const center = response.grid.find((cell) => cell.row === 3 && cell.col === 3) ?? response.grid[0];
      setSelectedCellKey(center ? `${center.row}-${center.col}` : '');
      setActiveTab('geogrid');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible generar el GeoGrid del competidor.');
    } finally {
      setLoading(null);
    }
  };

  const addKeyword = () => {
    const value = window.prompt('Añade una keyword competitiva para este negocio:');
    if (!value?.trim()) return;
    rememberKeyword(value);
    setQuery(value.trim());
  };

  const toggleAction = (key: string) => {
    setCompletedActions((current) => {
      const next = current.includes(key) ? current.filter((row) => row !== key) : [...current, key];
      writeJson(ACTIONS_KEY, next);
      return next;
    });
  };

  const currentPosition = packData?.target?.position ?? null;
  const averageRank = metrics?.averageRank ?? null;
  const top3Coverage = metrics?.top3Coverage ?? null;
  const top10Coverage = metrics?.top10Coverage ?? null;
  const visibilityScore = metrics?.visibilityScore ?? null;
  const top3Points = metrics ? Math.round((metrics.top3Coverage / 100) * metrics.points) : null;
  const top10Points = metrics ? Math.round((metrics.top10Coverage / 100) * metrics.points) : null;

  const comparisonRows = selectedCompetitor && metrics
    ? [
        ['Posición media', averageRank ? `#${averageRank}` : '—', `#${selectedCompetitor.averagePosition}`],
        ['Top 3 territorial', `${top3Points ?? 0}/${metrics.points}`, `${selectedCompetitor.top3Appearances}/${metrics.points}`],
        ['Apariciones competitivas', `${top10Points ?? 0}/${metrics.points}`, `${selectedCompetitor.appearances}/${metrics.points}`],
        ['Reseñas', `${effectiveBusiness?.reviews ?? '—'}`, `${selectedCompetitor.reviews ?? '—'}`],
        ['Rating', `${effectiveBusiness?.rating ?? '—'}★`, `${selectedCompetitor.rating ?? '—'}★`],
      ]
    : [];

  return (
    <div data-executive-workspace-version={EXECUTIVE_WORKSPACE_VERSION} className="min-h-screen bg-[#f4f7fb] py-6">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-3 inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Marketplace
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#102f46] to-[#0074E0] text-sm font-black text-white">
                {effectiveBusiness ? effectiveBusiness.title.slice(0, 2).toUpperCase() : 'LV'}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D32323]">Executive Workspace</span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700">{EXECUTIVE_WORKSPACE_VERSION}</span>
                </div>
                <h1 className="mt-1 truncate text-xl font-black text-slate-950">
                  {(effectiveBusiness?.title ?? targetName) || 'Local Visibility Intelligence'}
                </h1>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {query || 'Define una búsqueda competitiva'} · {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'ubicación pendiente'}
                </p>
              </div>
            </div>
            <div className="xl:ml-auto">
              <form onSubmit={submitPack} className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_minmax(180px,0.8fr)_auto]">
                <label className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Search className="h-4 w-4 text-[#D32323]" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Keyword competitiva" className="w-full bg-transparent px-2 py-2.5 text-xs font-bold outline-none" />
                </label>
                <label className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Store className="h-4 w-4 text-[#0074E0]" />
                  <input value={targetName} onChange={(event) => setTargetName(event.target.value)} placeholder="Negocio objetivo" className="w-full bg-transparent px-2 py-2.5 text-xs font-bold outline-none" />
                </label>
                <button type="submit" disabled={Boolean(loading)} className="rounded-xl bg-[#D32323] px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
                  <LoadingButton active={loading === 'pack' || loading === 'details'}>Analizar</LoadingButton>
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={requestLocation} disabled={Boolean(loading)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black ${location ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
              {loading === 'location' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
              {location ? 'Ubicación lista' : 'Usar mi ubicación'}
            </button>
            {location ? <span className="text-[10px] text-slate-400">±{location.accuracyMeters ?? '?'} m</span> : null}
            {rankingEligible && effectiveBusiness ? (
              <button type="button" onClick={() => void runGrid()} disabled={Boolean(loading)} className="inline-flex items-center gap-2 rounded-xl bg-[#0074E0] px-3 py-2 text-[10px] font-black text-white disabled:opacity-60">
                <LoadingButton active={loading === 'grid'}><Crosshair className="h-3.5 w-3.5" /> Ejecutar GeoGrid 5×5</LoadingButton>
              </button>
            ) : null}
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Google Maps LIVE
            </span>
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}

        <nav className="sticky top-[58px] z-30 mt-4 flex gap-2 overflow-x-auto bg-[#f4f7fb]/95 py-3 backdrop-blur">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-black transition ${activeTab === tab.id ? 'border-[#102f46] bg-[#102f46] text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'}`}>
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            );
          })}
        </nav>

        {businessIntentMatch ? (
          <Panel className="mb-4 border-blue-200 bg-blue-50/50">
            <div className="p-5 md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <SafeImage business={businessIntentMatch} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D32323]">Búsqueda por nombre</span>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700">Ranking no aplicable</span>
                    </div>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{businessIntentMatch.title}</h2>
                    <p className="mt-1 text-xs text-slate-600">Identificamos la ficha, pero no convertimos una búsqueda de marca en un #1 artificial.</p>
                  </div>
                </div>
                <div className="lg:max-w-[520px]">
                  <p className="text-xs font-black text-slate-800">Elige cómo te buscaría un cliente nuevo:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(packData?.keywordSuggestions ?? []).map((keyword) => (
                      <button key={keyword} type="button" onClick={() => runCompetitiveKeyword(keyword, businessIntentMatch)} className="rounded-xl bg-[#102f46] px-3 py-2 text-[10px] font-black text-white">
                        Analizar “{keyword}” <ChevronRight className="ml-1 inline h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        ) : null}

        {activeTab === 'overview' ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard label={metrics ? 'Posición media' : 'Posición base'} value={metrics ? (averageRank ? `#${averageRank}` : 'NF') : currentPosition ? `#${currentPosition}` : '—'} hint={metrics ? `${metrics.points} puntos del GeoGrid` : 'desde tu ubicación'} tone="blue" />
              <KpiCard label="Top 3 coverage" value={top3Coverage !== null ? `${top3Coverage}%` : '—'} hint={top3Points !== null && metrics ? `${top3Points}/${metrics.points} puntos` : 'ejecuta GeoGrid'} tone={top3Coverage !== null && top3Coverage >= 50 ? 'green' : 'slate'} />
              <KpiCard label="Top 10 coverage" value={top10Coverage !== null ? `${top10Coverage}%` : '—'} hint={top10Points !== null && metrics ? `${top10Points}/${metrics.points} puntos` : 'ejecuta GeoGrid'} />
              <KpiCard label="Visibility Score" value={visibilityScore !== null ? `${visibilityScore}/100` : '—'} hint="score calculado desde posiciones reales" tone="green" />
              <KpiCard label="Sin aparecer" value={metrics ? `${metrics.notFound}/${metrics.points}` : '—'} hint={metrics ? `zona débil: ${metrics.weakestDirection}` : 'ejecuta GeoGrid'} tone={metrics && metrics.notFound > 0 ? 'amber' : 'slate'} />
            </div>

            {!packData ? (
              <Panel>
                <div className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
                  <div className="rounded-3xl bg-gradient-to-br from-[#102f46] via-[#0f5277] to-[#0074E0] p-7 text-white">
                    <Radar className="h-8 w-8" />
                    <h2 className="mt-5 text-3xl font-black tracking-tight">Executive Workspace</h2>
                    <p className="mt-3 text-sm leading-6 text-blue-50">Empieza con una keyword competitiva y un negocio. Después podrás recorrer Overview, GeoGrid, Competidores, SERP Local, Diagnóstico y Acciones sin perder contexto.</p>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D32323]">LISTO PARA ANALIZAR</span>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">1. Confirma ubicación · 2. Escribe keyword · 3. Ejecuta análisis</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">Si llegaste desde el scanner del Home, los campos ya vienen precargados. Este workspace no inventa rankings cuando la consulta es el nombre del negocio.</p>
                  </div>
                </div>
              </Panel>
            ) : rankingEligible ? (
              <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <Panel>
                    <PanelHeading kicker="KEYWORDS" title="Radar competitivo" text="Historial local del navegador + sugerencias LIVE." />
                    <div className="p-4">
                      <div className="space-y-2">
                        {trackedKeywords.map((keyword) => (
                          <button key={keyword} type="button" onClick={() => void runPack(keyword, effectiveBusiness?.title ?? targetName, effectiveBusiness)} className={`w-full rounded-xl border px-3 py-2.5 text-left text-[10px] font-black ${keyword === query ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                            {keyword}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={addKeyword} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-[10px] font-black text-slate-700"><Plus className="h-3.5 w-3.5" /> Añadir keyword</button>
                    </div>
                  </Panel>
                  <Panel>
                    <PanelHeading kicker="HISTORIAL" title="Últimas corridas" text="Persistencia local en este navegador." />
                    <div className="space-y-2 p-4">
                      {history.length ? history.slice(0, 5).map((entry) => (
                        <button key={`${entry.id}-${entry.at}`} type="button" onClick={() => { setQuery(entry.query); setTargetName(entry.business); }} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left">
                          <strong className="block truncate text-[10px] text-slate-800">{entry.query}</strong>
                          <span className="mt-1 block text-[9px] text-slate-400">{new Date(entry.at).toLocaleString()} · {entry.averageRank ? `Avg #${entry.averageRank}` : entry.position ? `#${entry.position}` : 'mercado'}</span>
                        </button>
                      )) : <p className="text-[10px] leading-5 text-slate-400">Todavía no hay corridas guardadas.</p>}
                    </div>
                  </Panel>
                </div>

                <div className="space-y-4">
                  <Panel>
                    <PanelHeading kicker="GEOGRID ACTUAL" title="Territorio de visibilidad" text={gridData ? 'Haz clic en un punto para inspeccionar su Top 3 observado.' : 'Ejecuta el GeoGrid para convertir el pack en una lectura territorial.'} action={gridData ? <button type="button" onClick={() => setActiveTab('geogrid')} className="text-[10px] font-black text-[#0074E0]">Abrir mapa completo →</button> : null} />
                    <div className="p-4">
                      {gridData ? (
                        <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-200">
                          <MapContainer center={[gridData.origin.lat, gridData.origin.lng]} zoom={13} className="h-full w-full">
                            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <FitWorkspaceMap data={gridData} />
                            {gridData.grid.map((cell) => (
                              <Marker key={`overview-${cell.row}-${cell.col}`} position={[cell.lat, cell.lng]} icon={gridIcon(cell.rank)} eventHandlers={{ click: () => setSelectedCellKey(`${cell.row}-${cell.col}`) }}>
                                <Popup>Tu posición: {cell.rank === null ? 'NF' : `#${cell.rank}`}<br />{cell.distanceKm.toFixed(2)} km · {cell.bearing}</Popup>
                              </Marker>
                            ))}
                            {gridData.selectedBusiness && gridData.selectedBusiness.lat !== null && gridData.selectedBusiness.lng !== null ? <Marker position={[gridData.selectedBusiness.lat, gridData.selectedBusiness.lng]} icon={gridIcon(null, true)}><Popup>{gridData.selectedBusiness.title}</Popup></Marker> : null}
                          </MapContainer>
                        </div>
                      ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                          <Crosshair className="h-10 w-10 text-slate-300" />
                          <h4 className="mt-4 text-lg font-black text-slate-800">GeoGrid todavía no ejecutado</h4>
                          <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">El Local Pack está listo. El GeoGrid requiere 25 búsquedas LIVE y mostrará posiciones por zona, competidores por punto y líderes territoriales.</p>
                          <button type="button" onClick={() => void runGrid()} className="mt-4 rounded-xl bg-[#0074E0] px-4 py-2.5 text-[11px] font-black text-white">Ejecutar GeoGrid 5×5</button>
                        </div>
                      )}
                    </div>
                  </Panel>

                  <Panel>
                    <PanelHeading kicker="COMPETITIVE LANDSCAPE" title="Quién domina realmente el área" text={competitorLeaders.length ? 'Líderes agregados desde los mismos 25 puntos del GeoGrid.' : 'Mientras no haya GeoGrid, usa el pack base como referencia competitiva.'} action={<button type="button" onClick={() => setActiveTab('competitors')} className="text-[10px] font-black text-[#0074E0]">Analizar competidores →</button>} />
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-[10px]">
                        <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Negocio</th><th className="px-3 py-3">Avg</th><th className="px-3 py-3">Top 3</th><th className="px-3 py-3">Apariciones</th><th className="px-3 py-3">Reviews</th><th className="px-3 py-3">Rating</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {metrics && effectiveBusiness ? <tr className="bg-blue-50/50"><td className="px-4 py-3 font-black text-slate-900">{effectiveBusiness.title}<span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-[8px] text-blue-700">TARGET</span></td><td className="px-3 py-3">{averageRank ? `#${averageRank}` : '—'}</td><td className="px-3 py-3">{top3Points}/{metrics.points}</td><td className="px-3 py-3">{top10Points}/{metrics.points}</td><td className="px-3 py-3">{effectiveBusiness.reviews ?? '—'}</td><td className="px-3 py-3">{effectiveBusiness.rating ?? '—'}★</td></tr> : null}
                          {(competitorLeaders.length ? competitorLeaders : packData.localResults.filter((row) => row.placeId !== effectiveBusiness?.placeId).slice(0, 5).map((row) => ({ title: row.title, type: row.type, placeId: row.placeId, rating: row.rating, reviews: row.reviews, appearances: 0, top3Appearances: row.position <= 3 ? 1 : 0, averagePosition: row.position, bestPosition: row.position }))).map((competitor) => (
                            <tr key={competitor.placeId || competitor.title}><td className="px-4 py-3 font-bold text-slate-800">{competitor.title}<span className="block text-[8px] font-normal text-slate-400">{competitor.type || 'Negocio local'}</span></td><td className="px-3 py-3">#{competitor.averagePosition}</td><td className="px-3 py-3">{competitorLeaders.length ? `${competitor.top3Appearances}/${metrics?.points ?? 25}` : competitor.top3Appearances ? 'Top 3' : '—'}</td><td className="px-3 py-3">{competitorLeaders.length ? `${competitor.appearances}/${metrics?.points ?? 25}` : 'pack'}</td><td className="px-3 py-3">{competitor.reviews ?? '—'}</td><td className="px-3 py-3">{competitor.rating ?? '—'}★</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </div>

                <div className="space-y-4">
                  <Panel>
                    <PanelHeading kicker="PUNTO SELECCIONADO" title="SERP Local" text={selectedCell ? `Punto ${selectedCell.row}-${selectedCell.col} · ${selectedCell.bearing}` : 'Selecciona un punto del GeoGrid.'} />
                    <div className="p-4">
                      {selectedCell ? (
                        <>
                          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><span className="text-[9px] font-black uppercase text-slate-400">Tu posición</span><strong className="block text-xl text-slate-900">{selectedCell.rank === null ? 'NF' : `#${selectedCell.rank}`}</strong></div><span className="text-[10px] text-slate-500">{selectedCell.distanceKm.toFixed(2)} km · {selectedCell.bearing}</span></div>
                          <div className="mt-3 space-y-2">{selectedCell.topCompetitors.slice(0, 3).map((competitor) => <div key={`${selectedCell.row}-${selectedCell.col}-${competitor.position}-${competitor.title}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#102f46] text-[9px] font-black text-white">#{competitor.position}</span><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-slate-800">{competitor.title}</strong><span className="text-[8px] text-slate-400">{competitor.rating ?? '—'}★ · {competitor.reviews ?? '—'} reseñas</span></div></div>)}</div>
                          <button type="button" onClick={() => setActiveTab('serp')} className="mt-3 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-[10px] font-black text-slate-700">Abrir SERP Local</button>
                        </>
                      ) : <p className="text-xs leading-5 text-slate-400">Ejecuta el GeoGrid y selecciona un punto para ver su Top 3 observado.</p>}
                    </div>
                  </Panel>
                  <Panel>
                    <PanelHeading title="Visibility Score explicado" text="No es una cifra decorativa: deriva de las posiciones observadas en los puntos." />
                    <div className="p-4">
                      {metrics ? <><div className="flex items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[10px] border-emerald-100 text-xl font-black text-slate-900">{metrics.visibilityScore}</div><div className="space-y-2 text-[9px] text-slate-500"><p><b className="text-slate-800">Top 3:</b> {top3Points}/{metrics.points}</p><p><b className="text-slate-800">Top 10:</b> {top10Points}/{metrics.points}</p><p><b className="text-slate-800">Posición media:</b> {metrics.averageRank ? `#${metrics.averageRank}` : '—'}</p><p><b className="text-slate-800">NF:</b> {metrics.notFound}/{metrics.points}</p></div></div><p className="mt-3 text-[9px] leading-5 text-slate-400">El backend calcula el score a partir de la posición de cada punto. Interprétalo junto con cobertura y NF.</p></> : <p className="text-xs text-slate-400">Disponible después del GeoGrid.</p>}
                    </div>
                  </Panel>
                  <Panel>
                    <PanelHeading title="Acción prioritaria" />
                    <div className="p-4">{actions[0] ? <><span className="rounded-full bg-red-50 px-2 py-1 text-[8px] font-black text-red-700">PRIORIDAD #{actions[0].priority}</span><h4 className="mt-2 text-sm font-black text-slate-900">{actions[0].title}</h4><p className="mt-1 text-[9px] leading-5 text-slate-500">{actions[0].reason}</p><button type="button" onClick={() => setActiveTab('actions')} className="mt-3 w-full rounded-xl bg-[#D32323] px-3 py-2.5 text-[10px] font-black text-white">Abrir plan de acción</button></> : <div className="rounded-xl bg-emerald-50 p-3 text-[10px] leading-5 text-emerald-700"><CheckCircle2 className="mb-2 h-4 w-4" />No hay una intervención prioritaria confirmada con los datos disponibles.</div>}</div>
                  </Panel>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'geogrid' ? (
          <div className="space-y-4">
            <Panel>
              <PanelHeading kicker="GEOGRID WORKSPACE" title="Mapa territorial detallado" text="El mapa usa posiciones LIVE. Los competidores de cada punto provienen de la misma respuesta, sin consultas adicionales." action={<div className="flex flex-wrap gap-2"><select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black"><option value={1.5}>Radio 1.5 km</option><option value={2.5}>Radio 2.5 km</option><option value={5}>Radio 5 km</option></select><button type="button" onClick={() => void runGrid()} disabled={Boolean(loading) || !effectiveBusiness} className="rounded-xl bg-[#0074E0] px-3 py-2 text-[10px] font-black text-white disabled:opacity-50"><LoadingButton active={loading === 'grid'}><RefreshCcw className="h-3.5 w-3.5" /> Ejecutar target</LoadingButton></button></div>} />
            </Panel>
            {gridData ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px]">
                <Panel>
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
                    <button type="button" onClick={() => setMapMode('target')} className={`rounded-xl px-3 py-2 text-[10px] font-black ${mapMode === 'target' ? 'bg-[#102f46] text-white' : 'bg-slate-100 text-slate-600'}`}>Target · {effectiveBusiness?.title}</button>
                    {competitorGrid ? <button type="button" onClick={() => setMapMode('competitor')} className={`rounded-xl px-3 py-2 text-[10px] font-black ${mapMode === 'competitor' ? 'bg-[#D32323] text-white' : 'bg-slate-100 text-slate-600'}`}>Competidor · {competitorGrid.selectedBusiness?.title}</button> : null}
                    <div className="ml-auto flex items-center gap-3 text-[9px] text-slate-500"><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />1–3</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" />4–10</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-orange-500" />11–20</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-600" />NF</span></div>
                  </div>
                  <div className="h-[650px]">
                    {activeMapData ? <MapContainer center={[activeMapData.origin.lat, activeMapData.origin.lng]} zoom={13} className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitWorkspaceMap data={activeMapData} />{activeMapData.grid.map((cell) => <Marker key={`${mapMode}-${cell.row}-${cell.col}`} position={[cell.lat, cell.lng]} icon={gridIcon(cell.rank)} eventHandlers={{ click: () => setSelectedCellKey(`${cell.row}-${cell.col}`) }}><Popup><strong>{activeMapData.selectedBusiness?.title}</strong><br />Posición: {cell.rank === null ? 'NF' : `#${cell.rank}`}<br />{cell.distanceKm.toFixed(2)} km · {cell.bearing}{cell.topCompetitors.length ? <><br /><br /><strong>Top 3 observado</strong>{cell.topCompetitors.slice(0, 3).map((competitor) => <span key={`${cell.row}-${cell.col}-${competitor.position}-${competitor.title}`} className="block">#{competitor.position} {competitor.title}</span>)}</> : null}</Popup></Marker>)}{activeMapData.selectedBusiness && activeMapData.selectedBusiness.lat !== null && activeMapData.selectedBusiness.lng !== null ? <Marker position={[activeMapData.selectedBusiness.lat, activeMapData.selectedBusiness.lng]} icon={gridIcon(null, true)}><Popup>{activeMapData.selectedBusiness.title}</Popup></Marker> : null}</MapContainer> : null}
                  </div>
                </Panel>
                <div className="space-y-4">
                  <Panel><PanelHeading kicker="PUNTO SELECCIONADO" title={selectedCell ? `${selectedCell.row}-${selectedCell.col} · ${selectedCell.bearing}` : 'Selecciona un punto'} />{selectedCell ? <div className="p-4"><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span className="text-xs font-black text-slate-700">Posición del target</span><strong className="text-2xl text-slate-950">{selectedCell.rank === null ? 'NF' : `#${selectedCell.rank}`}</strong></div><div className="mt-3 space-y-2">{selectedCell.topCompetitors.slice(0, 3).map((competitor) => <div key={`grid-side-${competitor.position}-${competitor.title}`} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#102f46] text-[8px] font-black text-white">#{competitor.position}</span><strong className="min-w-0 flex-1 truncate text-[10px] text-slate-800">{competitor.title}</strong></div><span className="mt-1 block text-[8px] text-slate-400">{competitor.rating ?? '—'}★ · {competitor.reviews ?? '—'} reseñas</span></div>)}</div><button type="button" onClick={() => setActiveTab('serp')} className="mt-3 w-full rounded-xl bg-slate-100 px-3 py-2.5 text-[10px] font-black">Investigar SERP Local</button></div> : <div className="p-4 text-xs text-slate-400">Selecciona un punto.</div>}</Panel>
                  <Panel><PanelHeading kicker="LECTURA TERRITORIAL" title="Dónde se rompe la cobertura" /><div className="grid grid-cols-2 gap-2 p-4"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><span className="text-[8px] font-black text-emerald-700">TOP 3</span><strong className="mt-1 block text-lg">{metrics?.top3Coverage ?? 0}%</strong></div><div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><span className="text-[8px] font-black text-blue-700">TOP 10</span><strong className="mt-1 block text-lg">{metrics?.top10Coverage ?? 0}%</strong></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><span className="text-[8px] font-black text-amber-700">DÉBIL</span><strong className="mt-1 block text-sm">{metrics?.weakestDirection ?? '—'}</strong></div><div className="rounded-xl border border-red-100 bg-red-50 p-3"><span className="text-[8px] font-black text-red-700">NF</span><strong className="mt-1 block text-lg">{metrics?.notFound ?? 0}</strong></div></div></Panel>
                </div>
              </div>
            ) : <Panel><div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><Layers3 className="h-10 w-10 text-slate-300" /><h3 className="mt-4 text-xl font-black text-slate-800">GeoGrid no ejecutado</h3><p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">Este tab es funcional, pero deliberadamente no inventa un mapa. Ejecuta el GeoGrid cuando quieras consumir las 25 búsquedas LIVE.</p><button type="button" onClick={() => void runGrid()} disabled={!effectiveBusiness || !rankingEligible} className="mt-4 rounded-xl bg-[#0074E0] px-4 py-2.5 text-[11px] font-black text-white disabled:opacity-50">Ejecutar GeoGrid</button></div></Panel>}
          </div>
        ) : null}

        {activeTab === 'competitors' ? (
          <div className="space-y-4">
            {!effectiveBusiness && packData?.localResults.length ? (
              <Panel>
                <PanelHeading
                  kicker="PASO 1 · ELIGE TU TARGET"
                  title="¿Qué negocio quieres medir?"
                  text="La búsqueda competitiva ya está lista. Selecciona tu negocio para activar Overview, GeoGrid, diagnóstico y comparación territorial."
                />
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {packData.localResults.slice(0, 9).map((business) => (
                    <article key={`target-choice-${business.placeId || `${business.position}-${business.title}`}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#102f46] text-[10px] font-black text-white">#{business.position}</span>
                        <SafeImage business={business} />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-black text-slate-900">{business.title}</h4>
                          <p className="truncate text-[9px] text-slate-400">{business.type || 'Categoría no visible'}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <Stars rating={business.rating} />
                            <span className="text-[9px] text-slate-400">{business.reviews ?? '—'} reseñas</span>
                          </div>
                          <button type="button" onClick={() => selectPackBusiness(business)} className="mt-2 w-full rounded-lg bg-[#0074E0] px-2 py-2 text-[9px] font-black text-white">
                            Medir este negocio
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            ) : null}
            {competitorLeaders.length ? (
              <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                <Panel><PanelHeading kicker="COMPETIDORES TERRITORIALES" title="Quién aparece con más fuerza" text="Agregado desde los mismos puntos del GeoGrid." /><div className="divide-y divide-slate-100">{competitorLeaders.map((competitor, index) => { const key = competitor.placeId || competitor.title; const selected = selectedCompetitor ? (selectedCompetitor.placeId || selectedCompetitor.title) === key : index === 0; return <button key={key} type="button" onClick={() => setSelectedCompetitorKey(key)} className={`grid w-full grid-cols-[34px_minmax(0,1fr)_55px_55px] items-center gap-2 p-3 text-left ${selected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-700">{index + 1}</span><span className="min-w-0"><strong className="block truncate text-[10px] text-slate-800">{competitor.title}</strong><small className="block truncate text-[8px] text-slate-400">{competitor.type || 'Negocio local'}</small></span><span className="text-right"><b className="block text-[10px]">#{competitor.averagePosition}</b><small className="text-[8px] text-slate-400">Avg</small></span><span className="text-right"><b className="block text-[10px]">{competitor.top3Appearances}</b><small className="text-[8px] text-slate-400">Top3</small></span></button>; })}</div></Panel>
                <Panel><PanelHeading kicker="COMPARACIÓN" title={selectedCompetitor?.title ?? 'Selecciona un competidor'} text="Target vs rival con métricas observadas; no inventa campos ausentes." action={selectedCompetitor ? <button type="button" onClick={() => void runCompetitorGrid()} disabled={Boolean(loading)} className="rounded-xl bg-[#D32323] px-3 py-2 text-[10px] font-black text-white disabled:opacity-50"><LoadingButton active={loading === 'competitor-grid'}>Ver su GeoGrid</LoadingButton></button> : null} /><div className="p-5">{selectedCompetitor && metrics ? <><div className="grid grid-cols-[1fr_46px_1fr] items-center gap-3"><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><span className="text-[9px] font-black text-blue-700">TARGET</span><h4 className="mt-1 truncate text-sm font-black text-slate-900">{effectiveBusiness?.title}</h4><strong className="mt-2 block text-3xl">{averageRank ? `#${averageRank}` : '—'}</strong><span className="text-[9px] text-slate-400">posición media</span></div><div className="text-center text-xs font-black text-slate-400">VS</div><div className="rounded-2xl border border-red-200 bg-red-50 p-4"><span className="text-[9px] font-black text-red-700">RIVAL</span><h4 className="mt-1 truncate text-sm font-black text-slate-900">{selectedCompetitor.title}</h4><strong className="mt-2 block text-3xl">#{selectedCompetitor.averagePosition}</strong><span className="text-[9px] text-slate-400">posición media</span></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-[10px]"><thead className="bg-slate-50 text-[8px] uppercase text-slate-400"><tr><th className="px-3 py-2">Métrica</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Rival</th></tr></thead><tbody className="divide-y divide-slate-100">{comparisonRows.map(([label, target, rival]) => <tr key={label}><td className="px-3 py-2 font-bold">{label}</td><td className="px-3 py-2">{target}</td><td className="px-3 py-2">{rival}</td></tr>)}</tbody></table></div><p className="mt-3 text-[9px] leading-5 text-slate-400">“Ver su GeoGrid” es una acción LIVE real y pide confirmación porque consume otras 25 búsquedas.</p></> : null}</div></Panel>
              </div>
            ) : (
              <Panel><div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center"><Trophy className="h-10 w-10 text-slate-300" /><h3 className="mt-4 text-xl font-black text-slate-800">Competencia territorial pendiente</h3><p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">El Local Pack ya permite ver candidatos, pero el ranking territorial de competidores se calcula al ejecutar GeoGrid.</p><button type="button" onClick={() => void runGrid()} disabled={!effectiveBusiness || !rankingEligible} className="mt-4 rounded-xl bg-[#0074E0] px-4 py-2.5 text-[11px] font-black text-white disabled:opacity-50">Generar competencia territorial</button></div></Panel>
            )}
            {packData?.localResults.length ? <Panel><PanelHeading kicker="PACK BASE" title={`Resultados para “${packData.query}”`} text="Sirven para seleccionar target y conservar identidades completas de competidores." /><div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{packData.localResults.slice(0, 10).map((business) => <article key={business.placeId || `${business.position}-${business.title}`} className={`rounded-2xl border p-3 ${business.placeId === effectiveBusiness?.placeId ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200'}`}><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#102f46] text-[10px] font-black text-white">#{business.position}</span><SafeImage business={business} /><div className="min-w-0 flex-1"><h4 className="truncate text-xs font-black">{business.title}</h4><p className="truncate text-[9px] text-slate-400">{business.type || 'Categoría no visible'}</p><div className="mt-2 flex items-center justify-between"><Stars rating={business.rating} /><span className="text-[9px] text-slate-400">{business.reviews ?? '—'} reseñas</span></div><button type="button" onClick={() => selectPackBusiness(business)} className="mt-2 w-full rounded-lg bg-slate-100 px-2 py-2 text-[9px] font-black text-slate-700">{business.placeId === effectiveBusiness?.placeId ? 'Target actual' : 'Usar como target'}</button></div></div></article>)}</div></Panel> : null}
          </div>
        ) : null}

        {activeTab === 'serp' ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Panel><PanelHeading kicker="SERP LOCAL · UBICACIÓN BASE" title={packData ? `Resultados observados para “${packData.query}”` : 'Sin resultados todavía'} text="Este listado corresponde a la consulta base. Para puntos GeoGrid solo mostramos el Top 3 realmente capturado por el backend." action={packData?.providerSearchUrl ? <a href={packData.providerSearchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-black text-[#0074E0]">Abrir Google Maps <ExternalLink className="h-3 w-3" /></a> : null} />{packData?.localResults.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[10px]"><thead className="bg-slate-50 text-[8px] uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">#</th><th className="px-3 py-3">Negocio</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Reseñas</th><th className="px-3 py-3">Categoría</th><th className="px-3 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{packData.localResults.slice(0, 20).map((business) => <tr key={`serp-base-${business.placeId || business.title}`} className={business.placeId === effectiveBusiness?.placeId ? 'bg-blue-50/50' : ''}><td className="px-4 py-3 font-black">#{business.position}</td><td className="px-3 py-3 font-bold">{business.title}{business.placeId === effectiveBusiness?.placeId ? <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-[8px] text-blue-700">TARGET</span> : null}</td><td className="px-3 py-3">{business.rating ?? '—'}★</td><td className="px-3 py-3">{business.reviews ?? '—'}</td><td className="px-3 py-3">{business.type || '—'}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[8px] font-black ${business.position <= 3 ? 'bg-emerald-50 text-emerald-700' : business.position <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{business.position <= 3 ? 'Top 3' : business.position <= 10 ? 'Top 10' : 'Fuera Top 10'}</span></td></tr>)}</tbody></table></div> : <div className="p-6 text-xs text-slate-400">Ejecuta una búsqueda competitiva para ver el SERP local.</div>}</Panel>
              {selectedCell ? <Panel><PanelHeading kicker="PUNTO GEOGRID" title={`${selectedCell.row}-${selectedCell.col} · ${selectedCell.bearing}`} text={`Desde este punto el target aparece ${selectedCell.rank === null ? 'fuera del rango medido' : `#${selectedCell.rank}`}.`} /><div className="grid gap-3 p-4 md:grid-cols-3">{selectedCell.topCompetitors.slice(0, 3).map((competitor) => <div key={`point-serp-${competitor.position}-${competitor.title}`} className="rounded-2xl border border-slate-200 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102f46] text-[10px] font-black text-white">#{competitor.position}</span><h4 className="mt-3 text-xs font-black text-slate-900">{competitor.title}</h4><p className="mt-1 text-[9px] text-slate-400">{competitor.rating ?? '—'}★ · {competitor.reviews ?? '—'} reseñas</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-600">{competitor.type || 'Negocio local'}</span></div>)}</div></Panel> : null}
            </div>
            <div className="space-y-4">
              <Panel><PanelHeading title="Punto activo" /><div className="p-4">{selectedCell ? <><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><span className="text-[8px] font-black uppercase text-slate-400">Target</span><strong className="mt-1 block text-sm">{activeMapData?.selectedBusiness?.title ?? effectiveBusiness?.title}</strong></div><strong className="text-2xl">{selectedCell.rank === null ? 'NF' : `#${selectedCell.rank}`}</strong></div><p className="mt-3 text-[9px] leading-5 text-slate-400">{selectedCell.distanceKm.toFixed(2)} km · {selectedCell.bearing}. Top 3 capturado desde la misma consulta del GeoGrid.</p></> : <p className="text-xs text-slate-400">Selecciona un punto en GeoGrid.</p>}</div></Panel>
              <Panel><PanelHeading title="Interpretación" /><div className="p-4 text-[10px] leading-5 text-slate-600"><CircleHelp className="mb-2 h-4 w-4 text-[#0074E0]" />No mostramos un Top 20 ficticio por punto. El backend V1.4 conserva el Top 3 observado de cada celda y el ranking del target.</div></Panel>
            </div>
          </div>
        ) : null}

        {activeTab === 'diagnosis' ? (
          <div className="space-y-4">
            <Panel><PanelHeading kicker="DIAGNÓSTICO EXPLICABLE" title="Por qué estás ganando o perdiendo visibilidad" text="Separamos dato confirmado, señal parcial y fortaleza. No rellenamos campos ausentes con cero." /><div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">{diagnostics.length ? diagnostics.map((item) => <article key={item.key} className="rounded-2xl border border-slate-200 p-4"><span className={`rounded-full px-2 py-1 text-[8px] font-black ${item.level === 'high' ? 'bg-red-50 text-red-700' : item.level === 'medium' ? 'bg-amber-50 text-amber-700' : item.level === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{item.label}</span><h4 className="mt-3 text-xs font-black text-slate-900">{item.title}</h4><p className="mt-2 text-[10px] leading-5 text-slate-600">{item.finding}</p><div className="mt-3 border-t border-dashed border-slate-200 pt-3 text-[9px] leading-5 text-slate-400"><b className="text-slate-600">Evidencia:</b> {item.evidence}</div></article>) : <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-xs text-slate-400">Selecciona un negocio competitivo y ejecuta al menos el Local Pack para generar diagnóstico.</div>}</div></Panel>
            <div className="grid gap-4 lg:grid-cols-2"><Panel><PanelHeading kicker="CAUSALIDAD" title="Qué podemos defender" /><div className="p-5 text-[10px] leading-6 text-slate-600"><p><b>Observamos:</b> posiciones, cobertura, reviews, rating, categorías públicas y competidores de cada punto.</p><p className="mt-2"><b>Inferimos:</b> dónde existe una brecha competitiva que merece intervención.</p><p className="mt-2"><b>No afirmamos:</b> que una sola señal sea la causa absoluta del ranking.</p></div></Panel><Panel><PanelHeading kicker="PRÓXIMO PASO" title="Convertir evidencia en ejecución" /><div className="p-5"><p className="text-[10px] leading-5 text-slate-600">Las acciones comerciales aparecen solo cuando una brecha tiene soporte en los datos observados.</p><button type="button" onClick={() => setActiveTab('actions')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D32323] px-4 py-2.5 text-[10px] font-black text-white">Abrir acciones <ArrowRight className="h-3.5 w-3.5" /></button></div></Panel></div>
          </div>
        ) : null}

        {activeTab === 'actions' ? (
          <div className="space-y-4">
            <Panel><PanelHeading kicker="PLAN PRIORIZADO" title="Acciones recomendadas" text="Cada acción se deriva de una evidencia concreta. Puedes marcarla como completada localmente o abrir la solución correspondiente." /><div className="divide-y divide-slate-100">{actions.length ? actions.map((action) => { const done = completedActions.includes(action.key); return <article key={action.key} className={`grid gap-4 p-5 lg:grid-cols-[44px_minmax(0,1fr)_180px] lg:items-center ${done ? 'bg-emerald-50/40 opacity-70' : ''}`}><button type="button" onClick={() => toggleAction(action.key)} className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${done ? 'bg-emerald-600 text-white' : 'bg-red-50 text-[#D32323]'}`}>{done ? '✓' : action.priority}</button><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[8px] font-black ${action.impact === 'Alto' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>Impacto {action.impact}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-600">Esfuerzo {action.effort}</span></div><h4 className="mt-2 text-sm font-black text-slate-900">{action.title}</h4><p className="mt-1 text-[10px] leading-5 text-slate-600">{action.reason}</p><p className="mt-2 text-[9px] leading-5 text-slate-400"><b className="text-slate-600">Evidencia:</b> {action.evidence}</p></div><div className="flex flex-col gap-2"><button type="button" onClick={() => navigate(action.route)} className="rounded-xl bg-[#D32323] px-3 py-2.5 text-[10px] font-black text-white">Ver solución Marketplace</button><button type="button" onClick={() => toggleAction(action.key)} className="rounded-xl bg-slate-100 px-3 py-2.5 text-[10px] font-black text-slate-700">{done ? 'Reabrir acción' : 'Marcar completada'}</button></div></article>; }) : <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" /><h3 className="mt-3 text-lg font-black text-slate-800">Sin intervenciones urgentes confirmadas</h3><p className="mt-2 text-xs text-slate-500">No forzamos una venta cuando los datos no justifican una prioridad.</p></div>}</div></Panel>
            <div className="grid gap-4 md:grid-cols-3"><Panel><div className="p-5"><span className="text-[9px] font-black uppercase text-emerald-700">QUICK WINS</span><h4 className="mt-2 text-sm font-black">GBP y reputación</h4><p className="mt-1 text-[9px] leading-5 text-slate-500">Intervenciones que pueden ejecutarse sin rehacer la arquitectura del negocio.</p></div></Panel><Panel><div className="p-5"><span className="text-[9px] font-black uppercase text-blue-700">GROWTH</span><h4 className="mt-2 text-sm font-black">Cobertura territorial</h4><p className="mt-1 text-[9px] leading-5 text-slate-500">Ranking, contenido local y señales geográficas cuando el GeoGrid lo justifica.</p></div></Panel><Panel><div className="p-5"><span className="text-[9px] font-black uppercase text-[#D32323]">MARKETPLACE</span><h4 className="mt-2 text-sm font-black">Oferta después de evidencia</h4><p className="mt-1 text-[9px] leading-5 text-slate-500">La recomendación comercial queda subordinada al diagnóstico, no al revés.</p></div></Panel></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
