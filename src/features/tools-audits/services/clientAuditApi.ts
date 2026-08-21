// V5385_CC360_PAYLOAD_NORMALIZER
import { apiFetch, isDemoDataEnabled } from '@/lib/apiConfig';
import type { ClientAuditData } from '../types/audit';
import { clientAuditDemoData } from '../data/clientAuditDemoData';

export interface ClientAuditApiState {
  data: ClientAuditData | null;
  loading: boolean;
  error: string | null;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function record(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Normaliza la respuesta del backend para que Command Center 360 nunca dependa
 * de secciones opcionales o arrays ausentes. Los valores reales se conservan;
 * solo se rellenan defaults estructurales seguros.
 */
export function normalizeClientAuditData(input: unknown): ClientAuditData {
  const root = record(input);
  const project = record(root.project);
  const summary = record(root.summary);
  const timeline = record(root.timeline);
  const evidence = record(root.evidence);
  const rankings = record(root.rankings);
  const listings = record(root.listings);
  const reviews = record(root.reviews);
  const site = record(root.site);
  const ads = record(root.ads);
  const files = record(root.files);

  return {
    project: {
      id: text(project.id, 'PENDIENTE'),
      name: text(project.name, 'Proyecto SEO Local'),
      status: (text(project.status, 'En revisión') as ClientAuditData['project']['status']),
      serviceLine: text(project.serviceLine, 'Command Center 360'),
      location: text(project.location, 'Pendiente de configurar'),
      auditId: text(project.auditId, 'PENDIENTE'),
      logoLetters: text(project.logoLetters, 'SL'),
    },
    summary: {
      health: numberValue(summary.health),
      healthDelta: numberValue(summary.healthDelta),
      workVerified: numberValue(summary.workVerified),
      workDelta: numberValue(summary.workDelta),
      resultAchieved: numberValue(summary.resultAchieved),
      resultDelta: numberValue(summary.resultDelta),
      dataConfidence: numberValue(summary.dataConfidence),
      confidenceLabel: text(summary.confidenceLabel, 'Pendiente de datos'),
      roi: numberValue(summary.roi),
      roiLabel: text(summary.roiLabel, 'Sin medición'),
    },
    dimensions: list<ClientAuditData['dimensions'][number]>(root.dimensions),
    compareRows: list<ClientAuditData['compareRows'][number]>(root.compareRows),
    sources: list<ClientAuditData['sources'][number]>(root.sources),
    stories: list<ClientAuditData['stories'][number]>(root.stories),
    timeline: {
      points: list<ClientAuditData['timeline']['points'][number]>(timeline.points),
      snapshots: list<ClientAuditData['timeline']['snapshots'][number]>(timeline.snapshots),
    },
    evidence: {
      chain: list<ClientAuditData['evidence']['chain'][number]>(evidence.chain),
      ledger: list<ClientAuditData['evidence']['ledger'][number]>(evidence.ledger),
    },
    rankings: {
      kpis: list<ClientAuditData['rankings']['kpis'][number]>(rankings.kpis),
      geoKeyword: text(rankings.geoKeyword),
      geoGridSize: text(rankings.geoGridSize),
      geoPoints: list<ClientAuditData['rankings']['geoPoints'][number]>(rankings.geoPoints),
      competitors: list<ClientAuditData['rankings']['competitors'][number]>(rankings.competitors),
    },
    listings: {
      kpis: list<ClientAuditData['listings']['kpis'][number]>(listings.kpis),
      directories: list<ClientAuditData['listings']['directories'][number]>(listings.directories),
    },
    reviews: {
      kpis: list<ClientAuditData['reviews']['kpis'][number]>(reviews.kpis),
      topics: list<ClientAuditData['reviews']['topics'][number]>(reviews.topics),
      queue: list<ClientAuditData['reviews']['queue'][number]>(reviews.queue),
    },
    site: {
      kpis: list<ClientAuditData['site']['kpis'][number]>(site.kpis),
      issues: list<ClientAuditData['site']['issues'][number]>(site.issues),
    },
    ads: {
      kpis: list<ClientAuditData['ads']['kpis'][number]>(ads.kpis),
      funnel: list<ClientAuditData['ads']['funnel'][number]>(ads.funnel),
      campaigns: list<ClientAuditData['ads']['campaigns'][number]>(ads.campaigns),
    },
    files: {
      deliverables: list<ClientAuditData['files']['deliverables'][number]>(files.deliverables),
      approvals: list<ClientAuditData['files']['approvals'][number]>(files.approvals),
    },
    actions: list<NonNullable<ClientAuditData['actions']>[number]>(root.actions),
  };
}

export async function fetchClientAudit(signal?: AbortSignal): Promise<ClientAuditData> {
  if (isDemoDataEnabled()) {
    return normalizeClientAuditData(clientAuditDemoData);
  }
  const payload = await apiFetch<unknown>('/client/audits/current', {}, { signal });
  return normalizeClientAuditData(payload);
}
