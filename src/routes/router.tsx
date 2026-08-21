import RootLayout from '@/components/RootLayout';
import {
  HomePage,LocalVisibilityWorkspacePage,SearchResultsPage,ServiceDetailPage,AgenciesPage,AgencyProfilePage,CategoriesPage,
  AuditSeoLocalPage,GoogleBusinessProfilePage,LocalPackRankingPage,LinkBuildingLocalPage,SeoTecnicoLocalPage,SeoOnPageLocalPage,
  ReputationReviewsPage,CitationsNapPage,ReportsAnalyticsPage,HeatMapsLocalPage,ContentLocalPage,SeoLocalEcommercePage,ConsultoriaEstrategiaPage,
  DashboardGatewayPage,LoginPage,ClientAuditCommandCenterPage,ClientAuditRouteErrorPage,CitationsManagerPage,
  UtilidadesLayout,UtilidadesOverviewPage,UtilidadesLocationsPage,UtilidadesLocationWorkspacePage,
  UtilidadesClientsPage,UtilidadesAgenciesPage,UtilidadesAlertsPage,UtilidadesOperationsPage,
  UtilidadesWorkOrdersPage,UtilidadesCampaignsPage,UtilidadesGbpPostsPage,
  UtilidadesMarketPage,UtilidadesProspectsPage,UtilidadesWhiteLabelPage,
  UtilidadesCasesPage,UtilidadesIntegrationsPage,UtilidadesAuditPage,UtilidadesScopesPage,
} from './lazyPages';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedClientRoute from '@/components/ProtectedClientRoute';
import ProtectedUtilidadesRoute from '@/components/ProtectedUtilidadesRoute';

const TITLE_SUFFIX=' | SEOLOCAL';
export const router=createBrowserRouter([
  {path:'/',element:<RootLayout/>,children:[
    {index:true,element:<HomePage/>,handle:{title:'SEOLOCAL | Marketplace de agencias SEO Local'}},
    {path:'local-visibility',element:<LocalVisibilityWorkspacePage/>,handle:{title:`Local Visibility Executive Workspace${TITLE_SUFFIX}`}}, // SEOLOCAL_EXECUTIVE_WORKSPACE_V2
    {path:'buscar',element:<SearchResultsPage/>,handle:{title:`Resultados de búsqueda${TITLE_SUFFIX}`}},
    {path:'servicios/:slug',element:<ServiceDetailPage/>,handle:{title:`Ficha de servicio${TITLE_SUFFIX}`}},
    {path:'agencias',element:<AgenciesPage/>,handle:{title:`Agencias SEO Local${TITLE_SUFFIX}`}},
    {path:'agencias/:slug',element:<AgencyProfilePage/>,handle:{title:`Perfil de agencia SEO Local${TITLE_SUFFIX}`}},
    {path:'categorias',element:<CategoriesPage/>,handle:{title:`Categorías de SEO Local${TITLE_SUFFIX}`}},
    {path:'categorias/auditoria-seo-local',element:<AuditSeoLocalPage/>},{path:'categorias/google-business-profile',element:<GoogleBusinessProfilePage/>},
    {path:'categorias/local-pack-y-ranking',element:<LocalPackRankingPage/>},{path:'categorias/link-building-local',element:<LinkBuildingLocalPage/>},
    {path:'categorias/seo-tecnico-local',element:<SeoTecnicoLocalPage/>},{path:'categorias/seo-on-page-local',element:<SeoOnPageLocalPage/>},
    {path:'categorias/reputacion-y-resenas',element:<ReputationReviewsPage/>},{path:'categorias/citaciones-y-nap',element:<CitationsNapPage/>},
    {path:'categorias/reportes-y-analytics',element:<ReportsAnalyticsPage/>},{path:'categorias/mapas-calor-local',element:<HeatMapsLocalPage/>},
    {path:'categorias/contenido-local',element:<ContentLocalPage/>},{path:'categorias/seo-local-ecommerce',element:<SeoLocalEcommercePage/>},
    {path:'categorias/consultoria',element:<ConsultoriaEstrategiaPage/>},{path:'dashboard',element:<DashboardGatewayPage/>,handle:{title:`Dashboard${TITLE_SUFFIX}`}},{path:'login',element:<LoginPage/>},
    {path:'herramientas/auditorias',element:<ProtectedClientRoute><ClientAuditCommandCenterPage/></ProtectedClientRoute>,errorElement:<ClientAuditRouteErrorPage/>},
    {path:'herramientas/citaciones',element:<ProtectedClientRoute><CitationsManagerPage/></ProtectedClientRoute>},
  ]},
  {path:'/utilidades',element:<ProtectedUtilidadesRoute><UtilidadesLayout/></ProtectedUtilidadesRoute>,handle:{title:`Utilidades${TITLE_SUFFIX}`},children:[
    {index:true,element:<UtilidadesOverviewPage/>},
    {path:'ubicaciones',element:<UtilidadesLocationsPage/>},
    {path:'ubicaciones/:id/:section',element:<UtilidadesLocationWorkspacePage/>},
    {path:'clientes',element:<UtilidadesClientsPage/>},{path:'agencias',element:<UtilidadesAgenciesPage/>},{path:'alertas',element:<UtilidadesAlertsPage/>},
    {path:'casos',element:<UtilidadesCasesPage/>},
    {path:'operaciones',element:<UtilidadesOperationsPage/>},{path:'acciones',element:<Navigate to="../operaciones?tab=actions" replace/>},
    {path:'ordenes-trabajo',element:<UtilidadesWorkOrdersPage/>},{path:'ordenes',element:<Navigate to="../ordenes-trabajo" replace/>},
    {path:'campanas-resenas',element:<UtilidadesCampaignsPage/>},{path:'campanas-citaciones',element:<UtilidadesCampaignsPage/>},
    {path:'publicaciones-gbp',element:<UtilidadesGbpPostsPage/>},{path:'integraciones',element:<UtilidadesIntegrationsPage/>},{path:'mercado',element:<UtilidadesMarketPage/>},
    {path:'prospectos',element:<UtilidadesProspectsPage/>},{path:'marca-blanca',element:<UtilidadesWhiteLabelPage/>},{path:'auditoria',element:<UtilidadesAuditPage/>},{path:'alcances',element:<UtilidadesScopesPage/>},
  ]},
]);
