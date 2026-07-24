import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AGENCIES, MARKETPLACE_CATEGORIES, POPULAR_SERVICES } from '@/data';
import type { Agency, Service, Offer, SearchState, MarketplaceCategory, User } from '@/types';
import { ApiError, isDemoDataEnabled } from '@/lib/apiConfig';
import { marketplaceApi, type CreateLeadPayload } from '@/services/marketplaceApi';
import { adminApi, clearAdminToken, type DashboardSession } from '@/services/adminApi';
import {
  AUTH_STORAGE_KEY,
  mapBackendRoleToFrontend,
  normalizeEmail,
  tryDemoLogin,
} from './authHelpers';

export interface AppStateValue {
  // Auth
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  clearAuthError: () => void;

  // Catalog (bootstrapped from the API; mock data only when VITE_ENABLE_DEMO_DATA=true).
  agenciesList: Agency[];
  marketplaceCategories: MarketplaceCategory[];
  servicesList: Service[];
  backendSource: 'postgresql' | 'demo' | 'unavailable';
  catalogLoading: boolean;
  catalogError: string | null;

  // Search
  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;

  // Hover & selection
  hoveredAgencyId: string | null;
  setHoveredAgencyId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAgency: Agency | null;
  setSelectedAgency: React.Dispatch<React.SetStateAction<Agency | null>>;
  selectedPurchaseItem: Service | Offer | null;
  setSelectedPurchaseItem: React.Dispatch<React.SetStateAction<Service | Offer | null>>;

  // Lists & collections
  favorites: string[];
  cart: Service[];
  compareServices: Service[];

  // Modals visibility
  showAuthModal: boolean;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  showCartDrawer: boolean;
  setShowCartDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  showFavsModal: boolean;
  setShowFavsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showMessagesModal: boolean;
  setShowMessagesModal: React.Dispatch<React.SetStateAction<boolean>>;
  showCompareModal: boolean;
  setShowCompareModal: React.Dispatch<React.SetStateAction<boolean>>;
  showProjectModal: boolean;
  setShowProjectModal: React.Dispatch<React.SetStateAction<boolean>>;

  successToast: string | null;
  triggerToast: (msg: string) => void;

  handleCreateProjectLead: (payload: CreateLeadPayload) => Promise<{ reference: string }>;
  handleToggleFavorite: (agencyId: string) => void;
  handleAddToCart: (srv: Service) => void;
  handleRemoveFromCart: (srvId: string) => void;
  handleToggleCompareService: (srv: Service) => void;
  handleRemoveCompareService: (srvId: string) => void;
  handleClearCompareServices: () => void;
  handleClaimOffer: (offer: Offer, payload?: { email: string; name?: string; phone?: string }) => Promise<void>;
  handleAddReview: (agencyId: string, rating: number, text: string, name: string, agencyIdentifier?: string) => Promise<void>;
  handleHireAgency: (agency: Agency, payload?: { name: string; email: string; phone?: string; company?: string; description?: string }) => Promise<void>;
}

import { AppStateContext } from './AppStateContext';

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Filters & searches
  const [searchState, setSearchState] = useState<SearchState>(() => {
    const savedCity = typeof window !== 'undefined' ? window.localStorage.getItem('seoLocalPreferredCity') : null;
    return { keyword: '', location: savedCity || '' };
  });

  // Hover & selection
  const [hoveredAgencyId, setHoveredAgencyId] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<Service | Offer | null>(null);

  // Lists & collections (persisted locally; no backend requirement)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('seoLocalFavorites') || '[]');
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState<Service[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('seoLocalCart') || '[]');
    } catch {
      return [];
    }
  });
  const [compareServices, setCompareServices] = useState<Service[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('seoLocalCompareServices') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('seoLocalFavorites', JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('seoLocalCart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('seoLocalCompareServices', JSON.stringify(compareServices));
  }, [compareServices]);
  const [agenciesList, setAgenciesList] = useState<Agency[]>(() => (isDemoDataEnabled() ? AGENCIES : []));
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>(() => (isDemoDataEnabled() ? MARKETPLACE_CATEGORIES : []));
  const [servicesList, setServicesList] = useState<Service[]>(() => (isDemoDataEnabled() ? POPULAR_SERVICES : []));
  const [backendSource, setBackendSource] = useState<'postgresql' | 'demo' | 'unavailable'>(() => (isDemoDataEnabled() ? 'demo' : 'postgresql'));
  const [catalogError, setCatalogError] = useState<string | null>(() => (isDemoDataEnabled() ? null : null));
  const [catalogLoading, setCatalogLoading] = useState(() => !isDemoDataEnabled());

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const persistUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (typeof window === 'undefined') return;
    if (nextUser) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const mapSessionToUser = useCallback((session: DashboardSession): User => {
    const backend = session.user;
    return {
      id: String(backend.id),
      email: backend.login || '',
      name: backend.displayName || backend.login || '',
      role: mapBackendRoleToFrontend(backend.roleCode),
      avatar: undefined,
      roleCode: backend.roleCode,
      roleName: backend.roleName,
      permissions: backend.permissions,
      agencyPartnerId: backend.agencyPartnerId,
    };
  }, []);

  const finalizeLogout = useCallback(() => {
    persistUser(null);
    setAuthError(null);
    clearAdminToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seo-dashboard-logout'));
    }
  }, [persistUser]);

  const handleAuthError = useCallback((error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.code === 'unauthorized' || error.code === 'forbidden') {
        finalizeLogout();
        return 'Sesión inválida o expirada. Vuelve a iniciar sesión.';
      }
      if (error.code === 'network' || error.code === 'timeout') {
        return 'No se pudo conectar con el servidor. Revisa tu conexión.';
      }
      if (error.code === 'server') {
        return 'Error del servidor. Intenta de nuevo en unos minutos.';
      }
      if (error.code === 'credentials') {
        return 'Credenciales incorrectas.';
      }
      return error.message || 'Error desconocido';
    }
    return error instanceof Error ? error.message : 'Error desconocido';
  }, [finalizeLogout]);

  const restoreSession = useCallback(async () => {
    if (typeof window === 'undefined') {
      setAuthLoading(false);
      return;
    }

    const token = adminApi.token;
    const cachedUserRaw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!token) {
      if (cachedUserRaw) window.localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthLoading(false);
      return;
    }

    try {
      const session = await adminApi.me();
      persistUser(mapSessionToUser(session));
    } catch (error: unknown) {
      finalizeLogout();
      if (error instanceof ApiError) {
        setAuthError(handleAuthError(error));
      }
    } finally {
      setAuthLoading(false);
    }
  }, [mapSessionToUser, handleAuthError, persistUser, finalizeLogout]);

  /* eslint-disable react-hooks/set-state-in-effect -- Restauración de sesión al montar; necesaria hasta migrar a React Query. */
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Note: `seo-dashboard-logout` is emitted by clearApiSession/adminApi.logout; other components may listen, but this provider does not re-trigger logout to avoid recursion.

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const normalized = normalizeEmail(email);
      if (!normalized || !password) {
        setAuthError('Ingresa email y contraseña.');
        setAuthLoading(false);
        return null;
      }

      try {
        const session = await adminApi.login(email, password);
        const nextUser = mapSessionToUser(session);
        persistUser(nextUser);
        window.dispatchEvent(new CustomEvent('seo-dashboard-login', { detail: session }));
        return nextUser;
      } catch (backendError: unknown) {
        if (backendError instanceof ApiError && backendError.code !== 'network' && backendError.code !== 'timeout') {
          const demoUser = tryDemoLogin(email, password);
          if (demoUser) {
            persistUser(demoUser);
            return demoUser;
          }
        }
        throw backendError;
      }
    } catch (error: unknown) {
      setAuthError(handleAuthError(error));
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [mapSessionToUser, handleAuthError, persistUser]);

  const logout = useCallback(async () => {
    await adminApi.logout();
  }, []);

  // Aux Modals Visibility
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showFavsModal, setShowFavsModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadCatalog() {
      if (isDemoDataEnabled()) {
        if (!cancelled) setCatalogLoading(false);
        return;
      }
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const payload = await marketplaceApi.getBootstrap(controller.signal);
        const furServicesResponse = await marketplaceApi.getServices({ furOnly: true }, controller.signal);

        if (cancelled) return;

        if (payload.categories?.length) setMarketplaceCategories(payload.categories);
        if (payload.agencies?.length) setAgenciesList(payload.agencies);

        const furServices = (furServicesResponse.items || [])
          .slice()
          .sort((a, b) => (a.furNumber || 9999) - (b.furNumber || 9999));

        const bootstrapFurServices = (payload.services || [])
          .slice()
          .sort((a, b) => (a.furNumber || 9999) - (b.furNumber || 9999));

        if (furServices.length >= 8) {
          setServicesList(furServices);
        } else if (bootstrapFurServices.length >= 8) {
          setServicesList(bootstrapFurServices);
        } else {
          console.warn(`[SEO Local] Catálogo FUR incompleto en API (${furServices.length || bootstrapFurServices.length}).`);
        }

        setBackendSource('postgresql');
        console.info(`[SEO Local] Datos conectados a PostgreSQL autónomo: ${payload.meta.database}`);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (cancelled) return;
        setBackendSource('unavailable');
        setAgenciesList([]);
        setMarketplaceCategories([]);
        setServicesList([]);
        setCatalogError('No se pudo cargar el catálogo. Verifica que el backend esté disponible.');
        console.warn('[SEO Local] La API PostgreSQL no está disponible; catálogo vacío hasta que se recupere.', error);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleCreateProjectLead = async (payload: CreateLeadPayload) => {
    const result = await marketplaceApi.createLead(payload);
    setBackendSource('postgresql');
    triggerToast(`Proyecto registrado en el módulo comercial: ${result.reference}`);
    return { reference: result.reference };
  };

  // Favorites trigger
  const handleToggleFavorite = (agencyId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(agencyId);
      if (exists) {
        triggerToast('Eliminado de tus favoritos.');
        return prev.filter((id) => id !== agencyId);
      } else {
        triggerToast('Agregado a favoritos en este navegador.');
        return [...prev, agencyId];
      }
    });
  };

  // Add micro-service into cart
  const handleAddToCart = (srv: Service) => {
    setCart((prev) => {
      const alreadyIn = prev.some((item) => item.id === srv.id);
      if (alreadyIn) {
        triggerToast('Servicio ya agregado al carrito.');
        return prev;
      } else {
        triggerToast(`'${srv.title}' agregado a tu preselección local.`);
        return [...prev, srv];
      }
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (srvId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== srvId));
    triggerToast('Servicio eliminado de tu preselección local.');
  };

  const handleToggleCompareService = (srv: Service) => {
    const alreadyInCompare = compareServices.some((item) => item.id === srv.id);

    if (alreadyInCompare) {
      setShowCompareModal(true);
      triggerToast('El servicio ya está en el comparador.');
      return;
    }

    if (compareServices.length >= 4) {
      setShowCompareModal(true);
      triggerToast('El comparador permite hasta 4 servicios a la vez.');
      return;
    }

    setCompareServices((prev) => [...prev, srv]);
    setShowCompareModal(true);
    triggerToast(`'${srv.title}' agregado al comparador local.`);
  };

  const handleRemoveCompareService = (srvId: string) => {
    setCompareServices((prev) => prev.filter((item) => item.id !== srvId));
    triggerToast('Servicio eliminado del comparador.');
  };

  const handleClearCompareServices = () => {
    setCompareServices([]);
    triggerToast('Comparador limpiado.');
  };

  // Claim a promotional special offer
  const handleClaimOffer = async (offer: Offer, payload?: { email: string; name?: string; phone?: string }) => {
    if (!payload?.email) {
      triggerToast('Completa tu email para reclamar la oferta.');
      return;
    }
    try {
      const result = await marketplaceApi.claimOffer(offer.id, payload);
      triggerToast(`Oferta reclamada: ${result.reference}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo reclamar la oferta.';
      triggerToast(message);
    }
  };

  // Action callback when adding a review in detail panel
  const handleAddReview = async (agencyId: string, rating: number, text: string, name: string, agencyIdentifier?: string) => {
    try {
      await marketplaceApi.createAgencyReview(agencyIdentifier || agencyId, {
        authorName: name || 'Cliente verificado',
        rating,
        body: text,
        title: 'Valoración desde perfil de agencia',
      });
      triggerToast('Reseña enviada para moderación.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar la reseña.';
      triggerToast(message);
    }
  };

  const handleHireAgency = async (agency: Agency, payload?: { name: string; email: string; phone?: string; company?: string; description?: string }) => {
    if (!payload?.email) {
      triggerToast('Completa tus datos para solicitar cotización.');
      return;
    }
    try {
      const result = await marketplaceApi.hireAgency(agency.slug || agency.id, payload);
      triggerToast(`Solicitud enviada: ${result.reference}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar la solicitud.';
      triggerToast(message);
    }
  };

  const value: AppStateValue = {
    user,
    authLoading,
    authError,
    login,
    logout,
    clearAuthError,
    agenciesList,
    marketplaceCategories,
    servicesList,
    backendSource,
    catalogLoading,
    catalogError,
    searchState,
    setSearchState,
    hoveredAgencyId,
    setHoveredAgencyId,
    selectedAgency,
    setSelectedAgency,
    selectedPurchaseItem,
    setSelectedPurchaseItem,
    favorites,
    cart,
    compareServices,
    showAuthModal,
    setShowAuthModal,
    showCartDrawer,
    setShowCartDrawer,
    showFavsModal,
    setShowFavsModal,
    showMessagesModal,
    setShowMessagesModal,
    showCompareModal,
    setShowCompareModal,
    showProjectModal,
    setShowProjectModal,
    successToast,
    triggerToast,
    handleCreateProjectLead,
    handleToggleFavorite,
    handleAddToCart,
    handleRemoveFromCart,
    handleToggleCompareService,
    handleRemoveCompareService,
    handleClearCompareServices,
    handleClaimOffer,
    handleAddReview,
    handleHireAgency,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
