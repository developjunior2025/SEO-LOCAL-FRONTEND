import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/RootLayout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage'));
const AgenciesPage = lazy(() => import('@/pages/AgenciesPage'));
const AgencyProfilePage = lazy(() => import('@/pages/AgencyProfilePage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const AuditSeoLocalPage = lazy(() => import('@/pages/AuditSeoLocalPage'));
const GoogleBusinessProfilePage = lazy(() => import('@/pages/GoogleBusinessProfilePage'));
const LocalPackRankingPage = lazy(() => import('@/pages/LocalPackRankingPage'));
const LinkBuildingLocalPage = lazy(() => import('@/pages/LinkBuildingLocalPage'));
const SeoTecnicoLocalPage = lazy(() => import('@/pages/SeoTecnicoLocalPage'));
const SeoOnPageLocalPage = lazy(() => import('@/pages/SeoOnPageLocalPage'));
const ReputationReviewsPage = lazy(() => import('@/pages/ReputationReviewsPage'));
const CitationsNapPage = lazy(() => import('@/pages/CitationsNapPage'));
const ReportsAnalyticsPage = lazy(() => import('@/pages/ReportsAnalyticsPage'));
const HeatMapsLocalPage = lazy(() => import('@/pages/HeatMapsLocalPage'));
const ContentLocalPage = lazy(() => import('@/pages/ContentLocalPage'));
const SeoLocalEcommercePage = lazy(() => import('@/pages/SeoLocalEcommercePage'));
const ConsultoriaEstrategiaPage = lazy(() => import('@/pages/ConsultoriaEstrategiaPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

const TITLE_SUFFIX = ' | SEOLOCAL';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage />, handle: { title: `SEOLOCAL | Marketplace de agencias SEO Local` } },
      { path: 'buscar', element: <SearchResultsPage />, handle: { title: `Resultados de búsqueda${TITLE_SUFFIX}` } },
      { path: 'servicios/:slug', element: <ServiceDetailPage />, handle: { title: `Ficha de servicio${TITLE_SUFFIX}` } },
      { path: 'agencias', element: <AgenciesPage />, handle: { title: `Agencias SEO Local${TITLE_SUFFIX}` } },
      { path: 'agencias/:slug', element: <AgencyProfilePage />, handle: { title: `Perfil de agencia SEO Local${TITLE_SUFFIX}` } },
      { path: 'categorias', element: <CategoriesPage />, handle: { title: `Categorías de SEO Local${TITLE_SUFFIX}` } },
      { path: 'categorias/auditoria-seo-local', element: <AuditSeoLocalPage />, handle: { title: `Auditoría SEO Local${TITLE_SUFFIX}` } },
      { path: 'categorias/google-business-profile', element: <GoogleBusinessProfilePage />, handle: { title: `Google Business Profile${TITLE_SUFFIX}` } },
      { path: 'categorias/local-pack-y-ranking', element: <LocalPackRankingPage />, handle: { title: `Local Pack y Ranking Local${TITLE_SUFFIX}` } },
      { path: 'categorias/link-building-local', element: <LinkBuildingLocalPage />, handle: { title: `Link Building Local${TITLE_SUFFIX}` } },
      { path: 'categorias/seo-tecnico-local', element: <SeoTecnicoLocalPage />, handle: { title: `SEO Técnico Local${TITLE_SUFFIX}` } },
      { path: 'categorias/seo-on-page-local', element: <SeoOnPageLocalPage />, handle: { title: `SEO On-Page Local${TITLE_SUFFIX}` } },
      { path: 'categorias/reputacion-y-resenas', element: <ReputationReviewsPage />, handle: { title: `Reputación y Reseñas${TITLE_SUFFIX}` } },
      { path: 'categorias/citaciones-y-nap', element: <CitationsNapPage />, handle: { title: `Citaciones y NAP${TITLE_SUFFIX}` } },
      { path: 'categorias/reportes-y-analytics', element: <ReportsAnalyticsPage />, handle: { title: `Reportes y Analytics${TITLE_SUFFIX}` } },
      { path: 'categorias/mapas-calor-local', element: <HeatMapsLocalPage />, handle: { title: `Mapas de Calor Local${TITLE_SUFFIX}` } },
      { path: 'categorias/contenido-local', element: <ContentLocalPage />, handle: { title: `Contenido Local${TITLE_SUFFIX}` } },
      { path: 'categorias/seo-local-ecommerce', element: <SeoLocalEcommercePage />, handle: { title: `SEO Local para E-commerce${TITLE_SUFFIX}` } },
      { path: 'categorias/consultoria', element: <ConsultoriaEstrategiaPage />, handle: { title: `Consultoría y Estrategia SEO Local${TITLE_SUFFIX}` } },
      { path: 'dashboard', element: <DashboardPage />, handle: { title: `Gestión interna${TITLE_SUFFIX}` } },
    ],
  },
]);
