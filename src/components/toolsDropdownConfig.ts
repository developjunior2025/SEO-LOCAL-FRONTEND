import {
  BarChart3,
  FileCheck,
  Globe2,
  MapPin,
  MousePointerClick,
  ShieldCheck,
  Star,
  WalletCards,
} from 'lucide-react';

export const AUDIT_TAB_OPTIONS = [
  { key: 'summary', label: 'Centro de Auditoría 360', description: 'Vista consolidada de salud, trabajo y ROI.' },
  { key: 'proof', label: 'Cadena de Evidencia', description: 'Cadenas verificadas y libro mayor de evidencias.' },
  { key: 'rankings', label: 'Rankings y GeoGrid', description: 'CVL, posiciones y mapa de competencia.' },
  { key: 'listings', label: 'Google Business Profile y Listings', description: 'Integridad NAP y estado por directorio.' },
  { key: 'reviews', label: 'Reseñas y Reputación', description: 'Rating, sentimiento y cola de respuesta.' },
  { key: 'site', label: 'SEO Técnico y Autoridad', description: 'Salud técnica, errores y autoridad.' },
  { key: 'ads', label: 'SEM y Conversiones', description: 'Inversión, leads, CPL y ROAS.' },
  { key: 'files', label: 'Entregables y Aprobaciones', description: 'Documentos, versiones y aprobaciones.' },
] as const;

export type AuditTabKey = (typeof AUDIT_TAB_OPTIONS)[number]['key'];

export function isValidAuditTab(value: string): value is AuditTabKey {
  return AUDIT_TAB_OPTIONS.some((opt) => opt.key === value);
}

export function buildAuditUrl(tab: AuditTabKey) {
  return `/herramientas/auditorias?tab=${tab}`;
}

function isInternalRoute(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export function safeReturnTo(returnTo: string | null, fallback: string) {
  if (!returnTo) return fallback;
  try {
    const decoded = decodeURIComponent(returnTo);
    if (isInternalRoute(decoded)) return decoded;
  } catch {
    return fallback;
  }
  return fallback;
}

export function redirectAfterLogin(returnTo: string | null) {
  return safeReturnTo(returnTo, '/dashboard');
}

export const AUDIT_TAB_ICONS: Record<AuditTabKey, React.ElementType> = {
  summary: BarChart3,
  proof: FileCheck,
  rankings: MapPin,
  listings: Globe2,
  reviews: Star,
  site: ShieldCheck,
  ads: MousePointerClick,
  files: WalletCards,
};
