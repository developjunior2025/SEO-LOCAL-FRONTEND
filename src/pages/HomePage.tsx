import { useNavigate } from 'react-router-dom';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import MapView from '@/components/home/MapView';
import FeaturedAgencies from '@/components/home/FeaturedAgencies';
import PopularServices from '@/components/home/PopularServices';
import Offers from '@/components/home/Offers';
import Benefits from '@/components/home/Benefits';
import { useAppState } from '@/state/useAppState';
import { useHeroSearch } from '@/routes/navigation';
import type { Agency, Service } from '@/types';
import { getServiceRoute } from '@/utils/serviceRoutes';

export default function HomePage() {
  const navigate = useNavigate();
  const handleHeroSearch = useHeroSearch();
  const {
    agenciesList,
    marketplaceCategories,
    servicesList,
    searchState,
    setSearchState,
    hoveredAgencyId,
    setHoveredAgencyId,
    favorites,
    handleToggleFavorite,
    cart,
    compareServices,
    handleAddToCart,
    handleToggleCompareService,
    handleClaimOffer,
    triggerToast,
  } = useAppState();

  const navigateToService = (service: Service) => navigate(getServiceRoute(service));
  const navigateToAgencyProfile = (agency: Agency) => navigate(`/agencias/${agency.slug || agency.id}`);

  // Category trigger
  const handleCategorySelect = (serviceName: string) => {
    setSearchState((prev) => ({ ...prev, keyword: serviceName }));
    triggerToast(`Filtrando especialidad: ${serviceName || 'Todas'}`);

    // Smooth scroll down to grid list of agencies
    const el = document.getElementById('agencies');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dynamic filter logic
  const filteredAgencies = agenciesList.filter((agency) => {
    const keywordMat = searchState.keyword.trim().toLowerCase();
    const locationMat = searchState.location.trim().toLowerCase();
    const searchableText = [
      agency.name,
      agency.location,
      agency.city,
      agency.country,
      agency.speciality,
      agency.commercialSummary,
      agency.badgeLabel,
      ...(agency.services || []),
    ].filter(Boolean).join(' ').toLowerCase();
    const searchableLocation = [agency.location, agency.city, agency.country].filter(Boolean).join(' ').toLowerCase();

    const matchesKeyword = !keywordMat || searchableText.includes(keywordMat);
    const matchesLocation = !locationMat || searchableLocation.includes(locationMat);

    return matchesKeyword && matchesLocation;
  });

  return (
    <>
      {/* 2. Hero Component */}
      <Hero
        onSearch={handleHeroSearch}
        selectedKeyword={searchState.keyword}
        selectedLocation={searchState.location}
      />

      {/* 3. Category Grid Component */}
      <Categories
        categories={marketplaceCategories}
        onSelectCategory={handleCategorySelect}
        activeCategory={searchState.keyword}
      />

      {/* 4. Map View Component */}
      <MapView
        agencies={filteredAgencies}
        hoveredAgencyId={hoveredAgencyId}
        onHoverAgency={setHoveredAgencyId}
        onSelectAgency={navigateToAgencyProfile}
      />

      {/* 5. Product Grid Agencies list */}
      <FeaturedAgencies
        agencies={filteredAgencies}
        onHoverAgency={setHoveredAgencyId}
        hoveredAgencyId={hoveredAgencyId}
        onSelectProfile={navigateToAgencyProfile}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* 6. Popular Micro-Services Section */}
      <PopularServices services={servicesList} onAddToCart={handleAddToCart} onOpenService={navigateToService} cart={cart} compareServices={compareServices} onToggleCompare={handleToggleCompareService} />

      {/* 7. Special Promo Offer Blocks */}
      <Offers onClaimOffer={handleClaimOffer} />

      {/* 8. Trust Guarantees Checklist */}
      <Benefits />
    </>
  );
}
