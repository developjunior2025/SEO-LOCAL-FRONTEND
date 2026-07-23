import { useEffect, useState, type ReactNode } from 'react';
import { AGENCIES, MARKETPLACE_CATEGORIES, POPULAR_SERVICES } from '@/data';
import type { Agency, Service, Offer, SearchState, MarketplaceCategory, User } from '@/types';
import { marketplaceApi, type CreateLeadPayload } from '@/services/marketplaceApi';
import { adminApi } from '@/services/adminApi';
import { AUTH_STORAGE_KEY, DEMO_USERS, normalizeEmail } from './authHelpers';

export interface AppStateValue {
  // Auth
  user: User | null;
  login: (email: string, password: string) => User | null;
  loginWithBackend: (email: string, password: string) => Promise<User | null>;
  logout: () => void;

  // Catalog (bootstrapped from the API, falls back to local mock data — see marketplaceApi.getBootstrap()).
  agenciesList: Agency[];
  marketplaceCategories: MarketplaceCategory[];
  servicesList: Service[];
  backendSource: 'postgresql' | 'mock';

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
  handleClaimOffer: (offer: Offer) => void;
  handleAddReview: (agencyId: string, rating: number, text: string, name: string) => void;
  handleHireAgency: (agency: Agency) => void;
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

  // Lists & collections
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<Service[]>([]);
  const [compareServices, setCompareServices] = useState<Service[]>([]);
  const [agenciesList, setAgenciesList] = useState<Agency[]>(AGENCIES);
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>(MARKETPLACE_CATEGORIES);
  const [servicesList, setServicesList] = useState<Service[]>(POPULAR_SERVICES);
  const [backendSource, setBackendSource] = useState<'postgresql' | 'mock'>('mock');

  // Auth
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      if (parsed?.id && parsed?.email && parsed?.role) return parsed;
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, password: string): User | null => {
    const normalized = normalizeEmail(email);
    const found = DEMO_USERS.find((u) => normalizeEmail(u.email) === normalized);
    if (!found) return null;
    if (password !== 'Demo1234') return null;
    setUser(found);
    return found;
  };

  const loginWithBackend = async (email: string, password: string): Promise<User | null> => {
    try {
      const session = await adminApi.login(email, password);
      const backendUser: User = {
        id: String(session.user.id),
        email: session.user.login || email,
        name: session.user.name || session.user.login || email,
        role: 'admin',
        avatar: undefined,
      };
      setUser(backendUser);
      window.dispatchEvent(new CustomEvent('seo-dashboard-login', { detail: session }));
      return backendUser;
    } catch {
      return null;
    }
  };

  const logout = () => {
    setUser(null);
  };

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

    marketplaceApi.getBootstrap(controller.signal)
      .then(async (payload) => {
        if (payload.categories?.length) setMarketplaceCategories(payload.categories);
        if (payload.agencies?.length) setAgenciesList(payload.agencies);

        const furServicesResponse = await marketplaceApi.getServices({ furOnly: true }, controller.signal);
        const furServices = (furServicesResponse.items || [])
          .slice()
          .sort((a, b) => (a.furNumber || 9999) - (b.furNumber || 9999));

        const bootstrapFurServices = (payload.services || [])
          .slice()
          .sort((a, b) => (a.furNumber || 9999) - (b.furNumber || 9999));

        // El home debe mostrar 8 tarjetas iniciales y permitir desplegar el catálogo completo.
        // Si la API todavía devuelve solo los 4 servicios mock antiguos, no reemplazamos
        // el fallback local de 45 FUR-Servicios. La migración 014 repara la BD, pero este
        // guard evita que el home vuelva a quedar limitado a 4 tarjetas.
        if (furServices.length >= 8) {
          setServicesList(furServices);
        } else if (bootstrapFurServices.length >= 8) {
          setServicesList(bootstrapFurServices);
        } else {
          console.warn(`[SEO Local] Catálogo FUR incompleto en API (${furServices.length || bootstrapFurServices.length}); se mantiene fallback local con 45 FUR-Servicios.`);
        }

        setBackendSource('postgresql');
        console.info(`[SEO Local] Datos conectados a PostgreSQL autónomo: ${payload.meta.database}`);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setBackendSource('mock');
        console.warn('[SEO Local] La API PostgreSQL no está disponible; se mantienen los datos mock.', error);
      });

    return () => controller.abort();
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
        triggerToast('¡Agregado a tus favoritos con éxito!');
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
        triggerToast(`'${srv.title}' agregado al carrito de cobros.`);
        return [...prev, srv];
      }
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (srvId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== srvId));
    triggerToast('Servicio eliminado de la pre-selección.');
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
    triggerToast(`'${srv.title}' agregado al comparador.`);
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
  const handleClaimOffer = (offer: Offer) => {
    setSelectedPurchaseItem(offer);
  };

  // Action callback when adding a fully-real review in detail panel
  const handleAddReview = (agencyId: string, rating: number, text: string, name: string) => {
    void name;
    setAgenciesList((prev) =>
      prev.map((agency) => {
        if (agency.id === agencyId) {
          const newReviewsCount = agency.reviewsCount + 1;
          const newRating = (agency.rating * agency.reviewsCount + rating) / newReviewsCount;
          return {
            ...agency,
            rating: Math.min(newRating, 5.0),
            reviewsCount: newReviewsCount,
            highlightReview: text,
          };
        }
        return agency;
      })
    );
    triggerToast('¡Gracias por tu reseña! Se ha incorporado al perfil.');
  };

  const handleHireAgency = (agency: Agency) => {
    const mockService: Service = {
      id: `plan-${agency.id}`,
      title: `Plan SEO Local Mensual - ${agency.name}`,
      description: `Estrategia integral SEO Local, gestión continuada de GBP y auditorías para mejorar tus rankings locales directos.`,
      price: agency.startingPrice,
      iconName: 'trending_up',
    };
    setSelectedPurchaseItem(mockService);
  };

  const value: AppStateValue = {
    user,
    login,
    loginWithBackend,
    logout,
    agenciesList,
    marketplaceCategories,
    servicesList,
    backendSource,
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
