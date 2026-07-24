export interface AuditProject {
  id: string;
  name: string;
  status: 'Activo' | 'Pausado' | 'En revisión';
  serviceLine: string;
  location: string;
  auditId: string;
  logoLetters: string;
}

export interface AuditSummary {
  health: number;
  healthDelta: number;
  workVerified: number;
  workDelta: number;
  resultAchieved: number;
  resultDelta: number;
  dataConfidence: number;
  confidenceLabel: string;
  roi: number;
  roiLabel: string;
}

export interface AuditDimension {
  key: string;
  label: string;
  value: string;
  detail: string;
  detailKpis: Array<{ label: string; value: string }>;
  sourceKpis: Array<{ label: string; value: string }>;
}

export interface AuditCompareRow {
  label: string;
  width: number;
  value: string;
}

export interface AuditDataSource {
  key: string;
  label: string;
  status: string;
  updatedAt: string;
}

export interface AuditStory {
  key: string;
  step: number;
  title: string;
  subtitle: string;
  detailTitle: string;
  detailText: string;
  stats: Array<{ label: string; value: string }>;
}

export interface AuditTimelinePoint {
  label: string;
  value: string;
}

export interface AuditTimelineSnapshot {
  label: string;
  health: string;
  cvl: string;
  nap: string;
  response: string;
  cpl: string;
}

export interface AuditEvidenceStep {
  number: number;
  phase: string;
  title: string;
  description: string;
}

export interface AuditLedgerRow {
  id: string;
  action: string;
  evidence: string;
  verification: string;
  change: string;
  status: 'Aprobado' | 'Revisión' | 'Pendiente';
}

export interface AuditRanking {
  keyword: string;
  top3: number;
  top10: number;
  networkPosition: number;
  gapToLeader: number;
  leader: string;
}

export interface AuditCompetitor {
  name: string;
  cvl: number;
  tag: string;
}

export interface AuditGeoPoint {
  rankBucket: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
}

export interface AuditListing {
  directory: string;
  nap: string;
  hours: string;
  category: string;
  duplicate: string;
  status: string;
}

export interface AuditReviewTopic {
  topic: string;
  mentions: number;
  score: number;
  trend: string;
}

export interface AuditReviewQueueItem {
  platform: string;
  rating: number;
  age: string;
  priority: 'Urgente' | 'Revisar' | 'Responder';
}

export interface AuditTechnicalIssue {
  severity: 'Crítico' | 'Alto' | 'Medio';
  finding: string;
  impact: string;
  confidence: string;
  status: string;
}

export interface AuditFunnelRow {
  label: string;
  value: string;
}

export interface AuditCampaign {
  name: string;
  platform: string;
  roas: number;
  status: string;
}

export interface AuditDeliverable {
  name: string;
  type: string;
  status: string;
}

export interface AuditApproval {
  name: string;
  detail: string;
  status: string;
}

export interface AuditAction {
  key: string;
  title: string;
  subtitle?: string;
  owner: 'cliente' | 'vendedor' | 'agencia' | string;
  status: 'Pendiente' | 'Bloqueo' | 'En ejecución' | 'Aprobado' | string;
  priority?: 'baja' | 'media' | 'alta';
}

export interface ClientAuditData {
  project: AuditProject;
  summary: AuditSummary;
  dimensions: AuditDimension[];
  compareRows: AuditCompareRow[];
  sources: AuditDataSource[];
  stories: AuditStory[];
  timeline: {
    points: AuditTimelinePoint[];
    snapshots: AuditTimelineSnapshot[];
  };
  evidence: {
    chain: AuditEvidenceStep[];
    ledger: AuditLedgerRow[];
  };
  rankings: {
    kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
    geoKeyword: string;
    geoGridSize: string;
    geoPoints: AuditGeoPoint[];
    competitors: AuditCompetitor[];
  };
  listings: {
    kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
    directories: AuditListing[];
  };
  reviews: {
    kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
    topics: AuditReviewTopic[];
    queue: AuditReviewQueueItem[];
  };
  site: {
    kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
    issues: AuditTechnicalIssue[];
  };
  ads: {
    kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
    funnel: AuditFunnelRow[];
    campaigns: AuditCampaign[];
  };
  files: {
    deliverables: AuditDeliverable[];
    approvals: AuditApproval[];
  };
  actions?: AuditAction[];
}
