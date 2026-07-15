import RootLayout from '@/components/RootLayout';
import {
  HomePage,
  SearchResultsPage,
  ServiceDetailPage,
  AgenciesPage,
  AgencyProfilePage,
  CategoriesPage,
  AuditSeoLocalPage,
  GoogleBusinessProfilePage,
  LocalPackRankingPage,
  LinkBuildingLocalPage,
  SeoTecnicoLocalPage,
  SeoOnPageLocalPage,
  ReputationReviewsPage,
  CitationsNapPage,
  ReportsAnalyticsPage,
  HeatMapsLocalPage,
  ContentLocalPage,
  SeoLocalEcommercePage,
  ConsultoriaEstrategiaPage,
  DashboardPage,
  LoginPage,
  ClientAuditCommandCenterPage,
} from './lazyPages';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedClientRoute from '@/components/ProtectedClientRoute';

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
      { path: 'login', element: <LoginPage />, handle: { title: `Acceder${TITLE_SUFFIX}` } },
      {
        path: 'herramientas/auditorias',
        element: (
          <ProtectedClientRoute>
            <ClientAuditCommandCenterPage />
          </ProtectedClientRoute>
        ),
        handle: { title: `Command Center 360${TITLE_SUFFIX}` },
      },
    ],
  },
]);
