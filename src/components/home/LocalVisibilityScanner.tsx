import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Crosshair,
  ExternalLink,
  Globe2,
  ImageOff,
  Loader2,
  LocateFixed,
  MapPin,
  Phone,
  Radar,
  Search,
  Star,
  Store,
  Trophy,
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

const CLIENT_DIAGNOSTIC_VERSION = 'V1.4';

const scannerEnabled =
  String(import.meta.env.VITE_LOCAL_VISIBILITY_SCANNER ?? 'true').toLowerCase() !==
  'false';

interface BrowserLocation {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
}


type DecisionPriorityLevel = 'high' | 'medium' | 'review';

type DecisionAction = {
  key: string;
  priority: DecisionPriorityLevel;
  statusLabel: string;
  evidenceLabel: string;
  finding: string;
  meaning: string;
  solutionTitle: string;
  route: string;
};

const rankColor = (rank: number | null) => {
  if (rank === null) return '#64748b';
  if (rank <= 3) return '#16a34a';
  if (rank <= 10) return '#f59e0b';
  if (rank <= 20) return '#ef4444';
  return '#64748b';
};

const rankIcon = (rank: number | null, selected = false) =>
  L.divIcon({
    className: 'seolocal-pack-marker',
    html: `<div style="
      width:${selected ? 42 : 34}px;height:${selected ? 42 : 34}px;border-radius:999px;
      display:flex;align-items:center;justify-content:center;
      background:${selected ? '#102f46' : rankColor(rank)};
      color:white;border:${selected ? 4 : 3}px solid white;
      box-shadow:0 6px 18px rgba(15,23,42,.28);
      font-size:${selected ? 13 : 11}px;font-weight:900;
    ">${selected ? '★' : rank ?? '20+'}</div>`,
    iconSize: [selected ? 42 : 34, selected ? 42 : 34],
    iconAnchor: [selected ? 21 : 17, selected ? 21 : 17],
  });

const userIcon = L.divIcon({
  className: 'seolocal-user-location',
  html: `<div style="width:22px;height:22px;border-radius:999px;background:#0074E0;border:4px solid #fff;box-shadow:0 0 0 8px rgba(0,116,224,.16),0 5px 18px rgba(15,23,42,.25)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FitMap({
  data,
  selected,
}: {
  data: LocalVisibilityPreviewResponse;
  selected: LocalPackBusiness | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [[data.origin.lat, data.origin.lng]];
    data.localResults.forEach((row) => {
      if (row.lat !== null && row.lng !== null) points.push([row.lat, row.lng]);
    });
    data.grid.forEach((cell) => points.push([cell.lat, cell.lng]));
    if (selected && selected.lat !== null && selected.lng !== null) {
      points.push([selected.lat, selected.lng]);
    }
    map.fitBounds(points, { padding: [38, 38], maxZoom: 14, animate: true });
  }, [data, map, selected]);

  return null;
}

function Stars({ rating }: { rating: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-black text-slate-800">
      {rating ?? '—'} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
    </span>
  );
}

function SafeBusinessImage({
  primary,
  fallback,
  title,
  prominent = false,
}: {
  primary: string;
  fallback: string;
  title: string;
  prominent?: boolean;
}) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const candidates = [primary, fallback].filter(
    (url, index, rows) => Boolean(url) && rows.indexOf(url) === index,
  );
  const source = candidates.find((url) => !failedUrls.includes(url)) ?? '';

  if (!source) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 ${
          prominent ? 'h-24 w-24' : 'h-16 w-16'
        }`}
        title="Sin foto pública importada"
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={title}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`shrink-0 rounded-xl object-cover ${
        prominent ? 'h-24 w-24' : 'h-16 w-16'
      }`}
      onError={() => {
        setFailedUrls((current) =>
          current.includes(source) ? current : [...current, source],
        );
      }}
    />
  );
}


function SectionKicker({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D32323]">
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <strong className="mt-1 block text-2xl font-black text-slate-900">{value}</strong>
      <small className="text-[11px] text-slate-500">{hint}</small>
    </div>
  );
}

function CompactBusinessRow({
  business,
  selected,
  onSelect,
  loading,
}: {
  business: LocalPackBusiness;
  selected: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-3 transition ${
        selected
          ? 'border-[#0074E0] bg-blue-50/60 ring-2 ring-blue-100'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
            business.position <= 3 ? 'bg-emerald-600' : 'bg-slate-700'
          }`}
        >
          {business.position}
        </div>
        <SafeBusinessImage
          primary={business.imageUrl}
          fallback={business.imageFallbackUrl}
          title={business.title}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h5 className="truncate text-sm font-black text-slate-900">{business.title}</h5>
              <p className="truncate text-[11px] text-slate-500">
                {business.type || 'Categoría no visible'}
              </p>
            </div>
            <Stars rating={business.rating} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span>{business.reviews ?? '—'} reseñas</span>
            {business.website ? <span>web</span> : null}
            {business.phone ? <span>teléfono</span> : null}
          </div>
          <button
            type="button"
            onClick={onSelect}
            disabled={loading}
            className={`mt-3 rounded-lg px-3 py-2 text-[10px] font-black ${
              selected
                ? 'bg-[#102f46] text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700'
            } disabled:opacity-60`}
          >
            {loading ? 'Importando…' : selected ? '✓ Seleccionado' : 'Elegir negocio'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function LocalVisibilityScanner() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [targetName, setTargetName] = useState('');
  const [radiusKm, setRadiusKm] = useState(2.5);
  const [location, setLocation] = useState<BrowserLocation | null>(null);
  const [data, setData] = useState<LocalVisibilityPreviewResponse | null>(null);
  const [packData, setPackData] =
    useState<LocalVisibilityPreviewResponse | null>(null);
  const [detailsData, setDetailsData] =
    useState<LocalVisibilityPreviewResponse | null>(null);
  const [selected, setSelected] = useState<LocalPackBusiness | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<
    'location' | 'pack' | 'details' | 'grid' | null
  >(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const labels = useMemo(
    () => ({
      pack: 'Consultando resultados de Google Maps',
      details: 'Importando ficha completa de Google Maps',
      grid: 'Analizando 25 puntos del mapa',
    }),
    [],
  );

  if (!scannerEnabled) return null;

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
          accuracyMeters: Number.isFinite(position.coords.accuracy)
            ? Math.round(position.coords.accuracy)
            : null,
        });
        setLoading(null);
      },
      (cause) => {
        setLoading(null);
        setError(
          cause.code === 1
            ? 'Debes permitir la ubicación para ejecutar un diagnóstico local real.'
            : 'No fue posible obtener tu ubicación. Revisa permisos de ubicación.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const importDetails = async (
    business: LocalPackBusiness,
    market: LocalPackMarketSummary | null,
  ) => {
    if (!location) return;
    setSelected(business);
    setDetailsData(null);
    setShowFullAnalysis(false);
    setError('');
    setLoading('details');
    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'details',
        query,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
        identity: business,
        market,
      });
      setDetailsData(response);
      setSelected(response.selectedBusiness ?? business);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible importar la ficha detallada del negocio.',
      );
    } finally {
      setLoading(null);
    }
  };

  const runPack = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!location) {
      setError('Primero pulsa “Usar mi ubicación”.');
      return;
    }
    setLoading('pack');
    setData(null);
    setSelected(null);
    setDetailsData(null);
    setPackData(null);
    setShowAllCandidates(false);
    setShowFullAnalysis(false);
    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'pack',
        query,
        targetName: targetName || undefined,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
      });
      setPackData(response);
      setData(response);
      setSelected(response.selectedBusiness);

      if (response.searchInterpretation?.rankingEligible !== false) {
        handoffToExecutiveWorkspace({
          response,
          keyword: query,
          businessHint: response.selectedBusiness,
          initialTab: response.selectedBusiness ? 'overview' : 'competitors',
        });
        return;
      }

      window.setTimeout(() => {
        document
          .getElementById('local-pack-live-result')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      if (response.selectedBusiness) {
        await importDetails(response.selectedBusiness, response.market);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No fue posible consultar los resultados locales.',
      );
    } finally {
      setLoading(null);
    }
  };

  const runCompetitiveKeyword = async (
    keyword: string,
    business: LocalPackBusiness,
  ) => {
    if (!location) return;
    setQuery(keyword);
    setTargetName(business.title);
    setError('');
    setLoading('pack');
    setData(null);
    setSelected(null);
    setDetailsData(null);
    setPackData(null);
    setShowAllCandidates(false);
    setShowFullAnalysis(false);

    try {
      const response = await marketplaceApi.localVisibilityPreview({
        action: 'pack',
        query: keyword,
        targetName: business.title,
        lat: location.lat,
        lng: location.lng,
        accuracyMeters: location.accuracyMeters,
      });
      setPackData(response);
      setData(response);
      setSelected(response.selectedBusiness);

      if (response.searchInterpretation?.rankingEligible !== false) {
        handoffToExecutiveWorkspace({
          response,
          keyword,
          businessHint: response.selectedBusiness ?? business,
          initialTab: 'overview',
        });
        return;
      }

      window.setTimeout(() => {
        document
          .getElementById('local-pack-live-result')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      if (response.selectedBusiness) {
        await importDetails(response.selectedBusiness, response.market);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible consultar la keyword competitiva.',
      );
    } finally {
      setLoading(null);
    }
  };

  const runGrid = async () => {
    const effectiveSelected = detailsData?.selectedBusiness ?? selected;
    if (!location || !effectiveSelected) return;
    if (packData?.searchInterpretation?.rankingEligible === false) {
      setError(
        'El mapa de visibilidad requiere una categoría o servicio competitivo. Las búsquedas por nombre no generan ranking ni score.',
      );
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
        identity: effectiveSelected,
      });
      setData(response);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No fue posible generar el mapa de visibilidad.',
      );
    } finally {
      setLoading(null);
    }
  };

  // SEOLOCAL_EXECUTIVE_WORKSPACE_V2
  // SEOLOCAL_EXECUTIVE_WORKSPACE_ENTRY_FLOW_R2
  const handoffToExecutiveWorkspace = ({
    response,
    keyword,
    businessHint,
    initialTab,
  }: {
    response: LocalVisibilityPreviewResponse;
    keyword: string;
    businessHint?: LocalPackBusiness | null;
    initialTab?: 'overview' | 'competitors';
  }) => {
    if (!location) return;

    const workspaceBusiness = response.selectedBusiness ?? businessHint ?? null;
    const workspaceTarget = workspaceBusiness?.title ?? targetName.trim();
    const targetTab = initialTab ?? (workspaceBusiness ? 'overview' : 'competitors');

    const handoff = {
      version: 'V2.0-A1-R2',
      savedAt: new Date().toISOString(),
      query: keyword,
      targetName: workspaceTarget,
      radiusKm,
      location,
      packData: response,
      detailsData: null,
      gridData: null,
      selectedBusiness: workspaceBusiness,
    };

    try {
      window.sessionStorage.setItem(
        'seolocal.localVisibility.workspace.handoff.v2',
        JSON.stringify(handoff),
      );
    } catch {
      // URL parameters preserve the essential context when sessionStorage is unavailable.
    }

    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (workspaceTarget) params.set('target', workspaceTarget);
    params.set('lat', String(location.lat));
    params.set('lng', String(location.lng));
    params.set('tab', targetTab);
    if (location.accuracyMeters !== null) params.set('accuracy', String(location.accuracyMeters));
    navigate(`/local-visibility?${params.toString()}`);
  };

  const openExecutiveWorkspace = () => {
    const response = packData;
    if (!location || !response) {
      setError('Ejecuta primero una búsqueda local.');
      return;
    }
    if (response.searchInterpretation?.rankingEligible === false) {
      setError('Elige primero una categoría o servicio competitivo. Las búsquedas por nombre no generan workspace de ranking.');
      return;
    }

    handoffToExecutiveWorkspace({
      response,
      keyword: query,
      businessHint: detailsData?.selectedBusiness ?? selected,
    });
  };

  const market = data?.market ?? detailsData?.market ?? null;
  const businessIntentMatch =
    data?.action === 'pack' &&
    data.searchInterpretation?.rankingEligible === false
      ? data.directMatch ?? null
      : null;
  const businessInterpretation =
    data?.searchInterpretation?.rankingEligible === false
      ? data.searchInterpretation
      : null;
  const keywordSuggestions =
    data?.action === 'pack' ? data.keywordSuggestions ?? [] : [];
  const top3 = data?.action === 'pack' ? data.localResults.slice(0, 3) : [];
  const marketList = data?.action === 'pack' ? data.localResults.slice(0, 10) : [];
  const effectiveSelected = detailsData?.selectedBusiness ?? selected;
  const details = detailsData?.placeDetails ?? null;
  const productMatches =
    detailsData?.productMatches ??
    (data?.selectedBusiness?.placeId === effectiveSelected?.placeId
      ? data?.productMatches ?? []
      : []);

  const top3Names = top3.map((business) => business.title).join(' · ');
  const candidateList = showAllCandidates ? marketList : marketList.slice(0, 5);
  const selectedReviews = effectiveSelected?.reviews ?? null;
  const top3AverageReviews = market?.top3AverageReviews ?? null;
  const reviewGap =
    selectedReviews !== null && top3AverageReviews !== null
      ? Math.max(0, Math.round(top3AverageReviews - selectedReviews))
      : null;
  const diagnosticLevel = effectiveSelected
    ? effectiveSelected.position <= 3
      ? reviewGap !== null && reviewGap > 0
        ? 'Competitivo'
        : 'Fuerte'
      : effectiveSelected.position <= 10
        ? 'Mejorable'
        : 'Débil'
    : null;
  const diagnosticTone =
    diagnosticLevel === 'Fuerte'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : diagnosticLevel === 'Competitivo'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : diagnosticLevel === 'Mejorable'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-red-50 text-red-700 border-red-200';
  const diagnosticSummary = effectiveSelected
    ? diagnosticLevel === 'Fuerte'
      ? 'Tu negocio ya compite entre los líderes de esta búsqueda desde esta ubicación.'
      : diagnosticLevel === 'Competitivo'
        ? `Ya estás dentro del Top 3, pero todavía hay margen para fortalecer tu reputación${reviewGap ? `: el promedio de los líderes te supera por ${reviewGap} reseñas` : ''}.`
        : diagnosticLevel === 'Mejorable'
          ? `Tu negocio aparece #${effectiveSelected.position}. Ya tiene visibilidad, pero todavía está fuera del Top 3 y puede ganar terreno.`
          : `Tu negocio aparece #${effectiveSelected.position}. La prioridad es mejorar su presencia para acercarlo al grupo que concentra mayor visibilidad.`
    : '';


  const gridMetrics = data?.action === 'grid' ? data.metrics : null;
  const top3Rating = market?.top3AverageRating ?? null;
  const selectedRating = effectiveSelected?.rating ?? null;
  const ratingGap =
    selectedRating !== null && top3Rating !== null
      ? Math.round((selectedRating - top3Rating) * 10) / 10
      : null;
  const reviewRatio =
    selectedReviews !== null && top3AverageReviews !== null && top3AverageReviews > 0
      ? selectedReviews / top3AverageReviews
      : null;

  const routeFor = (code: string, fallback: string) =>
    productMatches.find((match) => match.code === code)?.route ?? fallback;
  const titleFor = (code: string, fallback: string) =>
    productMatches.find((match) => match.code === code)?.title ?? fallback;

  const decisionPriorities: DecisionAction[] = [];
  const verifiedStrengths: string[] = [];

  if (effectiveSelected && market) {
    if (gridMetrics) {
      if (gridMetrics.top3Coverage >= 80 && gridMetrics.notFound === 0) {
        verifiedStrengths.push(
          `${Math.round((gridMetrics.top3Coverage / 100) * gridMetrics.points)} de ${gridMetrics.points} puntos están dentro del Top 3.`,
        );
      } else if (
        gridMetrics.top3Coverage < 40 ||
        (gridMetrics.averageRank !== null && gridMetrics.averageRank > 10) ||
        gridMetrics.notFound >= 5
      ) {
        decisionPriorities.push({
          key: 'ranking-grid-critical',
          priority: 'high',
          statusLabel: 'Prioridad alta',
          evidenceLabel: 'Dato confirmado',
          finding: `${Math.round((gridMetrics.top3Coverage / 100) * gridMetrics.points)} de ${gridMetrics.points} puntos están en Top 3.`,
          meaning:
            'Tu visibilidad cambia de forma importante según la zona. Hay áreas donde otros negocios ocupan posiciones más fuertes.',
          solutionTitle: titleFor('LOCAL_PACK_RANKING', 'Local Pack & Ranking'),
          route: routeFor('LOCAL_PACK_RANKING', '/categorias/local-pack-y-ranking'),
        });
      } else if (gridMetrics.top3Coverage < 80) {
        decisionPriorities.push({
          key: 'ranking-grid-opportunity',
          priority: 'medium',
          statusLabel: 'Oportunidad',
          evidenceLabel: 'Dato confirmado',
          finding: `${Math.round((gridMetrics.top3Coverage / 100) * gridMetrics.points)} de ${gridMetrics.points} puntos están en Top 3.`,
          meaning:
            'Tu negocio ya tiene cobertura competitiva, pero todavía hay zonas donde puede ganar posiciones.',
          solutionTitle: titleFor('LOCAL_PACK_RANKING', 'Local Pack & Ranking'),
          route: routeFor('LOCAL_PACK_RANKING', '/categorias/local-pack-y-ranking'),
        });
      }
    } else if (effectiveSelected.position > 10) {
      decisionPriorities.push({
        key: 'ranking-point-critical',
        priority: 'high',
        statusLabel: 'Prioridad alta',
        evidenceLabel: 'Dato confirmado',
        finding: `Tu negocio aparece #${effectiveSelected.position} desde esta ubicación.`,
        meaning:
          'Está fuera del grupo que concentra la mayor visibilidad para esta búsqueda local.',
        solutionTitle: titleFor('LOCAL_PACK_RANKING', 'Local Pack & Ranking'),
        route: routeFor('LOCAL_PACK_RANKING', '/categorias/local-pack-y-ranking'),
      });
    } else if (effectiveSelected.position > 3) {
      decisionPriorities.push({
        key: 'ranking-point-opportunity',
        priority: 'medium',
        statusLabel: 'Oportunidad',
        evidenceLabel: 'Dato confirmado',
        finding: `Tu negocio aparece #${effectiveSelected.position} desde esta ubicación.`,
        meaning:
          'Ya tienes visibilidad, pero todavía estás fuera del Top 3 que recibe mayor exposición.',
        solutionTitle: titleFor('LOCAL_PACK_RANKING', 'Local Pack & Ranking'),
        route: routeFor('LOCAL_PACK_RANKING', '/categorias/local-pack-y-ranking'),
      });
    } else {
      verifiedStrengths.push(`Tu negocio aparece #${effectiveSelected.position} en esta ubicación.`);
    }

    if (reviewRatio !== null && reviewRatio < 0.65) {
      decisionPriorities.push({
        key: 'reputation-critical',
        priority: 'high',
        statusLabel: 'Prioridad alta',
        evidenceLabel: 'Dato confirmado',
        finding: `${selectedReviews} reseñas frente a ${top3AverageReviews} de promedio en el Top 3.`,
        meaning:
          'La diferencia de volumen de reseñas es suficientemente grande como para convertirse en una desventaja competitiva visible.',
        solutionTitle: titleFor('REPUTATION', 'Gestión de Reseñas y Reputación'),
        route: routeFor('REPUTATION', '/categorias/reputacion-y-resenas'),
      });
    } else if (ratingGap !== null && ratingGap <= -0.3) {
      decisionPriorities.push({
        key: 'reputation-rating',
        priority: 'medium',
        statusLabel: 'Oportunidad',
        evidenceLabel: 'Dato confirmado',
        finding: `${selectedRating}★ frente a ${top3Rating}★ de promedio en el Top 3.`,
        meaning:
          'Tu valoración está por debajo del nivel observado entre los líderes y conviene revisar la experiencia y la estrategia de reseñas.',
        solutionTitle: titleFor('REPUTATION', 'Gestión de Reseñas y Reputación'),
        route: routeFor('REPUTATION', '/categorias/reputacion-y-resenas'),
      });
    } else if (reviewRatio !== null && reviewRatio < 0.9) {
      decisionPriorities.push({
        key: 'reputation-volume',
        priority: 'medium',
        statusLabel: 'Oportunidad',
        evidenceLabel: 'Dato confirmado',
        finding: `${selectedReviews} reseñas frente a ${top3AverageReviews} de promedio en el Top 3.`,
        meaning:
          'Tu reputación es competitiva, pero el volumen todavía queda algo por debajo de los primeros resultados.',
        solutionTitle: titleFor('REPUTATION', 'Gestión de Reseñas y Reputación'),
        route: routeFor('REPUTATION', '/categorias/reputacion-y-resenas'),
      });
    } else if (reviewRatio !== null) {
      verifiedStrengths.push('Tu volumen de reseñas iguala o supera el promedio del Top 3.');
    }

    if (details && details.visibleSignals.score < 84) {
      decisionPriorities.push({
        key: 'profile-review',
        priority: 'review',
        statusLabel: 'Revisión recomendada',
        evidenceLabel: 'Señal parcial',
        finding: `${details.visibleSignals.score}% de las señales evaluadas fueron visibles en esta consulta.`,
        meaning:
          'Esto no demuestra que falten datos en tu ficha. Sí indica que conviene revisar el perfil completo antes de asumir que todo está correctamente presentado.',
        solutionTitle: titleFor('GBP_AUDIT', 'Auditoría Google Business Profile'),
        route: routeFor('GBP_AUDIT', '/categorias/google-business-profile'),
      });
    } else if (details) {
      verifiedStrengths.push('La ficha expone la mayoría de las señales básicas evaluadas.');
    }
  }

  const sortedDecisionActions = [...decisionPriorities].sort((a, b) => {
    const weight = { high: 3, medium: 2, review: 1 } as const;
    return weight[b.priority] - weight[a.priority];
  });
  const actionablePriorities = sortedDecisionActions
    .filter((priority) => priority.priority !== 'review')
    .slice(0, 3);
  const reviewRecommendations = sortedDecisionActions
    .filter((priority) => priority.priority === 'review')
    .slice(0, 2);
  const priorityGridClass =
    actionablePriorities.length <= 1
      ? 'grid gap-4'
      : actionablePriorities.length === 2
        ? 'grid gap-4 lg:grid-cols-2'
        : 'grid gap-4 lg:grid-cols-3';
  const diagnosticHealthLabel =
    actionablePriorities.some((priority) => priority.priority === 'high')
      ? 'Atención prioritaria'
      : actionablePriorities.length
        ? 'Oportunidades de mejora'
        : 'Estado saludable';

  const gridTop3Points = gridMetrics
    ? Math.round((gridMetrics.top3Coverage / 100) * gridMetrics.points)
    : 0;
  const gridTop10Points = gridMetrics
    ? Math.round((gridMetrics.top10Coverage / 100) * gridMetrics.points)
    : 0;
  const gridScoreExplanation = gridMetrics
    ? 'El score resume la visibilidad observada en la cuadrícula. Interprétalo junto con Top 3, Top 10, posición media y puntos sin aparecer.'
    : '';
  const gridScoreWidth = gridMetrics
    ? Math.max(0, Math.min(100, gridMetrics.visibilityScore))
    : 0;
  const gridVerdict = gridMetrics
    ? gridMetrics.top3Coverage >= 80 && gridMetrics.notFound === 0
      ? {
          label: 'Cobertura excelente',
          tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          summary: `Tu negocio está dentro del Top 3 en ${gridTop3Points} de ${gridMetrics.points} puntos analizados. No detectamos una necesidad urgente de mejorar ranking dentro de este radio.`,
          next: 'La prioridad es defender esta posición, mantener una reputación sólida y vigilar cambios de competidores.',
        }
      : gridMetrics.top3Coverage >= 50
        ? {
            label: 'Cobertura competitiva',
            tone: 'bg-blue-50 text-blue-700 border-blue-200',
            summary: `Tu negocio entra en Top 3 en ${gridTop3Points} de ${gridMetrics.points} puntos. La visibilidad es buena, aunque todavía cambia según la zona.`,
            next: 'Conviene reforzar las áreas donde pierdes Top 3 y continuar midiendo la cobertura territorial.',
          }
        : gridMetrics.top10Coverage >= 70
          ? {
              label: 'Cobertura irregular',
              tone: 'bg-amber-50 text-amber-700 border-amber-200',
              summary: `Tu negocio aparece en Top 10 en ${gridTop10Points} de ${gridMetrics.points} puntos, pero la presencia en Top 3 todavía es limitada.`,
              next: 'Hay una oportunidad clara para mejorar cobertura local y acercar más zonas al grupo de mayor visibilidad.',
            }
          : {
              label: 'Cobertura débil',
              tone: 'bg-red-50 text-red-700 border-red-200',
              summary: `La cobertura es débil en una parte importante del área analizada y ${gridMetrics.notFound} de ${gridMetrics.points} puntos no encontraron el negocio dentro del rango medido.`,
              next: 'La prioridad es reforzar presencia local antes de ampliar el radio de análisis.',
            }
    : null;

  return (
    <section
      id="local-visibility-scanner"
      data-client-diagnostic-version={CLIENT_DIAGNOSTIC_VERSION}
      className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50 py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-[#102f46] via-[#0f5277] to-[#0074E0] p-7 text-white md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]">
                <Radar className="h-4 w-4" />
                Diagnóstico local en Google Maps
              </div>
              <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight md:text-4xl">
                Descubre tu posición local y qué puedes mejorar
              </h2>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-blue-50 md:text-base">
                Busca como lo haría un cliente, encuentra tu ficha y recibe un resumen claro de
                tu posición, tus principales brechas y las acciones con mayor prioridad.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ['Posición', 'Dónde aparece tu negocio'],
                  ['Comparación', 'Cómo estás frente al Top 3'],
                  ['Prioridades', 'Qué conviene mejorar primero'],
                  ['Mapa', 'Cómo cambia tu visibilidad por zona'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-3.5"
                  >
                    <span className="block text-[10px] font-black uppercase tracking-wider text-blue-100">
                      {label}
                    </span>
                    <strong className="mt-1 block text-sm">{value}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl border border-emerald-300/30 bg-emerald-200/10 p-4 text-xs leading-5 text-emerald-50">
                Resultados observados desde tu ubicación. La posición puede cambiar según
                el punto desde el que una persona realiza la búsqueda.
              </div>
            </div>

            <div className="p-7 md:p-10">
              <SectionKicker>Diagnóstico del Local Pack</SectionKicker>
              <h3 className="mt-2 text-2xl font-black text-[#333]">¿Cómo te buscan tus clientes?</h3>

              <button
                type="button"
                onClick={requestLocation}
                disabled={Boolean(loading)}
                className="mt-5 flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-3">
                  {loading === 'location' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#0074E0]" />
                  ) : (
                    <LocateFixed className="h-5 w-5 text-[#0074E0]" />
                  )}
                  <span>
                    <strong className="block text-sm text-slate-900">
                      {location ? 'Ubicación lista' : 'Usar mi ubicación'}
                    </strong>
                    <span className="block text-xs text-slate-500">
                      {location
                        ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} · ±${location.accuracyMeters ?? '?'} m`
                        : 'El navegador te pedirá permiso'}
                    </span>
                  </span>
                </span>
                {location ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
              </button>

              <form onSubmit={runPack} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Búsqueda local
                  </span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <Search className="h-5 w-5 shrink-0 text-[#D32323]" />
                    <input
                      id="local-visibility-query"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setData(null);
                        setDetailsData(null);
                        setSelected(null);
                        setShowAllCandidates(false);
                        setShowFullAnalysis(false);
                      }}
                      placeholder="Ej. heladeria · pizza guacara · dentista"
                      className="w-full bg-transparent px-3 py-4 text-sm font-bold text-slate-800 outline-none"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Nombre de tu negocio (opcional)
                  </span>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <Store className="h-5 w-5 shrink-0 text-[#0074E0]" />
                    <input
                      value={targetName}
                      onChange={(event) => setTargetName(event.target.value)}
                      placeholder="Ej. Heladeria Sunday"
                      className="w-full bg-transparent px-3 py-4 text-sm font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <small className="mt-1.5 block text-[11px] text-slate-400">
                    Si coincide con un resultado, abriremos automáticamente su diagnóstico.
                  </small>
                </label>

                <button
                  type="submit"
                  disabled={Boolean(loading)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D32323] px-6 py-4 text-sm font-black text-white shadow-lg disabled:opacity-70"
                >
                  {loading === 'pack' || loading === 'details' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {loading === 'details' ? labels.details : labels.pack}
                    </>
                  ) : (
                    <>
                      <Radar className="h-5 w-5" />
                      Analizar mi visibilidad
                    </>
                  )}
                </button>
              </form>

              {error ? (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          {data ? (
            <div
              id="local-pack-live-result"
              className="border-t border-slate-200 bg-slate-50 p-5 md:p-8"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                        Datos observados en Google Maps
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Desde tu ubicación actual
                      </span>
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-slate-900">
                      {data.action === 'grid'
                        ? `Mapa de visibilidad · ${data.selectedBusiness?.title ?? data.query}`
                        : data.searchInterpretation?.rankingEligible === false
                          ? 'Encontramos el negocio que probablemente buscabas'
                          : `Resultados competitivos para “${data.query}”`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {data.searchInterpretation?.rankingEligible === false
                        ? 'Primero identificamos la ficha. El ranking comienza cuando eliges una categoría o servicio que usaría un cliente nuevo.'
                        : 'Así se ve la competencia alrededor de tu ubicación en este momento.'}
                    </p>
                    {data.action === 'pack' && top3Names ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Los primeros resultados son: <strong>{top3Names}</strong>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {effectiveSelected && packData?.searchInterpretation?.rankingEligible !== false ? (
                      <button
                        type="button"
                        onClick={openExecutiveWorkspace}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#102f46] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#0b2235]"
                      >
                        Executive Workspace
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : null}
                    {data.providerSearchUrl ? (
                      <a
                        href={data.providerSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-[#0074E0]"
                      >
                        Ver resultados en Google Maps <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                    {effectiveSelected ? (
                      <button
                        type="button"
                        onClick={runGrid}
                        disabled={Boolean(loading)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0074E0] px-4 py-2 text-xs font-black text-white disabled:opacity-70"
                      >
                        {loading === 'grid' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {labels.grid}
                          </>
                        ) : (
                          <>
                            <Crosshair className="h-4 w-4" />
                            Ver mapa de visibilidad
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {data.action === 'pack' && businessIntentMatch && businessInterpretation ? (
                <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm md:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <SafeBusinessImage
                        primary={businessIntentMatch.imageUrl}
                        fallback={businessIntentMatch.imageFallbackUrl}
                        title={businessIntentMatch.title}
                        prominent
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <SectionKicker>Búsqueda por nombre</SectionKicker>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700">
                            Ranking no aplicable
                          </span>
                        </div>
                        <h4 className="mt-2 text-2xl font-black text-slate-900">
                          {businessIntentMatch.title}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-[#0074E0]">
                          {businessInterpretation.corrected
                            ? `Buscaste “${businessInterpretation.inputQuery}” · Google interpretó “${businessInterpretation.resolvedQuery}”`
                            : 'Google Maps identificó directamente esta ficha.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                          {businessIntentMatch.type ? <span>{businessIntentMatch.type}</span> : null}
                          <span>{businessIntentMatch.rating ?? '—'}★</span>
                          <span>{businessIntentMatch.reviews ?? '—'} reseñas</span>
                          {businessIntentMatch.address ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {businessIntentMatch.address}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white p-4 lg:max-w-[290px]">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                        Ranking no aplicable
                      </span>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        No usamos una búsqueda de marca para inventar una posición #1 ni un score 100/100.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-200 bg-white/90 p-5">
                    <h5 className="text-base font-black text-slate-900">
                      ¿Cómo te encontraría alguien que todavía no conoce tu negocio?
                    </h5>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Elige una categoría pública de Google Maps. Ahí sí mediremos posición, Top 3, competidores y GeoGrid.
                    </p>

                    {keywordSuggestions.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {keywordSuggestions.map((keyword) => (
                          <button
                            key={`competitive-${keyword}`}
                            type="button"
                            onClick={() => runCompetitiveKeyword(keyword, businessIntentMatch)}
                            disabled={loading === 'pack'}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#102f46] px-4 py-2.5 text-[11px] font-black text-white disabled:opacity-60"
                          >
                            Analizar “{keyword}”
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        Google no expuso una categoría utilizable en esta respuesta. Escribe manualmente un servicio o categoría en “Búsqueda local”.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {data.action === 'pack' && market ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      label="Negocios encontrados"
                      value={`${market.returnedResults}`}
                      hint="en esta búsqueda"
                    />
                    <MetricCard
                      label="Rating promedio Top 3"
                      value={`${market.top3AverageRating ?? '—'}★`}
                      hint="referencia local"
                    />
                    <MetricCard
                      label="Reseñas promedio Top 3"
                      value={`${market.top3AverageReviews ?? '—'}`}
                      hint="referencia local"
                    />
                  </div>

                  {!effectiveSelected ? (
                    <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <SectionKicker>Encuentra tu ficha</SectionKicker>
                        <h4 className="mt-2 text-2xl font-black text-slate-900">
                          Encontramos {market.returnedResults} negocios para “{data.query}”
                        </h4>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                          Selecciona tu negocio para recibir un diagnóstico personalizado. Primero
                          mostramos los resultados más visibles para que encuentres tu ficha rápido.
                        </p>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                          <div className="divide-y divide-slate-100">
                            {candidateList.map((business) => (
                              <div
                                key={`discover-${business.placeId || `${business.position}-${business.title}`}`}
                                className="flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
                                      business.position <= 3 ? 'bg-emerald-600' : 'bg-slate-700'
                                    }`}
                                  >
                                    {business.position}
                                  </div>
                                  <SafeBusinessImage
                                    primary={business.imageUrl}
                                    fallback={business.imageFallbackUrl}
                                    title={business.title}
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-900">
                                      {business.title}
                                    </p>
                                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                      {business.type || 'Negocio local'} · {business.rating ?? '—'}★ ·{' '}
                                      {business.reviews ?? '—'} reseñas
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => importDetails(business, market)}
                                  disabled={
                                    loading === 'details' && selected?.placeId === business.placeId
                                  }
                                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#102f46] px-4 py-2.5 text-[11px] font-black text-white disabled:opacity-60"
                                >
                                  Este es mi negocio
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {marketList.length > 5 ? (
                          <button
                            type="button"
                            onClick={() => setShowAllCandidates((current) => !current)}
                            className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#0074E0]"
                          >
                            {showAllCandidates ? 'Ver menos resultados' : `Ver los ${marketList.length} resultados`}
                            {showAllCandidates ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </div>

                      <div className="space-y-5">
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h4 className="font-black text-slate-900">Vista del mercado</h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Tu ubicación y los negocios más visibles para esta búsqueda.
                            </p>
                          </div>
                          <div className="h-[300px]">
                            <MapContainer
                              center={[data.origin.lat, data.origin.lng]}
                              zoom={13}
                              className="h-full w-full"
                            >
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <FitMap data={data} selected={null} />
                              <Marker position={[data.origin.lat, data.origin.lng]} icon={userIcon}>
                                <Popup>Tu ubicación</Popup>
                              </Marker>
                              {data.localResults.slice(0, 10).map((business) =>
                                business.lat !== null && business.lng !== null ? (
                                  <Marker
                                    key={`map-${business.placeId || `${business.position}-${business.title}`}`}
                                    position={[business.lat, business.lng]}
                                    icon={rankIcon(business.position)}
                                  >
                                    <Popup>
                                      <strong>#{business.position} {business.title}</strong>
                                      <br />
                                      {business.rating ?? '—'}★ · {business.reviews ?? '—'} reseñas
                                    </Popup>
                                  </Marker>
                                ) : null,
                              )}
                            </MapContainer>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <SectionKicker>Referencia local</SectionKicker>
                          <h4 className="mt-2 font-black text-slate-900">
                            Lo que marca el nivel de los primeros resultados
                          </h4>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <span className="text-xs text-slate-500">Reseñas promedio Top 3</span>
                              <strong className="mt-1 block text-xl text-slate-900">
                                {market.top3AverageReviews ?? '—'}
                              </strong>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <span className="text-xs text-slate-500">Rating promedio Top 3</span>
                              <strong className="mt-1 block text-xl text-slate-900">
                                {market.top3AverageRating ?? '—'}★
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
                            <SafeBusinessImage
                              primary={details?.imageUrl || effectiveSelected.imageUrl}
                              fallback={effectiveSelected.imageFallbackUrl}
                              title={effectiveSelected.title}
                              prominent
                            />
                            <div className="min-w-0 flex-1">
                              <SectionKicker>Tu diagnóstico local</SectionKicker>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <h4 className="text-2xl font-black text-slate-900 md:text-3xl">
                                  {effectiveSelected.title}
                                </h4>
                                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${diagnosticTone}`}>
                                  {diagnosticLevel}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {effectiveSelected.type || 'Negocio local'}
                                {effectiveSelected.address ? ` · ${effectiveSelected.address}` : ''}
                              </p>
                              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                                {diagnosticSummary}
                              </p>
                            </div>
                          </div>

                          <div className="grid shrink-0 grid-cols-3 gap-2 sm:min-w-[320px]">
                            <div className="rounded-2xl bg-slate-900 p-4 text-center text-white">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Posición</span>
                              <strong className="mt-1 block text-3xl font-black">#{effectiveSelected.position}</strong>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-center">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rating</span>
                              <strong className="mt-1 block text-2xl font-black text-slate-900">{effectiveSelected.rating ?? '—'}★</strong>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-center">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reseñas</span>
                              <strong className="mt-1 block text-2xl font-black text-slate-900">{effectiveSelected.reviews ?? '—'}</strong>
                            </div>
                          </div>
                        </div>

                        {loading === 'details' ? (
                          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-blue-50 p-3 text-xs font-bold text-blue-700">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Preparando tu diagnóstico…
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-3 lg:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 p-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Posición</span>
                            <h5 className="mt-2 font-black text-slate-900">
                              {effectiveSelected.position <= 3
                                ? 'Estás dentro del Top 3'
                                : `Te separan ${effectiveSelected.position - 3} posiciones del Top 3`}
                            </h5>
                          </div>
                          <div className="rounded-2xl border border-slate-200 p-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reputación</span>
                            <h5 className="mt-2 font-black text-slate-900">
                              {reviewGap === null
                                ? 'Comparación no disponible'
                                : reviewGap === 0
                                  ? 'Tu volumen de reseñas iguala o supera el promedio Top 3'
                                  : `Brecha de ${reviewGap} reseñas frente al promedio Top 3`}
                            </h5>
                          </div>
                          <div className="rounded-2xl border border-slate-200 p-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Perfil</span>
                            <h5 className="mt-2 font-black text-slate-900">
                              {details ? `${details.visibleSignals.score}% de señales visibles` : 'Revisando la ficha'}
                            </h5>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <SectionKicker>Tu plan recomendado</SectionKicker>
                            <h4 className="mt-2 text-2xl font-black text-slate-900">
                              {actionablePriorities.length
                                ? `Detectamos ${actionablePriorities.length} ${actionablePriorities.length === 1 ? 'prioridad' : 'prioridades'} respaldadas por esta búsqueda`
                                : reviewRecommendations.length
                                  ? `Tu presencia es fuerte. Encontramos ${reviewRecommendations.length} ${reviewRecommendations.length === 1 ? 'punto' : 'puntos'} que conviene revisar`
                                  : 'Tu presencia se ve saludable en los datos evaluados'}
                            </h4>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                              Las prioridades se basan en brechas confirmadas. Las señales parciales se separan como revisiones para no convertir una duda en una deficiencia.
                            </p>
                          </div>
                          <span
                            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                              actionablePriorities.some((priority) => priority.priority === 'high')
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : actionablePriorities.length
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {diagnosticHealthLabel}
                          </span>
                        </div>

                        {verifiedStrengths.length ? (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {verifiedStrengths.slice(0, 3).map((strength) => (
                              <span
                                key={strength}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {strength}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {!actionablePriorities.length ? (
                          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                              <div>
                                <h5 className="font-black text-emerald-900">
                                  No detectamos prioridades urgentes con los datos confirmados.
                                </h5>
                                <p className="mt-1 text-sm leading-6 text-emerald-800">
                                  {reviewRecommendations.length
                                    ? 'Tu negocio muestra una posición competitiva. Los puntos siguientes son revisiones preventivas, no problemas confirmados.'
                                    : 'No necesitas comprar una solución solo por completar este diagnóstico. Puedes comprobar la cobertura territorial antes de decidir cualquier intervención.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {actionablePriorities.length ? (
                          <div className={`mt-5 ${priorityGridClass}`}>
                            {actionablePriorities.map((priority, index) => (
                              <article
                                key={priority.key}
                                className="flex h-full flex-col rounded-2xl border border-slate-200 p-5"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">
                                    Prioridad #{index + 1}
                                  </span>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                                      priority.priority === 'high'
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {priority.statusLabel}
                                  </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Qué encontramos
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                                    {priority.evidenceLabel}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm font-black leading-6 text-slate-900">
                                  {priority.finding}
                                </p>

                                <div className="mt-4">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Qué significa
                                  </span>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {priority.meaning}
                                  </p>
                                </div>

                                <div className="mt-auto border-t border-slate-100 pt-4">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Solución recomendada
                                  </span>
                                  <h5 className="mt-1 text-lg font-black text-slate-900">
                                    {priority.solutionTitle}
                                  </h5>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => navigate(priority.route)}
                                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#D32323] px-4 py-3 text-xs font-black text-white"
                                >
                                  Ver solución
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                              </article>
                            ))}
                          </div>
                        ) : null}

                        {reviewRecommendations.length ? (
                          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                                  Puntos para revisar
                                </span>
                                <h5 className="mt-1 font-black text-slate-900">
                                  Señales parciales que conviene comprobar
                                </h5>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-wider text-blue-700">
                                No es una falla confirmada
                              </span>
                            </div>
                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                              {reviewRecommendations.map((review) => (
                                <div
                                  key={`review-${review.key}`}
                                  className="rounded-2xl border border-blue-100 bg-white p-4"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                                      Revisión recomendada
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                                      {review.evidenceLabel}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm font-black leading-6 text-slate-900">
                                    {review.finding}
                                  </p>
                                  <p className="mt-2 text-xs leading-5 text-slate-600">
                                    {review.meaning}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => navigate(review.route)}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[10px] font-black text-[#0074E0]"
                                  >
                                    Revisar ficha
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-black text-slate-900">Análisis completo</h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Mapa, competidores, datos de la ficha y opciones de análisis territorial.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFullAnalysis((current) => !current)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700"
                          >
                            {showFullAnalysis ? 'Ocultar análisis completo' : 'Ver análisis completo'}
                            {showFullAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {showFullAnalysis ? (
                        <div className="space-y-6">
                          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                              <div className="border-b border-slate-100 px-5 py-4">
                                <h4 className="font-black text-slate-900">Tu posición en el mapa</h4>
                                <p className="mt-1 text-xs text-slate-500">Compara tu ubicación con los negocios que aparecen primero.</p>
                              </div>
                              <div className="h-[390px]">
                                <MapContainer center={[data.origin.lat, data.origin.lng]} zoom={13} className="h-full w-full">
                                  <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  />
                                  <FitMap data={data} selected={effectiveSelected} />
                                  <Marker position={[data.origin.lat, data.origin.lng]} icon={userIcon}><Popup>Tu ubicación</Popup></Marker>
                                  {data.localResults.map((business) =>
                                    business.lat !== null && business.lng !== null ? (
                                      <Marker
                                        key={`map-${business.placeId || `${business.position}-${business.title}`}`}
                                        position={[business.lat, business.lng]}
                                        icon={rankIcon(business.position, effectiveSelected.placeId === business.placeId && Boolean(business.placeId))}
                                      >
                                        <Popup>
                                          <strong>#{business.position} {business.title}</strong><br />
                                          {business.rating ?? '—'}★ · {business.reviews ?? '—'} reseñas
                                        </Popup>
                                      </Marker>
                                    ) : null,
                                  )}
                                </MapContainer>
                              </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                <h4 className="font-black text-slate-900">Competidores de referencia</h4>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">Los tres negocios que aparecen primero para esta búsqueda.</p>
                              <div className="mt-4 space-y-3">
                                {top3.map((business) => (
                                  <CompactBusinessRow
                                    key={business.placeId || `${business.position}-${business.title}`}
                                    business={business}
                                    selected={effectiveSelected.placeId === business.placeId}
                                    loading={loading === 'details' && selected?.placeId === business.placeId}
                                    onSelect={() => importDetails(business, market)}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {details ? (
                            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="font-black text-slate-900">Información de tu ficha</h4>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2 font-black text-slate-900"><MapPin className="h-4 w-4 text-[#D32323]" /> Dirección</div>
                                    <p className="mt-2">{effectiveSelected.address || 'No visible'}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2 font-black text-slate-900"><Phone className="h-4 w-4 text-[#D32323]" /> Teléfono</div>
                                    <p className="mt-2">{effectiveSelected.phone || 'No visible'}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2 font-black text-slate-900"><Clock3 className="h-4 w-4 text-[#D32323]" /> Horario</div>
                                    <p className="mt-2">{effectiveSelected.hours || effectiveSelected.openState || 'No visible'}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2 font-black text-slate-900"><Globe2 className="h-4 w-4 text-[#D32323]" /> Sitio web</div>
                                    <p className="mt-2 truncate">{effectiveSelected.website || 'No visible'}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="font-black text-slate-900">Mapa de visibilidad</h4>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  Una ubicación es solo una fotografía. Revisa 25 puntos para saber si tu posición se mantiene alrededor de la zona.
                                </p>
                                <label className="mt-4 block">
                                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Radio del análisis</span>
                                  <select
                                    value={radiusKm}
                                    onChange={(event) => setRadiusKm(Number(event.target.value))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black"
                                  >
                                    <option value={1.5}>1.5 km</option>
                                    <option value={2.5}>2.5 km</option>
                                    <option value={4}>4 km</option>
                                    <option value={6}>6 km</option>
                                  </select>
                                </label>
                                <button
                                  type="button"
                                  onClick={runGrid}
                                  disabled={Boolean(loading)}
                                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0074E0] px-4 py-3 text-xs font-black text-white disabled:opacity-70"
                                >
                                  {loading === 'grid' ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" />Analizando 25 puntos…</>
                                  ) : (
                                    <><Crosshair className="h-4 w-4" />Ver mapa de visibilidad</>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : data.metrics && data.selectedBusiness && gridVerdict ? (
                <>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <strong className="text-sm font-black text-slate-900">
                          {data.selectedBusiness.title}
                        </strong>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-black text-slate-700">
                          #{effectiveSelected?.position ?? data.selectedBusiness.position} punto central
                        </span>
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 font-black text-blue-700">
                          {data.metrics.visibilityScore}/100 visibilidad
                        </span>
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 font-black text-amber-700">
                          {actionablePriorities.length} {actionablePriorities.length === 1 ? 'prioridad' : 'prioridades'}
                          {reviewRecommendations.length ? ` · ${reviewRecommendations.length} revisión${reviewRecommendations.length === 1 ? '' : 'es'}` : ''}
                        </span>
                      </div>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (packData) setData(packData);
                          }}
                          disabled={!packData}
                          className="rounded-lg px-4 py-2 text-[11px] font-black text-slate-600 disabled:opacity-40"
                        >
                          Resumen
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-white px-4 py-2 text-[11px] font-black text-[#0074E0] shadow-sm"
                        >
                          Mapa de visibilidad
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <SectionKicker>Diagnóstico territorial</SectionKicker>
                        <p className="mt-2 text-xs font-black uppercase tracking-wider text-[#0074E0]">
                          Keyword competitiva: “{data.query}”
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900">
                            Mapa de visibilidad · {data.selectedBusiness.title}
                          </h3>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${gridVerdict.tone}`}>
                            {gridVerdict.label}
                          </span>
                        </div>
                        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                          {gridVerdict.summary}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-900 px-5 py-4 text-center text-white">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                          Visibilidad
                        </span>
                        <strong className="mt-1 block text-3xl font-black">
                          {data.metrics.visibilityScore}/100
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Cómo leer el score
                        </span>
                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
                          {gridScoreExplanation}
                        </p>
                      </div>
                      <strong className="text-sm font-black text-slate-900">
                        {gridVerdict.label}
                      </strong>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#0074E0]"
                        style={{ width: `${gridScoreWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Top 3"
                      value={`${gridTop3Points} de ${data.metrics.points}`}
                      hint="puntos analizados"
                    />
                    <MetricCard
                      label="Top 10"
                      value={`${gridTop10Points} de ${data.metrics.points}`}
                      hint="puntos analizados"
                    />
                    <MetricCard
                      label="Posición media"
                      value={data.metrics.averageRank ? `#${data.metrics.averageRank}` : '20+'}
                      hint="en el área medida"
                    />
                    <MetricCard
                      label="Sin aparecer"
                      value={`${data.metrics.notFound} de ${data.metrics.points}`}
                      hint="dentro del rango medido"
                    />
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-5 py-4">
                        <h4 className="font-black text-slate-900">Dónde eres visible</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Cada punto representa una búsqueda desde una ubicación diferente dentro del área analizada.
                        </p>
                      </div>
                      <div className="h-[470px]">
                        <MapContainer
                          center={[
                            data.selectedBusiness.lat ?? data.origin.lat,
                            data.selectedBusiness.lng ?? data.origin.lng,
                          ]}
                          zoom={13}
                          className="h-full w-full"
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <FitMap data={data} selected={data.selectedBusiness} />
                          {data.grid.map((cell) => (
                            <Marker
                              key={`${cell.row}-${cell.col}`}
                              position={[cell.lat, cell.lng]}
                              icon={rankIcon(cell.rank)}
                            >
                              <Popup>
                                <strong>
                                  Tu posición: {cell.rank !== null ? `#${cell.rank}` : '20+'}
                                </strong>
                                <br />
                                {cell.distanceKm.toFixed(2)} km · {cell.bearing}
                                {cell.topCompetitors.length ? (
                                  <>
                                    <br />
                                    <br />
                                    <strong>Top 3 desde este punto</strong>
                                    {cell.topCompetitors.slice(0, 3).map((competitor) => (
                                      <span key={`${cell.row}-${cell.col}-${competitor.position}-${competitor.title}`} className="block">
                                        #{competitor.position} {competitor.title} · {competitor.rating ?? '—'}★
                                      </span>
                                    ))}
                                  </>
                                ) : null}
                              </Popup>
                            </Marker>
                          ))}
                          {data.selectedBusiness.lat !== null && data.selectedBusiness.lng !== null ? (
                            <Marker
                              position={[data.selectedBusiness.lat, data.selectedBusiness.lng]}
                              icon={rankIcon(data.selectedBusiness.position, true)}
                            >
                              <Popup>{data.selectedBusiness.title}</Popup>
                            </Marker>
                          ) : null}
                        </MapContainer>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {data.metrics.competitorLeaders.length ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <SectionKicker>Competencia territorial</SectionKicker>
                          <h4 className="mt-2 font-black text-slate-900">Quién domina el área</h4>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Negocios que aparecen con mayor frecuencia en los resultados observados de los 25 puntos.
                          </p>
                          <div className="mt-4 space-y-3">
                            {data.metrics.competitorLeaders.map((competitor, index) => (
                              <div
                                key={`leader-${competitor.placeId || competitor.title}`}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-slate-900">
                                      {index + 1}. {competitor.title}
                                    </p>
                                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                      {competitor.type || 'Negocio local'}
                                    </p>
                                  </div>
                                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-slate-700">
                                    media #{competitor.averagePosition}
                                  </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
                                  <span>{competitor.appearances}/25 apariciones</span>
                                  <span>{competitor.top3Appearances} Top 3</span>
                                  <span>mejor #{competitor.bestPosition}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <SectionKicker>Qué significa</SectionKicker>
                        <h4 className="mt-2 font-black text-slate-900">Tu cobertura local</h4>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {gridVerdict.next}
                        </p>
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          La dirección más débil observada fue <strong>{data.metrics.weakestDirection}</strong>.
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <SectionKicker>Decisión recomendada</SectionKicker>
                        {actionablePriorities.length ? (
                          <div className="mt-3 space-y-3">
                            {actionablePriorities.slice(0, 2).map((priority) => (
                              <div key={`grid-${priority.key}`} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-black text-slate-900">{priority.solutionTitle}</h5>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                                    {priority.evidenceLabel}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-600">{priority.finding}</p>
                                <button
                                  type="button"
                                  onClick={() => navigate(priority.route)}
                                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#D32323] px-3 py-2 text-[10px] font-black text-white"
                                >
                                  Ver solución
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <p className="text-sm leading-6 text-emerald-800">
                                No detectamos una necesidad urgente de mejorar ranking en este radio. Mantén la posición y vuelve a medir cuando cambien reseñas, competidores o cobertura.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
