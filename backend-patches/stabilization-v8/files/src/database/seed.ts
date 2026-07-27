import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import {
  SeoPermissionRule,
  SeoDashboardRole,
  SeoRolePermissionRel,
  SeoUserAccount,
  SeoUserRoleAssignment,
  SeoUserProfile,
  SeoProfileType,
  SeoClientProfile,
  SeoClientAudit,
  SeoClientCitationDraft,
  SeoLeadStage,
  SeoPlan,
  SeoServiceCategory,
  SeoService,
  SeoServiceCategoryRel,
  SeoFunctionalModule,
  SeoAgencyProfile,
  SeoAgencyProfileDetail,
  SeoAgencyTeamMember,
  SeoAgencyCertification,
  SeoAgencyChannel,
  SeoAgencyBusinessHour,
  SeoAgencyTrustItem,
  SeoAgencyService,
  SeoReview,
  SeoServiceDetail,
  SeoOffer,
} from './entities';
import { slugify } from '../common/utils/reference';
import { buildDemoAuditPayload } from '../modules/client/demo-audit.payload';
import { buildDefaultCitationDraft } from '../modules/client/default-citation.payload';

const PERMISSION_MODULES: Record<string, string[]> = {
  users: ['users.read', 'users.manage'],
  agencies: ['agencies.read', 'agencies.update', 'agencies.own.update'],
  agency_profile: ['agency_profile.modules'],
  agency_services: ['agency_services.read', 'agency_services.manage'],
  services: ['services.read', 'services.manage'],
  leads: ['leads.read', 'leads.manage'],
  reviews: ['reviews.read', 'reviews.moderate'],
  plans: ['plans.read', 'plans.manage'],
  categories: ['categories.read', 'categories.manage'],
  reports: ['reports.read'],
  audit: ['audit.read'],
};

const ALL_PERMISSIONS = Object.values(PERMISSION_MODULES).flat();

const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ALL_PERMISSIONS,
  marketplace_admin: ALL_PERMISSIONS.filter(
    (p) => p !== 'users.manage' || true,
  ),
  agency_manager: [
    'agencies.own.update',
    'agency_profile.modules',
    'agency_services.read',
    'leads.read',
    'reviews.read',
    'reports.read',
  ],
  support_moderator: [
    'reviews.read',
    'reviews.moderate',
    'leads.read',
    'audit.read',
  ],
  sales_operator: ['leads.read', 'leads.manage', 'agencies.read'],
  content_manager: [
    'services.read',
    'services.manage',
    'categories.read',
    'categories.manage',
  ],
  analyst: [
    'reports.read',
    'audit.read',
    'agencies.read',
    'services.read',
    'leads.read',
    'reviews.read',
  ],
  client: [],
};

const ROLE_DEFS = [
  { code: 'superadmin', name: 'Superadministrador', sequence: 1 },
  {
    code: 'marketplace_admin',
    name: 'Administrador del marketplace',
    sequence: 2,
  },
  { code: 'agency_manager', name: 'Gestor de agencia', sequence: 3 },
  { code: 'support_moderator', name: 'Soporte / moderador', sequence: 4 },
  { code: 'sales_operator', name: 'Operador comercial', sequence: 5 },
  { code: 'content_manager', name: 'Gestor de contenido', sequence: 6 },
  { code: 'analyst', name: 'Analista', sequence: 7 },
  { code: 'client', name: 'Cliente', sequence: 8 },
];

function envPassword(login: string): string | null {
  const key = `SEED_PASSWORD_${login.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  return process.env[key] ?? null;
}

const DEMO_USERS = [
  {
    login: 'admin@seolocalmarketplace.com',
    name: 'Superadmin SEO Local',
    role: 'superadmin',
    password: envPassword('admin@seolocalmarketplace.com'),
  },
  {
    login: 'owner@seolocalmarketplace.com',
    name: 'Dueño del marketplace',
    role: 'marketplace_admin',
    password: envPassword('owner@seolocalmarketplace.com'),
  },
  {
    login: 'support@seolocalmarketplace.com',
    name: 'Soporte SEO Local',
    role: 'support_moderator',
    password: envPassword('support@seolocalmarketplace.com'),
  },
  {
    login: 'sales@seolocalmarketplace.com',
    name: 'Ventas SEO Local',
    role: 'sales_operator',
    password: envPassword('sales@seolocalmarketplace.com'),
  },
  {
    login: 'vendedor@seolocal.com',
    name: 'Vendedor SEO Local',
    role: 'sales_operator',
    password: envPassword('vendedor@seolocal.com'),
  },
  {
    login: 'content@seolocalmarketplace.com',
    name: 'Contenido SEO Local',
    role: 'content_manager',
    password: envPassword('content@seolocalmarketplace.com'),
  },
  {
    login: 'analyst@seolocalmarketplace.com',
    name: 'Analista SEO Local',
    role: 'analyst',
    password: envPassword('analyst@seolocalmarketplace.com'),
  },
  {
    login: 'agency@seolocalmarketplace.com',
    name: 'Gestor de agencia demo',
    role: 'agency_manager',
    password: envPassword('agency@seolocalmarketplace.com'),
  },
];

const CLIENT_USER = {
  login: 'cliente@clinicasonrisa.com',
  email: 'cliente@clinicasonrisa.com',
  name: 'Clínica Sonrisa',
  role: 'client',
  password: envPassword('cliente@clinicasonrisa.com'),
};

const LEAD_STAGES = [
  { name: 'Nuevo', sequence: 1, probability: 10 },
  { name: 'Contactado', sequence: 2, probability: 25 },
  { name: 'Calificado', sequence: 3, probability: 40 },
  { name: 'Cotización enviada', sequence: 4, probability: 60 },
  { name: 'Negociación', sequence: 5, probability: 75 },
  { name: 'Ganado', sequence: 6, probability: 100, isWon: true },
  { name: 'Perdido', sequence: 7, probability: 0 },
];

const PLANS = [
  {
    name: 'Starter',
    planCode: 'starter',
    monthlyPrice: 49,
    maxServices: 5,
    maxLeads: 25,
    supportLevel: 'standard',
  },
  {
    name: 'Growth',
    planCode: 'growth',
    monthlyPrice: 149,
    maxServices: 20,
    maxLeads: 150,
    featuredListing: true,
    verifiedBadge: true,
    supportLevel: 'priority',
  },
  {
    name: 'Enterprise',
    planCode: 'enterprise',
    monthlyPrice: 399,
    maxServices: 100,
    maxLeads: 1000,
    featuredListing: true,
    verifiedBadge: true,
    supportLevel: 'enterprise',
  },
];

interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  imageUrl?: string;
  queryName: string;
  hasQuote: boolean;
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'auditoria-seo-local',
    name: 'Auditoría SEO Local',
    description: 'Diagnóstico integral de tu presencia local.',
    iconName: 'search-check',
    queryName: 'audit-seo-local',
    hasQuote: false,
  },
  {
    slug: 'google-business-profile',
    name: 'Google Business Profile',
    description: 'Optimización y gestión de tu ficha de Google.',
    iconName: 'map-pin',
    queryName: 'google-business-profile',
    hasQuote: false,
  },
  {
    slug: 'local-pack-y-ranking',
    name: 'Local Pack y Ranking',
    description: 'Posicionamiento en el mapa y resultados locales.',
    iconName: 'map',
    queryName: 'local-pack-ranking',
    hasQuote: false,
  },
  {
    slug: 'link-building-local',
    name: 'Link Building Local',
    description: 'Autoridad y enlaces de relevancia local.',
    iconName: 'link',
    queryName: 'link-building-local',
    hasQuote: true,
  },
  {
    slug: 'seo-tecnico-local',
    name: 'SEO Técnico Local',
    description: 'Velocidad, indexabilidad y salud técnica.',
    iconName: 'wrench',
    queryName: 'seo-tecnico-local',
    hasQuote: true,
  },
  {
    slug: 'seo-on-page-local',
    name: 'SEO On-Page Local',
    description: 'Optimización de contenido y estructura on-page.',
    iconName: 'file-text',
    queryName: 'seo-on-page-local',
    hasQuote: true,
  },
  {
    slug: 'reputacion-y-resenas',
    name: 'Reputación y Reseñas',
    description: 'Gestión de reseñas y reputación online.',
    iconName: 'star',
    queryName: 'reputacion-y-resenas',
    hasQuote: true,
  },
  {
    slug: 'citaciones-y-nap',
    name: 'Citaciones y NAP',
    description: 'Consistencia de nombre, dirección y teléfono.',
    iconName: 'book-open',
    queryName: 'citaciones-y-nap',
    hasQuote: true,
  },
  {
    slug: 'reportes-y-analytics',
    name: 'Reportes y Analytics',
    description: 'Dashboards y reportes de desempeño local.',
    iconName: 'bar-chart',
    queryName: 'reportes-y-analytics',
    hasQuote: true,
  },
  {
    slug: 'mapas-calor-local',
    name: 'Mapas de Calor Local',
    description: 'Visibilidad geográfica por zona.',
    iconName: 'flame',
    queryName: 'mapas-calor-local',
    hasQuote: true,
  },
  {
    slug: 'contenido-local',
    name: 'Contenido Local',
    description: 'Blog, páginas de servicio y landing pages.',
    iconName: 'pen-tool',
    queryName: 'contenido-local',
    hasQuote: true,
  },
  {
    slug: 'seo-local-ecommerce',
    name: 'SEO Local E-commerce',
    description: 'SEO local para tiendas en línea.',
    iconName: 'shopping-bag',
    queryName: 'seo-local-ecommerce',
    hasQuote: true,
  },
  {
    slug: 'consultoria',
    name: 'Consultoría y Estrategia',
    description: 'Diagnóstico y hoja de ruta estratégica.',
    iconName: 'compass',
    queryName: 'consultoria-estrategia',
    hasQuote: true,
  },
];

interface ServiceSeed {
  code: string;
  furNumber: number;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'unico' | 'mes';
  deliveryDays: number;
  isPopular?: boolean;
  categorySlug: string;
}

const SERVICES: ServiceSeed[] = [
  {
    code: 'FUR-S-AUD-001',
    furNumber: 1,
    name: 'Auditoría SEO Local Integral',
    description:
      'Diagnóstico completo de presencia local, GBP, NAP y reputación.',
    price: 299,
    billingPeriod: 'unico',
    deliveryDays: 15,
    isPopular: true,
    categorySlug: 'auditoria-seo-local',
  },
  {
    code: 'FUR-S-AUD-002',
    furNumber: 2,
    name: 'Auditoría de Presencia Local',
    description: 'Revisión de directorios, citaciones y consistencia NAP.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 10,
    categorySlug: 'auditoria-seo-local',
  },
  {
    code: 'FUR-S-AUD-003',
    furNumber: 3,
    name: 'Auditoría de Competencia Local',
    description: 'Benchmark contra los competidores del Local Pack.',
    price: 249,
    billingPeriod: 'unico',
    deliveryDays: 12,
    categorySlug: 'auditoria-seo-local',
  },
  {
    code: 'FUR-S-AUD-004',
    furNumber: 4,
    name: 'Plan de Acción SEO Local',
    description: 'Hoja de ruta priorizada tras la auditoría.',
    price: 149,
    billingPeriod: 'unico',
    deliveryDays: 7,
    categorySlug: 'auditoria-seo-local',
  },

  {
    code: 'FUR-S-GBP-001',
    furNumber: 5,
    name: 'Optimización Completa de GBP',
    description:
      'Configuración integral de tu ficha de Google Business Profile.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 7,
    isPopular: true,
    categorySlug: 'google-business-profile',
  },
  {
    code: 'FUR-S-GBP-002',
    furNumber: 6,
    name: 'Gestión Mensual de GBP',
    description: 'Mantenimiento y optimización continua de tu perfil.',
    price: 149,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'google-business-profile',
  },
  {
    code: 'FUR-S-GBP-003',
    furNumber: 7,
    name: 'Auditoría de Google Business Profile',
    description: 'Revisión de completitud, categorías y señales de confianza.',
    price: 129,
    billingPeriod: 'unico',
    deliveryDays: 5,
    isPopular: true,
    categorySlug: 'google-business-profile',
  },
  {
    code: 'FUR-S-GBP-004',
    furNumber: 8,
    name: 'Gestión de Preguntas y Respuestas GBP',
    description: 'Monitoreo y respuesta de preguntas públicas.',
    price: 99,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'google-business-profile',
  },
  {
    code: 'FUR-S-GBP-005',
    furNumber: 9,
    name: 'Publicaciones GBP Mensuales',
    description: 'Calendario de publicaciones y ofertas en tu ficha.',
    price: 129,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'google-business-profile',
  },

  {
    code: 'FUR-S-LP-001',
    furNumber: 10,
    name: 'Tracking de Ranking Local',
    description: 'Seguimiento mensual de tus posiciones en el Local Pack.',
    price: 179,
    billingPeriod: 'mes',
    deliveryDays: 30,
    isPopular: true,
    categorySlug: 'local-pack-y-ranking',
  },
  {
    code: 'FUR-S-LP-002',
    furNumber: 11,
    name: 'Grid de Posicionamiento Geográfico',
    description: 'Mapa de calor de tu visibilidad por zona.',
    price: 249,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'local-pack-y-ranking',
  },
  {
    code: 'FUR-S-LP-003',
    furNumber: 12,
    name: 'Análisis de Competidores Local Pack',
    description: 'Identificación de oportunidades frente a tu competencia.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 10,
    categorySlug: 'local-pack-y-ranking',
  },
  {
    code: 'FUR-S-LP-004',
    furNumber: 13,
    name: 'Estrategia de Local Pack',
    description: 'Plan de acción para escalar posiciones en el mapa.',
    price: 299,
    billingPeriod: 'unico',
    deliveryDays: 15,
    categorySlug: 'local-pack-y-ranking',
  },

  {
    code: 'FUR-S-LB-001',
    furNumber: 14,
    name: 'Construcción de Enlaces Locales',
    description: 'Campaña de link building con relevancia geográfica.',
    price: 349,
    billingPeriod: 'unico',
    deliveryDays: 20,
    isPopular: true,
    categorySlug: 'link-building-local',
  },
  {
    code: 'FUR-S-LB-002',
    furNumber: 15,
    name: 'Directorios Locales Premium',
    description: 'Alta en directorios de alta autoridad.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 15,
    categorySlug: 'link-building-local',
  },
  {
    code: 'FUR-S-LB-003',
    furNumber: 16,
    name: 'Relaciones Públicas Locales',
    description: 'Cobertura en medios locales relevantes.',
    price: 449,
    billingPeriod: 'unico',
    deliveryDays: 25,
    categorySlug: 'link-building-local',
  },

  {
    code: 'FUR-S-ST-001',
    furNumber: 17,
    name: 'Auditoría Técnica SEO Local',
    description: 'Diagnóstico técnico completo de tu sitio.',
    price: 299,
    billingPeriod: 'unico',
    deliveryDays: 12,
    isPopular: true,
    categorySlug: 'seo-tecnico-local',
  },
  {
    code: 'FUR-S-ST-002',
    furNumber: 18,
    name: 'Optimización de Velocidad Web',
    description: 'Mejora de Core Web Vitals y tiempos de carga.',
    price: 249,
    billingPeriod: 'unico',
    deliveryDays: 10,
    categorySlug: 'seo-tecnico-local',
  },
  {
    code: 'FUR-S-ST-003',
    furNumber: 19,
    name: 'Corrección de Errores Técnicos',
    description: 'Resolución de errores de rastreo e indexación.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 10,
    categorySlug: 'seo-tecnico-local',
  },
  {
    code: 'FUR-S-ST-004',
    furNumber: 20,
    name: 'Implementación de Schema Local',
    description: 'Marcado estructurado LocalBusiness y FAQ.',
    price: 179,
    billingPeriod: 'unico',
    deliveryDays: 7,
    categorySlug: 'seo-tecnico-local',
  },

  {
    code: 'FUR-S-OP-001',
    furNumber: 21,
    name: 'Optimización On-Page Local',
    description: 'Títulos, metadatos y estructura con intención local.',
    price: 249,
    billingPeriod: 'unico',
    deliveryDays: 12,
    isPopular: true,
    categorySlug: 'seo-on-page-local',
  },
  {
    code: 'FUR-S-OP-002',
    furNumber: 22,
    name: 'Contenido Local Optimizado',
    description: 'Redacción de contenido con enfoque geográfico.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 10,
    categorySlug: 'seo-on-page-local',
  },
  {
    code: 'FUR-S-OP-003',
    furNumber: 23,
    name: 'Enlazado Interno Estratégico',
    description: 'Arquitectura de enlaces internos entre páginas locales.',
    price: 149,
    billingPeriod: 'unico',
    deliveryDays: 7,
    categorySlug: 'seo-on-page-local',
  },

  {
    code: 'FUR-S-RR-001',
    furNumber: 24,
    name: 'Gestión de Reputación Online',
    description: 'Estrategia integral de reputación y reseñas.',
    price: 249,
    billingPeriod: 'mes',
    deliveryDays: 30,
    isPopular: true,
    categorySlug: 'reputacion-y-resenas',
  },
  {
    code: 'FUR-S-RR-002',
    furNumber: 25,
    name: 'Generación de Reseñas',
    description: 'Campañas activas de solicitud de reseñas.',
    price: 179,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'reputacion-y-resenas',
  },
  {
    code: 'FUR-S-RR-003',
    furNumber: 26,
    name: 'Respuesta a Reseñas',
    description: 'Gestión y respuesta profesional de reseñas.',
    price: 129,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'reputacion-y-resenas',
  },
  {
    code: 'FUR-S-RR-004',
    furNumber: 27,
    name: 'Monitoreo de Reputación',
    description: 'Seguimiento de menciones y sentimiento online.',
    price: 149,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'reputacion-y-resenas',
  },

  {
    code: 'FUR-S-CN-001',
    furNumber: 28,
    name: 'Auditoría y Corrección NAP',
    description: 'Detección y corrección de inconsistencias NAP.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 10,
    isPopular: true,
    categorySlug: 'citaciones-y-nap',
  },
  {
    code: 'FUR-S-CN-002',
    furNumber: 29,
    name: 'Alta en Directorios Locales',
    description: 'Creación de citaciones en directorios clave.',
    price: 249,
    billingPeriod: 'unico',
    deliveryDays: 15,
    categorySlug: 'citaciones-y-nap',
  },
  {
    code: 'FUR-S-CN-003',
    furNumber: 30,
    name: 'Consistencia de Citaciones',
    description: 'Monitoreo continuo de consistencia NAP.',
    price: 179,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'citaciones-y-nap',
  },

  {
    code: 'FUR-S-AN-001',
    furNumber: 31,
    name: 'Dashboard de Analítica Local',
    description: 'Panel centralizado de métricas SEO locales.',
    price: 299,
    billingPeriod: 'mes',
    deliveryDays: 30,
    isPopular: true,
    categorySlug: 'reportes-y-analytics',
  },
  {
    code: 'FUR-S-AN-002',
    furNumber: 32,
    name: 'Reporte Ejecutivo Mensual',
    description: 'Informe ejecutivo de resultados y KPIs.',
    price: 199,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'reportes-y-analytics',
  },
  {
    code: 'FUR-S-AN-003',
    furNumber: 33,
    name: 'Tracking Multi-ubicación',
    description: 'Seguimiento de métricas por ciudad/sucursal.',
    price: 349,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'reportes-y-analytics',
  },

  {
    code: 'FUR-S-HM-001',
    furNumber: 34,
    name: 'Mapa de Calor de Visibilidad',
    description: 'Visualización de tu visibilidad por zona geográfica.',
    price: 249,
    billingPeriod: 'mes',
    deliveryDays: 30,
    isPopular: true,
    categorySlug: 'mapas-calor-local',
  },
  {
    code: 'FUR-S-HM-002',
    furNumber: 41,
    name: 'Análisis Geográfico de Competencia',
    description: 'Comparativa de competidores por zona.',
    price: 199,
    billingPeriod: 'unico',
    deliveryDays: 10,
    categorySlug: 'mapas-calor-local',
  },
  {
    code: 'FUR-S-HM-003',
    furNumber: 42,
    name: 'Tracking de Grid Multi-keyword',
    description: 'Monitoreo de múltiples keywords en el grid.',
    price: 299,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'mapas-calor-local',
  },

  {
    code: 'FUR-S-CL-001',
    furNumber: 43,
    name: 'Plan Editorial Local',
    description: 'Calendario editorial de contenido local mensual.',
    price: 249,
    billingPeriod: 'mes',
    deliveryDays: 30,
    isPopular: true,
    categorySlug: 'contenido-local',
  },
  {
    code: 'FUR-S-CL-002',
    furNumber: 44,
    name: 'Blog Local Mensual',
    description: 'Producción de artículos de blog con enfoque local.',
    price: 199,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'contenido-local',
  },
  {
    code: 'FUR-S-CL-003',
    furNumber: 45,
    name: 'Landing Pages Locales',
    description: 'Creación de landing pages por ciudad de cobertura.',
    price: 349,
    billingPeriod: 'unico',
    deliveryDays: 15,
    categorySlug: 'contenido-local',
  },

  {
    code: 'FUR-S-EC-001',
    furNumber: 35,
    name: 'SEO Local para E-commerce',
    description: 'Estrategia SEO local integral para tiendas en línea.',
    price: 399,
    billingPeriod: 'unico',
    deliveryDays: 20,
    isPopular: true,
    categorySlug: 'seo-local-ecommerce',
  },
  {
    code: 'FUR-S-EC-002',
    furNumber: 46,
    name: 'Optimización de Fichas de Producto',
    description: 'Optimización local de páginas de producto.',
    price: 249,
    billingPeriod: 'unico',
    deliveryDays: 12,
    categorySlug: 'seo-local-ecommerce',
  },
  {
    code: 'FUR-S-EC-003',
    furNumber: 47,
    name: 'Landing Pages por Ciudad',
    description: 'Páginas de categoría segmentadas por ciudad.',
    price: 299,
    billingPeriod: 'unico',
    deliveryDays: 15,
    categorySlug: 'seo-local-ecommerce',
  },

  {
    code: 'FUR-S-CE-001',
    furNumber: 48,
    name: 'Diagnóstico Estratégico SEO Local',
    description: 'Evaluación integral de madurez SEO local del negocio.',
    price: 399,
    billingPeriod: 'unico',
    deliveryDays: 10,
    isPopular: true,
    categorySlug: 'consultoria',
  },
  {
    code: 'FUR-S-CE-002',
    furNumber: 49,
    name: 'Roadmap Trimestral',
    description: 'Plan estratégico priorizado a 90 días.',
    price: 299,
    billingPeriod: 'unico',
    deliveryDays: 7,
    categorySlug: 'consultoria',
  },
  {
    code: 'FUR-S-CE-003',
    furNumber: 50,
    name: 'Seguimiento Estratégico Mensual',
    description: 'Sesiones mensuales de seguimiento y ajuste de estrategia.',
    price: 249,
    billingPeriod: 'mes',
    deliveryDays: 30,
    categorySlug: 'consultoria',
  },
];

interface CategoryDetailTemplate {
  requirements: string[];
  deliverables: string[];
  kpis: string[];
}

const CATEGORY_DETAIL_TEMPLATES: Record<string, CategoryDetailTemplate> = {
  'auditoria-seo-local': {
    requirements: [
      'Acceso de lectura a Google Business Profile',
      'Acceso a Google Analytics/Search Console si están disponibles',
      'Listado de directorios y citaciones conocidas',
    ],
    deliverables: [
      'Informe de auditoría con hallazgos priorizados',
      'Score de presencia local por categoría evaluada',
      'Plan de acción con recomendaciones accionables',
    ],
    kpis: [
      'Score de presencia local (0-100)',
      'Número de hallazgos críticos detectados',
      'Cobertura de directorios auditados',
    ],
  },
  'google-business-profile': {
    requirements: [
      'Acceso de administrador a la ficha de Google Business Profile',
      'Fotos y material visual del negocio',
      'Información de horarios, servicios y categorías',
    ],
    deliverables: [
      'Ficha de GBP optimizada y verificada',
      'Calendario de publicaciones configurado (si aplica)',
      'Reporte de cambios aplicados y resultados esperados',
    ],
    kpis: [
      'Completitud del perfil (%)',
      'Vistas y clics de la ficha',
      'Solicitudes de ruta/llamadas generadas',
    ],
  },
  'local-pack-y-ranking': {
    requirements: [
      'Lista de palabras clave objetivo por ciudad/zona',
      'Acceso a Google Business Profile',
      'Ubicación geográfica exacta del negocio',
    ],
    deliverables: [
      'Grid de posicionamiento por zona geográfica',
      'Análisis de competidores en el Local Pack',
      'Recomendaciones priorizadas por oportunidad geográfica',
    ],
    kpis: [
      'Cobertura Top 3 (%)',
      'Posición promedio por keyword',
      'Zonas de oportunidad identificadas',
    ],
  },
  'link-building-local': {
    requirements: [
      'Descripción del negocio y propuesta de valor',
      'Listado de directorios/medios ya utilizados',
      'Presupuesto y objetivos de autoridad local',
    ],
    deliverables: [
      'Reporte de enlaces construidos con fuente y autoridad',
      'Listado de directorios y medios donde se publicó',
      'Reporte final de autoridad y relevancia local',
    ],
    kpis: [
      'Enlaces locales nuevos construidos',
      'Autoridad de dominio ganada',
      'Relevancia local de las fuentes',
    ],
  },
  'seo-tecnico-local': {
    requirements: [
      'Acceso al panel/administrador del sitio web',
      'Acceso a Google Search Console',
      'Credenciales de hosting o CMS si se requieren cambios',
    ],
    deliverables: [
      'Informe técnico con errores priorizados',
      'Cambios técnicos implementados o documentados',
      'Validación posterior de las correcciones aplicadas',
    ],
    kpis: [
      'Core Web Vitals (LCP/CLS/INP)',
      'Errores de indexación resueltos',
      'Tiempo de carga promedio',
    ],
  },
  'seo-on-page-local': {
    requirements: [
      'Acceso de edición al sitio web o CMS',
      'Listado de páginas y servicios a optimizar',
      'Palabras clave locales prioritarias',
    ],
    deliverables: [
      'Páginas optimizadas con metadatos e intención local',
      'Estructura de encabezados y enlazado interno mejorada',
      'Reporte de cambios on-page aplicados',
    ],
    kpis: [
      'Páginas optimizadas',
      'Posición promedio de keywords objetivo',
      'Tráfico orgánico de páginas optimizadas',
    ],
  },
  'reputacion-y-resenas': {
    requirements: [
      'Acceso a las plataformas de reseñas (Google, Facebook, etc.)',
      'Historial de reseñas recientes',
      'Tono de voz/lineamientos de respuesta de la marca',
    ],
    deliverables: [
      'Estrategia de generación de reseñas implementada',
      'Respuestas a reseñas pendientes',
      'Reporte de evolución de calificación y volumen',
    ],
    kpis: [
      'Calificación promedio',
      'Volumen mensual de reseñas nuevas',
      '% de reseñas respondidas',
    ],
  },
  'citaciones-y-nap': {
    requirements: [
      'Datos exactos de NAP (nombre, dirección, teléfono)',
      'Listado de directorios donde ya existe presencia',
      'Acceso a cuentas de directorios si se requiere edición',
    ],
    deliverables: [
      'Auditoría de consistencia NAP',
      'Citaciones corregidas o creadas en directorios clave',
      'Reporte de consistencia final',
    ],
    kpis: [
      'Score de consistencia NAP (%)',
      'Directorios corregidos',
      'Nuevas citaciones creadas',
    ],
  },
  'reportes-y-analytics': {
    requirements: [
      'Acceso a Google Analytics/Search Console',
      'Acceso a Google Business Profile Insights',
      'Definición de KPIs prioritarios del negocio',
    ],
    deliverables: [
      'Dashboard de métricas configurado',
      'Reporte periódico con KPIs clave',
      'Alertas configuradas para cambios relevantes',
    ],
    kpis: [
      'KPIs monitoreados',
      'Frecuencia de reportes entregados',
      'Alertas activas configuradas',
    ],
  },
  'mapas-calor-local': {
    requirements: [
      'Palabras clave y radio geográfico a evaluar',
      'Acceso a Google Business Profile',
      'Ubicación exacta del negocio',
    ],
    deliverables: [
      'Mapa de calor de visibilidad por zona',
      'Comparativa histórica de posiciones (si aplica)',
      'Reporte de oportunidades por zona',
    ],
    kpis: [
      'Cobertura Top 3 por zona (%)',
      'Zonas con visibilidad crítica',
      'Evolución del score de visibilidad',
    ],
  },
  'contenido-local': {
    requirements: [
      'Lineamientos de marca y tono de comunicación',
      'Palabras clave y temas prioritarios',
      'Acceso de publicación al sitio web o blog',
    ],
    deliverables: [
      'Calendario editorial local',
      'Contenido redactado y publicado según plan',
      'Reporte de desempeño del contenido publicado',
    ],
    kpis: [
      'Piezas de contenido publicadas',
      'Tráfico orgánico generado',
      'Posiciones ganadas por contenido nuevo',
    ],
  },
  'seo-local-ecommerce': {
    requirements: [
      'Acceso a la plataforma de e-commerce',
      'Catálogo de productos y categorías',
      'Acceso a Google Analytics/Search Console',
    ],
    deliverables: [
      'Páginas de producto/categoría optimizadas',
      'Landing pages locales creadas o mejoradas',
      'Reporte de impacto en tráfico y conversión',
    ],
    kpis: [
      'Tráfico orgánico a fichas de producto',
      'Tasa de conversión local',
      'Posiciones de categorías objetivo',
    ],
  },
  consultoria: {
    requirements: [
      'Contexto del negocio y objetivos comerciales',
      'Acceso a métricas actuales (GBP, web, reseñas)',
      'Disponibilidad para sesiones de trabajo',
    ],
    deliverables: [
      'Diagnóstico estratégico documentado',
      'Roadmap priorizado por etapas',
      'Sesión de presentación de resultados y próximos pasos',
    ],
    kpis: [
      'Score de madurez SEO local',
      'Iniciativas priorizadas',
      'Leads/llamadas proyectadas',
    ],
  },
};

interface AgencySeed {
  name: string;
  city: string;
  summary: string;
  tagline: string;
  speciality: string;
  serviceSlugs: string[];
}

const AGENCIES: AgencySeed[] = [
  {
    name: 'Visibilidad Pro SEO',
    city: 'Bogotá',
    summary: 'Agencia especializada en posicionamiento local para PYMES.',
    tagline: 'Tu negocio, visible en tu ciudad.',
    speciality: 'Google Business Profile',
    serviceSlugs: ['FUR-S-GBP-001', 'FUR-S-AUD-001', 'FUR-S-LP-001'],
  },
  {
    name: 'Mapa Ranking Agency',
    city: 'Medellín',
    summary: 'Expertos en Local Pack y mapas de calor geográficos.',
    tagline: 'Domina el mapa de tu ciudad.',
    speciality: 'Local Pack y Ranking',
    serviceSlugs: ['FUR-S-LP-001', 'FUR-S-HM-001', 'FUR-S-LP-002'],
  },
  {
    name: 'Eje Cafetero Posicionamiento',
    city: 'Manizales',
    summary: 'SEO local integral para negocios del Eje Cafetero.',
    tagline: 'Posicionamiento con raíces locales.',
    speciality: 'SEO Técnico Local',
    serviceSlugs: ['FUR-S-ST-001', 'FUR-S-OP-001', 'FUR-S-AUD-002'],
  },
  {
    name: 'Impulsa Local Studio',
    city: 'Cali',
    summary: 'Estudio de contenido y reputación para marcas locales.',
    tagline: 'Impulsamos tu reputación local.',
    speciality: 'Reputación y Reseñas',
    serviceSlugs: ['FUR-S-RR-001', 'FUR-S-CL-001', 'FUR-S-RR-002'],
  },
  {
    name: 'SEO Local Colombia',
    city: 'Barranquilla',
    summary: 'Agencia nacional con foco en Link Building local.',
    tagline: 'Autoridad local en toda Colombia.',
    speciality: 'Link Building Local',
    serviceSlugs: ['FUR-S-LB-001', 'FUR-S-CN-001', 'FUR-S-AUD-003'],
  },
  {
    name: 'Local Rankers',
    city: 'Bucaramanga',
    summary: 'Especialistas en analítica y reportes de desempeño local.',
    tagline: 'Datos que impulsan decisiones.',
    speciality: 'Reportes y Analytics',
    serviceSlugs: ['FUR-S-AN-001', 'FUR-S-AN-002', 'FUR-S-LP-003'],
  },
  {
    name: 'SEO Certero',
    city: 'Pereira',
    summary: 'Consultoría estratégica SEO local para negocios en crecimiento.',
    tagline: 'Estrategia certera, resultados reales.',
    speciality: 'Consultoría y Estrategia',
    serviceSlugs: ['FUR-S-CE-001', 'FUR-S-CE-002', 'FUR-S-AUD-004'],
  },
  {
    name: 'Santander Local Rank',
    city: 'Cúcuta',
    summary: 'SEO técnico y on-page para negocios de la región santandereana.',
    tagline: 'Tu web, lista para posicionar.',
    speciality: 'SEO Técnico Local',
    serviceSlugs: ['FUR-S-ST-002', 'FUR-S-OP-002', 'FUR-S-ST-004'],
  },
  {
    name: 'Estrategia Local',
    city: 'Cartagena',
    summary: 'E-commerce local y contenido para negocios turísticos.',
    tagline: 'Estrategia local para vender más.',
    speciality: 'SEO Local E-commerce',
    serviceSlugs: ['FUR-S-EC-001', 'FUR-S-CL-002', 'FUR-S-EC-003'],
  },
];

const TRUST_ITEMS = [
  { label: 'Agencia verificada', tone: 'positive' },
  { label: 'Respuesta en menos de 24h', tone: 'positive' },
  { label: 'Más de 50 proyectos entregados', tone: 'benefit' },
  { label: 'Especialistas certificados en GBP', tone: 'benefit' },
];

const BUSINESS_HOURS = [
  { dayLabel: 'Lunes', opensAt: '08:00', closesAt: '18:00' },
  { dayLabel: 'Martes', opensAt: '08:00', closesAt: '18:00' },
  { dayLabel: 'Miércoles', opensAt: '08:00', closesAt: '18:00' },
  { dayLabel: 'Jueves', opensAt: '08:00', closesAt: '18:00' },
  { dayLabel: 'Viernes', opensAt: '08:00', closesAt: '18:00' },
  { dayLabel: 'Sábado', opensAt: '09:00', closesAt: '13:00' },
  { dayLabel: 'Domingo', opensAt: null, closesAt: null, isClosed: true },
];

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

async function seedRbac(ds: typeof AppDataSource) {
  const permissionRepo = ds.getRepository(SeoPermissionRule);
  const roleRepo = ds.getRepository(SeoDashboardRole);
  const rolePermissionRepo = ds.getRepository(SeoRolePermissionRel);
  const userRepo = ds.getRepository(SeoUserAccount);
  const assignmentRepo = ds.getRepository(SeoUserRoleAssignment);
  const agencyRepo = ds.getRepository(SeoAgencyProfile);

  for (const [moduleCode, codes] of Object.entries(PERMISSION_MODULES)) {
    for (const code of codes) {
      await permissionRepo.upsert(
        {
          permissionCode: code,
          moduleCode,
          name: code,
          description: `Permiso ${code}`,
        },
        ['permissionCode'],
      );
    }
  }

  for (const role of ROLE_DEFS) {
    await roleRepo.upsert(
      {
        roleCode: role.code,
        name: role.name,
        isSystem: true,
        active: true,
        sequence: role.sequence,
      },
      ['roleCode'],
    );
  }

  for (const [roleCode, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permissionCode of permissions) {
      const exists = await rolePermissionRepo.findOne({
        where: { roleCode, permissionCode },
      });
      if (!exists)
        await rolePermissionRepo.save(
          rolePermissionRepo.create({ roleCode, permissionCode }),
        );
    }
  }

  const topAgency = await agencyRepo.findOne({
    where: {},
    order: { isTopRated: 'DESC', rating: 'DESC' },
  });

  const configuredUsers = DEMO_USERS.filter(
    (item): item is typeof item & { password: string } =>
      typeof item.password === 'string' && item.password.length > 0,
  );
  for (const demoUser of configuredUsers) {
    let user = await userRepo.findOne({ where: { login: demoUser.login } });
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    if (!user) {
      user = await userRepo.save(
        userRepo.create({
          login: demoUser.login,
          email: demoUser.login,
          displayName: demoUser.name,
          passwordHash,
          active: true,
        }),
      );
    } else if (!(await bcrypt.compare(demoUser.password, user.passwordHash))) {
      await userRepo.update(user.id, { passwordHash });
    }

    const existingAssignment = await assignmentRepo.findOne({
      where: { userAccountId: user.id },
    });
    if (!existingAssignment) {
      await assignmentRepo.save(
        assignmentRepo.create({
          userAccountId: user.id,
          roleCode: demoUser.role,
          agencyProfileId:
            demoUser.role === 'agency_manager' ? (topAgency?.id ?? null) : null,
        }),
      );
    }
  }

  console.log(
    `Seeded RBAC: ${ROLE_DEFS.length} roles, ${ALL_PERMISSIONS.length} permissions, ${configuredUsers.length} configured users.`,
  );
}

async function seedClientDemo(ds: typeof AppDataSource) {
  const clientPassword = CLIENT_USER.password;
  if (!clientPassword) {
    console.log('Client demo seed skipped: no SEED_PASSWORD configured.');
    return;
  }
  const profileTypeRepo = ds.getRepository(SeoProfileType);
  const userRepo = ds.getRepository(SeoUserAccount);
  const userProfileRepo = ds.getRepository(SeoUserProfile);
  const clientProfileRepo = ds.getRepository(SeoClientProfile);
  const auditRepo = ds.getRepository(SeoClientAudit);
  const draftRepo = ds.getRepository(SeoClientCitationDraft);
  const assignmentRepo = ds.getRepository(SeoUserRoleAssignment);

  await profileTypeRepo.upsert(
    {
      code: 'client',
      name: 'Cliente',
      description: 'Perfil de cliente de servicios SEO local',
    },
    ['code'],
  );

  let user = await userRepo.findOne({ where: { login: CLIENT_USER.login } });
  const clientPasswordHash = await bcrypt.hash(clientPassword, 10);
  if (!user) {
    user = await userRepo.save(
      userRepo.create({
        login: CLIENT_USER.login,
        email: CLIENT_USER.email,
        displayName: CLIENT_USER.name,
        passwordHash: clientPasswordHash,
        active: true,
      }),
    );
  } else if (!(await bcrypt.compare(clientPassword, user.passwordHash))) {
    await userRepo.update(user.id, { passwordHash: clientPasswordHash });
  }

  const existingAssignment = await assignmentRepo.findOne({
    where: { userAccountId: user.id },
  });
  if (!existingAssignment) {
    await assignmentRepo.save(
      assignmentRepo.create({
        userAccountId: user.id,
        roleCode: CLIENT_USER.role,
      }),
    );
  }

  let userProfile = await userProfileRepo.findOne({
    where: { userAccountId: user.id },
  });
  if (!userProfile) {
    userProfile = await userProfileRepo.save(
      userProfileRepo.create({
        userAccountId: user.id,
        profileTypeCode: 'client',
        active: true,
      }),
    );
  }

  let clientProfile = await clientProfileRepo.findOne({
    where: { userProfileId: userProfile.id },
  });
  if (!clientProfile) {
    clientProfile = await clientProfileRepo.save(
      clientProfileRepo.create({
        userProfileId: userProfile.id,
        companyName: CLIENT_USER.name,
        city: 'Bogotá',
        countryCode: 'CO',
      }),
    );
  }

  const existingAudit = await auditRepo.findOne({
    where: { clientProfileId: clientProfile.id },
  });
  if (!existingAudit) {
    await auditRepo.save(
      auditRepo.create({
        clientProfileId: clientProfile.id,
        payload: buildDemoAuditPayload(),
        active: true,
      }),
    );
  }

  const existingDraft = await draftRepo.findOne({
    where: { clientProfileId: clientProfile.id },
  });
  if (!existingDraft) {
    await draftRepo.save(
      draftRepo.create({
        clientProfileId: clientProfile.id,
        payload: buildDefaultCitationDraft(),
        active: true,
      }),
    );
  }

  console.log(
    `Seeded client demo user ${CLIENT_USER.login} with audit and citation draft.`,
  );
}

async function seedLeadStagesAndPlans(ds: typeof AppDataSource) {
  const stageRepo = ds.getRepository(SeoLeadStage);
  for (const stage of LEAD_STAGES) {
    await stageRepo.upsert(
      {
        name: stage.name,
        sequence: stage.sequence,
        probability: stage.probability,
        isWon: stage.isWon ?? false,
        active: true,
      },
      ['name'],
    );
  }

  const planRepo = ds.getRepository(SeoPlan);
  for (const plan of PLANS) {
    await planRepo.upsert(
      {
        name: plan.name,
        planCode: plan.planCode,
        monthlyPrice: plan.monthlyPrice,
        currencyCode: 'USD',
        maxServices: plan.maxServices,
        maxLeads: plan.maxLeads,
        featuredListing: plan.featuredListing ?? false,
        verifiedBadge: plan.verifiedBadge ?? false,
        supportLevel: plan.supportLevel,
        active: true,
      },
      ['planCode'],
    );
  }

  console.log(
    `Seeded ${LEAD_STAGES.length} lead stages and ${PLANS.length} plans.`,
  );
}

async function seedCatalog(ds: typeof AppDataSource) {
  const categoryRepo = ds.getRepository(SeoServiceCategory);
  const serviceRepo = ds.getRepository(SeoService);
  const relRepo = ds.getRepository(SeoServiceCategoryRel);
  const moduleRepo = ds.getRepository(SeoFunctionalModule);

  const categoryBySlug = new Map<string, SeoServiceCategory>();
  for (const [index, cat] of CATEGORIES.entries()) {
    await categoryRepo.upsert(
      {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        iconName: cat.iconName,
        imageUrl: cat.imageUrl ?? null,
        keywords: [cat.name, cat.queryName],
        queryName: cat.queryName,
        sequence: (index + 1) * 10,
        active: true,
      },
      ['slug'],
    );
    const saved = await categoryRepo.findOneOrFail({
      where: { slug: cat.slug },
    });
    categoryBySlug.set(cat.slug, saved);
  }

  const serviceByCode = new Map<string, SeoService>();
  for (const svc of SERVICES) {
    const category = categoryBySlug.get(svc.categorySlug)!;
    await serviceRepo.upsert(
      {
        name: svc.name,
        code: svc.code,
        furNumber: svc.furNumber,
        descriptionSale: svc.description,
        primaryCategoryId: category.id,
        listPrice: svc.price,
        currencyCode: 'USD',
        billingPeriod: svc.billingPeriod,
        deliveryDays: svc.deliveryDays,
        isPopular: svc.isPopular ?? false,
        active: true,
      },
      ['code'],
    );
    const saved = await serviceRepo.findOneOrFail({
      where: { code: svc.code },
    });
    serviceByCode.set(svc.code, saved);

    const existingRel = await relRepo.findOne({
      where: { serviceId: saved.id, categoryId: category.id },
    });
    if (!existingRel) {
      await relRepo.save(
        relRepo.create({
          serviceId: saved.id,
          categoryId: category.id,
          relationType: 'primary',
          isPrimary: true,
          sortOrder: svc.furNumber,
        }),
      );
    }
  }

  for (const category of categoryBySlug.values()) {
    const count = await relRepo.count({
      where: { categoryId: category.id, active: true },
    });
    await categoryRepo.update(category.id, { servicesCount: count });
  }

  for (const cat of CATEGORIES) {
    const category = categoryBySlug.get(cat.slug)!;
    await moduleRepo.upsert(
      {
        moduleCode: cat.queryName,
        name: cat.name,
        categoryId: category.id,
        hasQuote: cat.hasQuote,
        sequence: category.sequence,
        active: true,
      },
      ['moduleCode'],
    );
  }

  console.log(
    `Seeded ${CATEGORIES.length} categories, ${SERVICES.length} FUR-S services, ${CATEGORIES.length} functional modules.`,
  );
  return { categoryBySlug, serviceByCode };
}

function slaSummaryFor(svc: ServiceSeed): string {
  return svc.billingPeriod === 'mes'
    ? `Servicio recurrente mensual, con entregas y reportes cada ${svc.deliveryDays} días.`
    : `Entrega única en ${svc.deliveryDays} días hábiles desde el inicio del proyecto.`;
}

async function seedServiceDetails(
  ds: typeof AppDataSource,
  serviceByCode: Map<string, SeoService>,
) {
  const detailRepo = ds.getRepository(SeoServiceDetail);
  let created = 0;

  for (const svc of SERVICES) {
    const service = serviceByCode.get(svc.code);
    if (!service) continue;

    const existing = await detailRepo.findOne({
      where: { serviceId: service.id },
    });
    if (existing) continue;

    const template = CATEGORY_DETAIL_TEMPLATES[svc.categorySlug];
    await detailRepo.save(
      detailRepo.create({
        serviceId: service.id,
        scope: `${svc.description} Incluye diagnóstico inicial, ejecución del alcance definido y entrega de resultados documentados.`,
        requirements: template.requirements,
        deliverables: template.deliverables,
        kpis: template.kpis,
        slaSummary: slaSummaryFor(svc),
      }),
    );
    created += 1;
  }

  console.log(`Seeded service detail (ficha FUR-S) for ${created} services.`);
}

async function seedAgencies(
  ds: typeof AppDataSource,
  serviceByCode: Map<string, SeoService>,
) {
  const agencyRepo = ds.getRepository(SeoAgencyProfile);
  const detailRepo = ds.getRepository(SeoAgencyProfileDetail);
  const teamRepo = ds.getRepository(SeoAgencyTeamMember);
  const certRepo = ds.getRepository(SeoAgencyCertification);
  const channelRepo = ds.getRepository(SeoAgencyChannel);
  const hourRepo = ds.getRepository(SeoAgencyBusinessHour);
  const trustItemRepo = ds.getRepository(SeoAgencyTrustItem);
  const agencyServiceRepo = ds.getRepository(SeoAgencyService);
  const reviewRepo = ds.getRepository(SeoReview);

  const logoColors = [
    '#0074E0',
    '#D32323',
    '#0B8A5C',
    '#7C3AED',
    '#EA580C',
    '#0891B2',
    '#BE185D',
    '#4D7C0F',
    '#B45309',
  ];

  for (const [index, agencySeed] of AGENCIES.entries()) {
    let agency = await agencyRepo.findOne({ where: { name: agencySeed.name } });
    const isNew = !agency;

    if (!agency) {
      agency = await agencyRepo.save(
        agencyRepo.create({
          name: agencySeed.name,
          slug: slugify(agencySeed.name),
          email: `contacto@${slugify(agencySeed.name)}.com`,
          phone: `+57 300 ${100 + index}0000`,
          website: `https://${slugify(agencySeed.name)}.com`,
          city: agencySeed.city,
          countryCode: 'CO',
          logoLetter: agencySeed.name.charAt(0).toUpperCase(),
          logoBgColor: logoColors[index % logoColors.length],
          summary: agencySeed.summary,
          priceLevel: index % 3 === 0 ? '$$$' : index % 2 === 0 ? '$$' : '$',
          startingPrice: 150 + index * 25,
          mapX: 10 + ((index * 11) % 80),
          mapY: 15 + ((index * 17) % 70),
          distanceKm: randomBetween(2, 25),
          isVerified: true,
          isTopRated: index < 3,
          status: 'published',
          employeesRange: index % 2 === 0 ? '5-10' : '10-25',
          experienceYears: 3 + (index % 6),
          languages: ['es', 'en'],
          workModes: ['remota', 'hibrida'],
          certificationLevel:
            index < 3 ? 'Destacada' : index < 6 ? 'Recomendada' : 'Estándar',
          badgeLabel: index < 3 ? 'Top Rated' : undefined,
          recommended: index < 6,
          commercialSummary: agencySeed.summary,
          caseStudy: `${agencySeed.name} ayudó a un negocio local a duplicar su visibilidad en Google Maps en 90 días.`,
          responseTimeHours: 4 + (index % 12),
          qualifiedProjects: 20 + index * 5,
          trustScore: 70 + (index % 25),
          successRate: 75 + (index % 20),
          speciality: agencySeed.speciality,
          budgetMin: 150,
          budgetMax: 2000,
          audited: true,
          profileCompleteness: 90,
        }),
      );
    }

    if (isNew) {
      await detailRepo.save(
        detailRepo.create({
          agencyProfileId: agency.id,
          tagline: agencySeed.tagline,
          focus: `Nos enfocamos en ${agencySeed.speciality.toLowerCase()} para negocios locales en ${agencySeed.city}.`,
          methodology:
            'Diagnóstico, plan de acción priorizado, ejecución y reporte mensual de resultados.',
          industries: [
            'Retail',
            'Servicios profesionales',
            'Salud',
            'Gastronomía',
          ],
          clientProfileText:
            'Negocios locales con presencia física que buscan más clientes desde búsquedas locales.',
          identityTags: [agencySeed.speciality, 'SEO Local', agencySeed.city],
          promiseHeadline: `Más visibilidad local para tu negocio en ${agencySeed.city}.`,
        }),
      );

      await teamRepo.save([
        teamRepo.create({
          agencyProfileId: agency.id,
          name: 'Ana Torres',
          roleTitle: 'Directora de Estrategia',
          bio: 'Más de 8 años optimizando presencia local para negocios en Colombia.',
          specialty: 'Estrategia SEO Local',
          sequence: 10,
        }),
        teamRepo.create({
          agencyProfileId: agency.id,
          name: 'Carlos Gómez',
          roleTitle: 'Especialista Técnico SEO',
          bio: 'Enfocado en rendimiento web y datos estructurados.',
          specialty: 'SEO Técnico',
          sequence: 20,
        }),
      ]);

      await certRepo.save([
        certRepo.create({
          agencyProfileId: agency.id,
          issuer: 'Google',
          title: 'Google Business Profile Certified',
          validUntil: '2027-12-31',
        }),
        certRepo.create({
          agencyProfileId: agency.id,
          issuer: 'HubSpot Academy',
          title: 'Local SEO Specialist',
          validUntil: '2026-12-31',
        }),
      ]);

      await channelRepo.save([
        channelRepo.create({
          agencyProfileId: agency.id,
          channelType: 'whatsapp',
          label: 'WhatsApp',
          value: agency.phone ?? '',
          url: `https://wa.me/57${300 + index}0000000`,
          isVerified: true,
        }),
        channelRepo.create({
          agencyProfileId: agency.id,
          channelType: 'website',
          label: 'Sitio web',
          value: agency.website ?? '',
          url: agency.website ?? '',
          isVerified: true,
        }),
        channelRepo.create({
          agencyProfileId: agency.id,
          channelType: 'linkedin',
          label: 'LinkedIn',
          value: agencySeed.name,
          url: `https://linkedin.com/company/${slugify(agencySeed.name)}`,
          isVerified: true,
        }),
      ]);

      await hourRepo.save(
        BUSINESS_HOURS.map((h) =>
          hourRepo.create({
            agencyProfileId: agency.id,
            dayLabel: h.dayLabel,
            opensAt: h.opensAt,
            closesAt: h.closesAt,
            isClosed: h.isClosed ?? false,
          }),
        ),
      );

      await trustItemRepo.save(
        TRUST_ITEMS.map((t) =>
          trustItemRepo.create({
            agencyProfileId: agency.id,
            label: t.label,
            tone: t.tone,
          }),
        ),
      );

      let sequence = 10;
      for (const code of agencySeed.serviceSlugs) {
        const service = serviceByCode.get(code);
        if (!service) continue;
        await agencyServiceRepo.save(
          agencyServiceRepo.create({
            agencyProfileId: agency.id,
            serviceId: service.id,
            serviceType: 'principal',
            included: true,
            deliveryDays: service.deliveryDays,
            status: 'active',
            isFeatured: sequence === 10,
            sequence,
          }),
        );
        sequence += 10;
      }

      const reviews = await reviewRepo.save([
        reviewRepo.create({
          agencyProfileId: agency.id,
          authorName: 'María Fernanda R.',
          authorCity: agencySeed.city,
          rating: 5,
          title: 'Excelente resultado',
          body: `El equipo de ${agencySeed.name} mejoró nuestra visibilidad local en pocas semanas. Muy recomendados.`,
          status: 'published',
          verifiedPurchase: true,
        }),
        reviewRepo.create({
          agencyProfileId: agency.id,
          authorName: 'Juan Pablo M.',
          authorCity: agencySeed.city,
          rating: 4,
          title: 'Buen servicio',
          body: 'Buena comunicación y resultados visibles en Google Maps.',
          status: 'published',
          verifiedPurchase: false,
        }),
      ]);

      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await agencyRepo.update(agency.id, {
        rating: Math.round(avgRating * 100) / 100,
        reviewsCount: reviews.length,
        highlightReview: reviews[0].body,
      });
    }
  }

  console.log(
    `Seeded ${AGENCIES.length} demo agencies with full profile data.`,
  );
}

async function seedOffers(ds: typeof AppDataSource) {
  const offerRepo = ds.getRepository(SeoOffer);

  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setDate(startsAt.getDate() - 1);
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 14);

  const offers = [
    {
      title: 'Auditoría SEO Local gratuita',
      subtitle: 'Diagnóstico inicial sin costo',
      description:
        'Obtén un informe inicial de tu presencia local y oportunidades de mejora. Válido para nuevos clientes.',
      discountPercent: 100,
      originalPrice: 299,
      discountedPrice: 0,
      ctaLabel: 'Solicitar auditoría',
      ctaLink: '/offers/audit-gratis',
      imageUrl: null,
      status: 'active',
    },
    {
      title: '20% de descuento en optimización de GBP',
      subtitle: 'Impulsa tu ficha de Google',
      description:
        'Aprovecha un 20% de descuento en la configuración y optimización completa de Google Business Profile.',
      discountPercent: 20,
      originalPrice: 199,
      discountedPrice: 159.2,
      ctaLabel: 'Reclamar oferta',
      ctaLink: '/offers/gbp-20',
      imageUrl: null,
      status: 'active',
    },
  ] as const;

  for (const [index, offer] of offers.entries()) {
    let existing = await offerRepo.findOne({ where: { title: offer.title } });
    if (!existing) {
      existing = await offerRepo.save(
        offerRepo.create({
          title: offer.title,
          subtitle: offer.subtitle,
          description: offer.description,
          discountPercent: offer.discountPercent,
          originalPrice: offer.originalPrice,
          discountedPrice: offer.discountedPrice,
          currencyCode: 'USD',
          ctaLabel: offer.ctaLabel,
          ctaLink: offer.ctaLink,
          imageUrl: offer.imageUrl ?? null,
          startsAt,
          expiresAt: new Date(expiresAt.getTime() + index * 86400000),
          status: offer.status,
          active: true,
        }),
      );
    } else {
      await offerRepo.update(existing.id, {
        subtitle: offer.subtitle,
        description: offer.description,
        discountPercent: offer.discountPercent,
        originalPrice: offer.originalPrice,
        discountedPrice: offer.discountedPrice,
        ctaLabel: offer.ctaLabel,
        ctaLink: offer.ctaLink,
        imageUrl: offer.imageUrl ?? null,
        startsAt,
        expiresAt: new Date(expiresAt.getTime() + index * 86400000),
        status: offer.status,
        active: true,
      });
    }
  }

  console.log(`Seeded ${offers.length} active offers.`);
}

async function run() {
  const ds = await AppDataSource.initialize();
  try {
    await seedLeadStagesAndPlans(ds);
    const { serviceByCode } = await seedCatalog(ds);
    await seedServiceDetails(ds, serviceByCode);
    await seedAgencies(ds, serviceByCode);
    await seedOffers(ds);
    await seedRbac(ds);
    if (process.env.SEED_CLIENT_DEMO === 'true') await seedClientDemo(ds);
    console.log('Seed completed successfully.');
  } finally {
    await ds.destroy();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
