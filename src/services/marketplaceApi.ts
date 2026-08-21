import { apiFetch } from '@/lib/apiConfig';
import { Agency, AgencyProfilePayload, MarketplaceCategory, Offer, Service } from '../types';

export interface MarketplaceBootstrapPayload {
  meta: {
    source: 'standalone-postgresql' | string;
    database: string;
    version: string;
    odooConnected: false;
  };
  categories: MarketplaceCategory[];
  agencies: Agency[];
  services: Service[];
  offers?: Offer[];
}


export interface CreateAgencyReviewPayload {
  authorName: string;
  rating: number;
  body: string;
  title?: string;
  email?: string;
}

export interface CreateAgencyReviewResponse {
  ok: boolean;
  review: {
    id: string;
    author: string;
    rating: number;
    body: string;
    createdAt: string;
    verified: boolean;
  };
}

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectTitle?: string;
  categoryId?: string;
  location?: string;
  budget?: number;
  description: string;
  requestType?: 'project' | 'audit' | 'consultation';
  sourcePath?: string;
}

export interface CreateLeadResponse {
  ok: boolean;
  leadId: number;
  reference: string;
  createdAt?: string;
}

export interface FunctionalMetric {
  label: string;
  value: string | number;
}

export interface FunctionalScore {
  label: string;
  value: number;
}

export interface RankGridCell {
  row: number;
  col: number;
  rank: number;
  zone: string;
}

export interface FunctionalResult {
  moduleCode: 'audit-seo-local' | 'google-business-profile' | 'local-pack-ranking' | 'link-building-local' | 'seo-tecnico-local' | 'seo-on-page-local' | 'reputacion-y-resenas' | 'citaciones-y-nap' | 'reportes-y-analytics' | 'mapas-calor-local' | 'contenido-local' | 'seo-local-ecommerce' | 'consultoria-estrategia';
  headline: string;
  overallScore: number;
  visibilityScore?: number;
  top3Coverage?: number;
  gridSize?: number;
  grid?: RankGridCell[];
  moduleScores: FunctionalScore[];
  metrics: FunctionalMetric[];
  recommendations: string[];
  nextSteps: string[];
}

export interface FunctionalEvaluationResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  result: FunctionalResult;
}


export interface LinkBuildingQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  directories: number;
  media: number;
  sponsorships: number;
  blogs: number;
  institutional: number;
  includeReport: boolean;
}

export interface LinkBuildingQuoteItem {
  code: string;
  label: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface LinkBuildingQuoteResult {
  totalLinks: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  includeReport: boolean;
  authorityMix: number;
  localRelevance: number;
  items: LinkBuildingQuoteItem[];
}

export interface LinkBuildingQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: LinkBuildingQuoteResult;
}


export interface SeoTecnicoQuoteModules {
  audit: boolean;
  wpo: boolean;
  mobile: boolean;
  architecture: boolean;
  schema: boolean;
  indexation: boolean;
  internalLinks: boolean;
  security: boolean;
  geolocation: boolean;
  resources: boolean;
}

export interface SeoTecnicoQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  pagesIndexed?: number;
  crawlErrors?: number;
  localLandingPages?: number;
  modules: SeoTecnicoQuoteModules;
}

export interface SeoTecnicoQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface SeoTecnicoQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  complexityFactor: number;
  estimatedHours: number;
  items: SeoTecnicoQuoteItem[];
}

export interface SeoTecnicoQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: SeoTecnicoQuoteResult;
}



export interface OnPageLocalQuoteModules {
  titles: boolean;
  metaDescriptions: boolean;
  headings: boolean;
  localContent: boolean;
  friendlyUrls: boolean;
  images: boolean;
  internalLinks: boolean;
  structuredData: boolean;
  mobileOptimization: boolean;
  cta: boolean;
}

export interface OnPageLocalQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  targetPages?: number;
  currentGooglePosition?: number;
  monthlyTraffic?: number;
  modules: OnPageLocalQuoteModules;
}

export interface OnPageLocalQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface OnPageLocalQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  conversionReadiness: number;
  items: OnPageLocalQuoteItem[];
}

export interface OnPageLocalQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: OnPageLocalQuoteResult;
}


export interface ReputationQuoteModules {
  strategy: boolean;
  generation: boolean;
  response: boolean;
  monitoring: boolean;
  automation: boolean;
  platforms: boolean;
  sentiment: boolean;
  reporting: boolean;
}

export interface ReputationQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  currentRating?: number;
  totalReviews?: number;
  monthlyReviews?: number;
  unansweredReviews?: number;
  negativeReviews?: number;
  modules: ReputationQuoteModules;
}

export interface ReputationQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface ReputationQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  reputationReadiness: number;
  reviewGrowthTarget: number;
  items: ReputationQuoteItem[];
}

export interface ReputationQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: ReputationQuoteResult;
}



export interface CitationsNapQuoteModules {
  audit: boolean;
  cleanup: boolean;
  creation: boolean;
  duplicates: boolean;
  aggregators: boolean;
  appleBing: boolean;
  monitoring: boolean;
  reporting: boolean;
}

export interface CitationsNapQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  directoriesChecked?: number;
  consistentDirectories?: number;
  inconsistentDirectories?: number;
  missingDirectories?: number;
  duplicateListings?: number;
  modules: CitationsNapQuoteModules;
}

export interface CitationsNapQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface CitationsNapQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  napReadiness: number;
  correctionTarget: number;
  newCitationTarget: number;
  items: CitationsNapQuoteItem[];
}

export interface CitationsNapQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: CitationsNapQuoteResult;
}


export interface ReportsAnalyticsQuoteModules {
  dashboard: boolean;
  ranking: boolean;
  gbpPerformance: boolean;
  multiLocation: boolean;
  conversionTracking: boolean;
  alerts: boolean;
  executiveReport: boolean;
  competitors: boolean;
}

export interface ReportsAnalyticsQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  dashboardsConnected?: number;
  rankingKeywords?: number;
  multiLocations?: number;
  mapVisibility?: number;
  modules: ReportsAnalyticsQuoteModules;
}

export interface ReportsAnalyticsQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface ReportsAnalyticsQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  reportingReadiness: number;
  dashboardCount: number;
  kpiCount: number;
  items: ReportsAnalyticsQuoteItem[];
}

export interface ReportsAnalyticsQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: ReportsAnalyticsQuoteResult;
}


export interface HeatMapsLocalQuoteModules {
  currentMap: boolean;
  historical: boolean;
  pdfReport: boolean;
  competitors: boolean;
  recommendations: boolean;
  alerts: boolean;
  multiKeyword: boolean;
  monthlyTracking: boolean;
}

export interface HeatMapsLocalQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  gridSize?: number;
  keywordsCount?: number;
  competitorsCount?: number;
  scanFrequency?: 'monthly' | 'biweekly' | 'weekly';
  centerRank?: number;
  mapVisibility?: number;
  top3Coverage?: number;
  modules: HeatMapsLocalQuoteModules;
}

export interface HeatMapsLocalQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface HeatMapsLocalQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  heatmapReadiness: number;
  scansPerMonth: number;
  reportsPerMonth: number;
  items: HeatMapsLocalQuoteItem[];
}

export interface HeatMapsLocalQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: HeatMapsLocalQuoteResult;
}



export interface ContentLocalQuoteModules {
  blogArticles: boolean;
  localNews: boolean;
  gbpPosts: boolean;
  faq: boolean;
  guides: boolean;
  multimedia: boolean;
  keywordPlan: boolean;
  publishingCalendar: boolean;
}

export interface ContentLocalQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  monthlyArticles?: number;
  gbpPosts?: number;
  faqItems?: number;
  guidesCount?: number;
  multimediaAssets?: number;
  monthlyTraffic?: number;
  gbpViews?: number;
  modules: ContentLocalQuoteModules;
}

export interface ContentLocalQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface ContentLocalQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  contentReadiness: number;
  expectedArticles: number;
  expectedPosts: number;
  items: ContentLocalQuoteItem[];
}

export interface ContentLocalQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: ContentLocalQuoteResult;
}



export interface EcommerceLocalQuoteModules {
  localLanding: boolean;
  categoryPages: boolean;
  productPages: boolean;
  technicalSeo: boolean;
  schema: boolean;
  contentStrategy: boolean;
  conversionTracking: boolean;
  gbpProducts: boolean;
}

export interface EcommerceLocalQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  productCount?: number;
  categoryPages?: number;
  localLandingPages?: number;
  monthlyOrganicSessions?: number;
  monthlyRevenue?: number;
  modules: EcommerceLocalQuoteModules;
}

export interface EcommerceLocalQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface EcommerceLocalQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  ecommerceReadiness: number;
  expectedRevenueLift: number;
  expectedConversionRate: number;
  items: EcommerceLocalQuoteItem[];
}

export interface EcommerceLocalQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: EcommerceLocalQuoteResult;
}

export interface ConsultingQuoteModules {
  diagnosis: boolean;
  research: boolean;
  strategy: boolean;
  roadmap: boolean;
  kpis: boolean;
  contentPlan: boolean;
  authority: boolean;
  followUp: boolean;
}

export interface ConsultingQuotePayload {
  businessName: string;
  email?: string;
  website?: string;
  location?: string;
  keyword?: string;
  businessStage?: string;
  monthlyLeads?: number;
  monthlyCalls?: number;
  avgRank?: number;
  visibilityScore?: number;
  budget?: number;
  modules: ConsultingQuoteModules;
}

export interface ConsultingQuoteItem {
  code: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  estimatedHours: number;
}

export interface ConsultingQuoteResult {
  modulesCount: number;
  estimatedPrice: number;
  estimatedDeliveryDays: number;
  estimatedHours: number;
  strategicReadiness: number;
  expectedLeadLift: number;
  expectedCallLift: number;
  items: ConsultingQuoteItem[];
}

export interface ConsultingQuoteResponse {
  ok: boolean;
  id: number;
  reference: string;
  createdAt: string;
  quote: ConsultingQuoteResult;
}


export interface LocalPackBusiness {
  position: number;
  title: string;
  rating: number | null;
  reviews: number | null;
  price: string;
  type: string;
  types: string[];
  address: string;
  openState: string;
  hours: string;
  phone: string;
  website: string;
  description: string;
  imageUrl: string;
  imageFallbackUrl: string;
  photosLink: string;
  reviewsLink: string;
  placeSearchLink: string;
  serviceOptions: Record<string, boolean>;
  lat: number | null;
  lng: number | null;
  placeId: string;
  dataId: string;
  dataCid: string;
}

export interface LocalPackMarketSummary {
  returnedResults: number;
  top3AverageRating: number | null;
  top3AverageReviews: number | null;
  top10AverageRating: number | null;
  top10AverageReviews: number | null;
  top10WebsiteCoverage: number;
  top10PhoneCoverage: number;
  top10HoursCoverage: number;
  reviewLeader: {
    title: string;
    reviews: number;
    position: number;
  } | null;
  ratingLeader: {
    title: string;
    rating: number;
    position: number;
  } | null;
  dominantTypes: Array<{ type: string; count: number }>;
}

export interface LocalPlaceDetails {
  imported: true;
  sourceSearchId: string;
  imageUrl: string;
  images: Array<{
    title: string;
    url: string;
    lastUpdated: string;
  }>;
  photosCount: number;
  postsCount: number;
  visibleSignals: {
    phone: boolean;
    website: boolean;
    hours: boolean;
    description: boolean;
    image: boolean;
    categories: boolean;
    present: number;
    total: 6;
    score: number;
  };
}

export interface ProductMatch {
  code: string;
  title: string;
  route: string;
  severity: 'critical' | 'opportunity' | 'positive';
  evidence: string;
  reason: string;
}

export interface LocalVisibilityPreviewPayload {
  action: 'pack' | 'details' | 'grid';
  query: string;
  targetName?: string;
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
  radiusKm?: number;
  identity?: LocalPackBusiness;
  market?: LocalPackMarketSummary | null;
}

export interface LocalVisibilityPreviewResponse {
  ok: true;
  version: 'V0.4';
  mode: 'live-google-maps';
  action: 'pack' | 'details' | 'grid';
  reference: string;
  generatedAt: string;
  query: string;
  searchInterpretation?: {
    mode: 'local-pack' | 'direct-place' | 'business-match';
    inputQuery: string;
    resolvedQuery: string;
    corrected: boolean;
    rankingEligible: boolean;
    message: string;
  };
  directMatch?: LocalPackBusiness | null;
  keywordSuggestions?: string[];
  origin: {
    lat: number;
    lng: number;
    accuracyMeters: number | null;
  };
  localResults: LocalPackBusiness[];
  market: LocalPackMarketSummary | null;
  target: {
    found: boolean;
    position: number | null;
    title: string;
    rating: number | null;
    reviews: number | null;
    reviewGapVsTop3: number | null;
    ratingGapVsTop3: number | null;
    top3: boolean;
  } | null;
  productMatches: ProductMatch[];
  selectedBusiness: LocalPackBusiness | null;
  placeDetails: LocalPlaceDetails | null;
  grid: Array<{
    row: number;
    col: number;
    lat: number;
    lng: number;
    rank: number | null;
    band: 'top3' | 'top10' | 'top20' | 'out';
    distanceKm: number;
    bearing: string;
    searchId: string;
    topCompetitors: Array<{
      position: number;
      title: string;
      rating: number | null;
      reviews: number | null;
      type: string;
      placeId: string;
    }>;
  }>;
  metrics: {
    visibilityScore: number;
    averageRank: number | null;
    centerRank: number | null;
    top3Coverage: number;
    top10Coverage: number;
    top20Coverage: number;
    outsideTop20: number;
    notFound: number;
    points: number;
    radiusKm: number;
    weakestDirection: string;
    competitorLeaders: Array<{
      title: string;
      type: string;
      placeId: string;
      rating: number | null;
      reviews: number | null;
      appearances: number;
      top3Appearances: number;
      averagePosition: number;
      bestPosition: number;
    }>;
  } | null;
  providerSearchUrl: string | null;
  sources: {
    ranking: 'Google Maps via SerpApi';
    map: 'OpenStreetMap';
    fresh: true;
    modeled: false;
    detailImported: boolean;
  };
  usage: {
    providerSearchesThisAction: number;
    note: string;
  };
  notice: string;
  attribution: string;
}

export type FunctionalModuleCode = 'audit-seo-local' | 'google-business-profile' | 'local-pack-ranking' | 'link-building-local' | 'seo-tecnico-local' | 'seo-on-page-local' | 'reputacion-y-resenas' | 'citaciones-y-nap' | 'reportes-y-analytics' | 'mapas-calor-local' | 'contenido-local' | 'seo-local-ecommerce' | 'consultoria-estrategia';

export type FunctionalEvaluationPayload = Record<string, string | number | boolean | undefined | null>;

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  signal?: AbortSignal,
  timeoutMs?: number,
): Promise<T> {
  return apiFetch<T>(
    path,
    init,
    timeoutMs ? { signal, timeoutMs } : { signal },
  );
}

const toolPathByModule: Record<FunctionalModuleCode, string> = {
  'audit-seo-local': '/tools/audit-seo-local/evaluate',
  'google-business-profile': '/tools/google-business-profile/evaluate',
  'local-pack-ranking': '/tools/local-pack-ranking/evaluate',
  'link-building-local': '/tools/link-building-local/evaluate',
  'seo-tecnico-local': '/tools/seo-tecnico-local/evaluate',
  'seo-on-page-local': '/tools/seo-on-page-local/evaluate',
  'reputacion-y-resenas': '/tools/reputacion-y-resenas/evaluate',
  'citaciones-y-nap': '/tools/citaciones-y-nap/evaluate',
  'reportes-y-analytics': '/tools/reportes-y-analytics/evaluate',
  'mapas-calor-local': '/tools/mapas-calor-local/evaluate',
  'contenido-local': '/tools/contenido-local/evaluate',
  'seo-local-ecommerce': '/tools/seo-local-ecommerce/evaluate',
  'consultoria-estrategia': '/tools/consultoria-estrategia/evaluate',
};

export const marketplaceApi = {
  getBootstrap(signal?: AbortSignal) {
    return requestJson<MarketplaceBootstrapPayload>('/bootstrap', {}, signal);
  },

  getHealth(signal?: AbortSignal) {
    return requestJson<{
      ok: boolean;
      database: string;
      version: string;
      architecture: string;
      odooConnected: false;
    }>('/health', { signal });
  },


  getServices(params?: { furOnly?: boolean; category?: string }, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (params?.furOnly) query.set('furOnly', 'true');
    if (params?.category) query.set('category', params.category);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return requestJson<{ items: Service[] }>(`/services${suffix}`, { signal });
  },


  getAgencyProfile(identifier: string, signal?: AbortSignal) {
    return requestJson<AgencyProfilePayload>(`/agencies/${encodeURIComponent(identifier)}/profile`, { signal });
  },

  createAgencyReview(identifier: string, payload: CreateAgencyReviewPayload) {
    return requestJson<CreateAgencyReviewResponse>(`/agencies/${encodeURIComponent(identifier)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createLead(payload: CreateLeadPayload) {
    return requestJson<CreateLeadResponse>('/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  localVisibilityPreview(payload: LocalVisibilityPreviewPayload) {
    // SEOLOCAL_LOCAL_VISIBILITY_TIMEOUT_POLICY_V1
    // Pack/details: 60s. GeoGrid: 180s. Global API default remains unchanged.
    const timeoutMs = payload.action === 'grid' ? 180_000 : 60_000;
    return requestJson<LocalVisibilityPreviewResponse>(
      '/tools/local-visibility/preview',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      undefined,
      timeoutMs,
    );
  },

  evaluateFunctionalModule(moduleCode: FunctionalModuleCode, payload: FunctionalEvaluationPayload) {
    return requestJson<FunctionalEvaluationResponse>(toolPathByModule[moduleCode], {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getFunctionalAssessment(reference: string, signal?: AbortSignal) {
    return requestJson<{ item: unknown }>(`/tools/assessments/${encodeURIComponent(reference)}`, { signal });
  },

  createLinkBuildingQuote(payload: LinkBuildingQuotePayload) {
    return requestJson<LinkBuildingQuoteResponse>('/tools/link-building-local/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createSeoTecnicoQuote(payload: SeoTecnicoQuotePayload) {
    return requestJson<SeoTecnicoQuoteResponse>('/tools/seo-tecnico-local/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createOnPageLocalQuote(payload: OnPageLocalQuotePayload) {
    return requestJson<OnPageLocalQuoteResponse>('/tools/seo-on-page-local/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createReputationQuote(payload: ReputationQuotePayload) {
    return requestJson<ReputationQuoteResponse>('/tools/reputacion-y-resenas/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createCitationsNapQuote(payload: CitationsNapQuotePayload) {
    return requestJson<CitationsNapQuoteResponse>('/tools/citaciones-y-nap/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },


  createReportsAnalyticsQuote(payload: ReportsAnalyticsQuotePayload) {
    return requestJson<ReportsAnalyticsQuoteResponse>('/tools/reportes-y-analytics/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createHeatMapsLocalQuote(payload: HeatMapsLocalQuotePayload) {
    return requestJson<HeatMapsLocalQuoteResponse>('/tools/mapas-calor-local/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createContentLocalQuote(payload: ContentLocalQuotePayload) {
    return requestJson<ContentLocalQuoteResponse>('/tools/contenido-local/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createEcommerceLocalQuote(payload: EcommerceLocalQuotePayload) {
    return requestJson<EcommerceLocalQuoteResponse>('/tools/seo-local-ecommerce/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createConsultingQuote(payload: ConsultingQuotePayload) {
    return requestJson<ConsultingQuoteResponse>('/tools/consultoria-estrategia/package-quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listFunctionalAssessments(params?: { email?: string; moduleCode?: FunctionalModuleCode }, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (params?.email) query.set('email', params.email);
    if (params?.moduleCode) query.set('moduleCode', params.moduleCode);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return requestJson<{ items: unknown[] }>(`/tools/assessments${suffix}`, { signal });
  },

  getActiveOffers(signal?: AbortSignal) {
    return requestJson<{ items: Offer[] }>('/offers/active', { signal });
  },

  claimOffer(offerId: string, payload: { email: string; name?: string; phone?: string }) {
    return requestJson<{ ok: boolean; reference: string }>(`/offers/${offerId}/claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  hireAgency(agencyIdentifier: string, payload: { name: string; email: string; phone?: string; company?: string; description?: string }) {
    return requestJson<{ ok: boolean; reference: string }>(`/agencies/${encodeURIComponent(agencyIdentifier)}/hire`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
