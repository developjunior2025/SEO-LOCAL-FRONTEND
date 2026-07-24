import { useEffect, useState, type ReactNode } from 'react';
import type { Agency, Service, Offer, SearchState, MarketplaceCategory, User } from '@/types';
import { marketplaceApi, type CreateLeadPayload } from '@/services/marketplaceApi';
import { AUTH_STORAGE_KEY } from './authHelpers';

export interface AppStateValue {
  // Auth
  user: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;

  // Catalog
  agenciesList: Agency[];
  marketplaceCategories: MarketplaceCategory[];
  servicesList: Service[];
  backendSource: 'postgresql' | 'mock';
  isMarketplaceLoading: boolean;
  marketplaceError: string | null;

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
  const [agenciesList, setAgenciesList] = useState<Agency[]>([]);
  const [marketplaceCategories, setMarketplaceCategories] = useState<MarketplaceCategory[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [backendSource, setBackendSource] = useState<'postgresql' | 'mock'>('mock');
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(true);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);

  // Auth
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [user]);

  const login = (_email: string, _password: string): User | null => {
    return null;
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
    setIsMarketplaceLoading(true);
    setMarketplaceError(null);

    marketplaceApi.getBootstrap(controller.signal)
      .then((payload) => {
        if (payload.categories?.length) setMarketplaceCategories(payload.categories);
        if (payload.agencies?.length) setAgenciesList(payload.agencies);

        const bootstrapServices = (payload.services || [])
          .slice()
          .sort((a, b) => (a.furNumber || 9999) - (b.furNumber || 9999));

        setServicesList(bootstrapServices);

        setBackendSource('postgresql');
        setIsMarketplaceLoading(false);
        console.info(`[SEO Local] Datos conectados a PostgreSQL autónomo: ${payload.meta.database}`);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setBackendSource('mock');
        setMarketplaceError(error instanceof Error ? error.message : 'No se pudo cargar el marketplace.');
        setIsMarketplaceLoading(false);
        console.warn('[SEO Local] La API PostgreSQL no está disponible.', error);
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
    triggerToast('Reseña enviada desde esta vista. La ficha pública real depende del backend.');
  };

  const handleHireAgency = (agency: Agency) => {
    const normalize = (value?: string) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const agencyLabels = [agency.speciality, ...(agency.services || [])].map(normalize).filter(Boolean);
    const matchedService = servicesList.find((service) => {
      const candidates = [service.title, service.categoryName, service.code].map(normalize);
      return candidates.some((candidate) => agencyLabels.some((label) => candidate.includes(label) || label.includes(candidate)));
    });

    if (matchedService) {
      setSelectedPurchaseItem(matchedService);
      return;
    }

    setSelectedPurchaseItem({
      id: `agency-selection-${agency.id}`,
      title: `Solicitud comercial con ${agency.name}`,
      description: 'Preselección comercial para iniciar una cotización real con la agencia.',
      price: agency.startingPrice,
      iconName: 'message',
    });
  };

  const value: AppStateValue = {
    user,
    login,
    logout,
    agenciesList,
    marketplaceCategories,
    servicesList,
    backendSource,
    isMarketplaceLoading,
    marketplaceError,
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
