import { useEffect, useState } from 'react';
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import {
  X,
  Heart,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  GitCompare,
  CalendarDays,
  Clock3,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/modals/CheckoutModal';
import AgencyDetailsModal from '@/components/modals/AgencyDetailsModal';
import ProjectRequestModal from '@/components/modals/ProjectRequestModal';
import { useAppState } from '@/state/useAppState';
import type { Service } from '@/types';
import { getServiceRoute } from '@/utils/serviceRoutes';

const DEFAULT_TITLE = 'SEOLOCAL | Marketplace de agencias SEO Local';

function formatServiceBilling(period?: string) {
  if (!period || period === 'único') return 'pago único';
  if (period === 'mes') return '/mes';
  if (period === 'trimestre') return '/trimestre';
  return period;
}

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const {
    agenciesList,
    marketplaceCategories,
    backendSource,
    favorites,
    cart,
    compareServices,
    selectedAgency,
    setSelectedAgency,
    selectedPurchaseItem,
    setSelectedPurchaseItem,
    successToast,
    triggerToast,
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
    handleToggleFavorite,
    handleAddToCart,
    handleRemoveFromCart,
    handleRemoveCompareService,
    handleClearCompareServices,
    handleAddReview,
    handleHireAgency,
    handleCreateProjectLead,
  } = useAppState();

  // Título de página según la ruta activa (cada Route define `handle: { title }`).
  useEffect(() => {
    const activeMatch = [...matches].reverse().find((match) => (match.handle as { title?: string } | undefined)?.title);
    document.title = (activeMatch?.handle as { title?: string } | undefined)?.title || DEFAULT_TITLE;
  }, [matches]);

  // Al cambiar de ruta: si la URL trae un fragmento (#agencies, #services, #offers) hace scroll suave
  // hasta esa sección del Home; si no, sube al tope. Reemplaza al listener de `hashchange` del original.
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToService = (service: Service) => navigate(getServiceRoute(service));

  return (
    <div data-backend-source={backendSource} className="bg-[#f5f5f5] text-[#333] font-sans antialiased selection:bg-[#D32323] selection:text-white min-h-screen flex flex-col scroll-smooth">
      {/* 1. Transparent Sticky Header component */}
      <Header />

      <main className="flex-1">
        <Outlet />

        {/* Toast confirmation banner */}
        {successToast && (
          <div className="fixed bottom-6 left-6 z-50 bg-[#333] border border-gray-800 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">{successToast}</span>
          </div>
        )}
      </main>

      {/* 9. Dark-Styled Footer */}
      <Footer />

      {/* Auxiliary Dialog 1: User Login Auth Dialog */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowAuthModal(false)} />
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl z-10 relative border border-gray-150 space-y-6">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100" onClick={() => setShowAuthModal(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-[#D32323] mx-auto font-black text-lg">Y</div>
              <h3 className="font-extrabold text-xl">Accede a tu Panel Local</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Valora agencias, gestiona presupuestos en custodia o chatea con tus consultores.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowAuthModal(false); triggerToast('¡Sesión iniciada con éxito!'); }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Email Corporativo</label>
                <input required type="email" placeholder="nombre@tuempresa.com" className="w-full bg-white border border-gray-250 py-3 px-4 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#D32323]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Contraseña</label>
                <input required type="password" placeholder="••••••••" className="w-full bg-white border border-gray-250 py-3 px-4 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#D32323]" />
              </div>

              <button type="submit" className="w-full bg-[#D32323] hover:bg-[#b01c1c] text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md">
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auxiliary Dialog 2: Shopping Cart Side Drawer Drawer */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowCartDrawer(false)} />
          <div className="bg-white w-full max-w-md h-full shadow-2xl z-10 relative p-6 flex flex-col border-l border-gray-250 animate-fade-in-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="font-black text-lg">Mi Carrito de Servicios</h3>
              <button onClick={() => setShowCartDrawer(false)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
                <h4 className="font-extrabold text-gray-700 text-sm">El carrito está vacío</h4>
                <p className="text-xs text-gray-500 font-medium">Ve a la sección 'Servicios Populares' para pre-seleccionar tus auditorías locales.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto py-4 divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="flex-1">
                      <h4 className="font-extrabold text-xs text-[#333]">{item.title}</h4>
                      <span className="text-xs text-emerald-600 font-black">${item.price}</span>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.id)} className="text-xs font-black text-gray-400 hover:text-[#D32323] cursor-pointer self-center">Eliminar</button>
                  </div>
                ))}

                <div className="pt-6 space-y-4">
                  <div className="flex justify-between font-black text-base text-[#333]">
                    <span>Total estimado:</span>
                    <span>${cart.reduce((acu, s) => acu + s.price, 0)}</span>
                  </div>

                  <button
                    onClick={() => {
                      const mockCompositeService: Service = {
                        id: 'composite-srv',
                        title: `${cart.length} Servicios Locales Combinados`,
                        description: `Comprende el pack de auditorías y gestiones para subir posiciones en Google Maps.`,
                        price: cart.reduce((acu, s) => acu + s.price, 0),
                        iconName: 'format_list_bulleted'
                      };
                      setSelectedPurchaseItem(mockCompositeService);
                      setShowCartDrawer(false);
                    }}
                    className="w-full bg-[#0074E0] hover:bg-[#005BB5] text-white font-extrabold py-3.5 rounded-xl cursor-pointer shadow-md text-xs sm:text-sm text-center block"
                  >
                    Depositar Custodia y Contratar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auxiliary Dialog 3: Favorites List Modal */}
      {showFavsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowFavsModal(false)} />
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 relative border border-gray-150 flex flex-col max-h-[80vh]">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100" onClick={() => setShowFavsModal(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-gray-150 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#D32323] fill-[#D32323]" />
              <h3 className="font-black text-lg">Agencias Guardadas</h3>
            </div>

            {favorites.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Heart className="w-10 h-10 mx-auto text-gray-250" />
                <p className="text-xs font-semibold">Aún no has guardado ninguna agencia local en favoritos.</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3 flex-1 divide-y divide-gray-100">
                {favorites.map((favId) => {
                  const ag = agenciesList.find((a) => a.id === favId);
                  if (!ag) return null;

                  return (
                    <div key={ag.id} className="pt-3 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${ag.logoBgColor} rounded-lg text-white flex items-center justify-center font-black text-sm`}>{ag.logoLetter}</div>
                        <div>
                          <h4 className="font-extrabold text-xs text-[#333]">{ag.name}</h4>
                          <span className="text-[10px] text-gray-400">{ag.location}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => { setSelectedAgency(ag); setShowFavsModal(false); }}
                          className="text-[10px] bg-red-50 text-[#D32323] font-bold px-2.5 py-1.5 rounded-lg border border-red-100"
                        >
                          Ver
                        </button>
                        <button onClick={() => handleToggleFavorite(ag.id)} className="text-[10px] text-gray-400 hover:text-[#D32323] font-bold py-1.5 px-2">Quitar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auxiliary Dialog 4: Dynamic Chat Messages Modal */}
      {showMessagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowMessagesModal(false)} />
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 relative border border-gray-150 flex flex-col max-h-[85vh]">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100" onClick={() => setShowMessagesModal(false)}>
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-gray-150 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-black text-lg">Mensajes y Consultas Online</h3>
            </div>

            {/* Chat list history */}
            <div className="space-y-4 overflow-y-auto flex-1 h-80 divide-y divide-gray-100 pr-2">
              {/* Message 1 */}
              <div className="pt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-gray-700">AirSEO Miami</span>
                  <span className="text-gray-400">Hace 3 horas</span>
                </div>
                <p className="text-xs text-gray-600 bg-red-50/50 p-2.5 rounded-xl border border-red-100 font-medium">
                  "Hola Carlos, hemos revisado tu clínica dental en Google Maps. Tiene potencial para subir al Top 3 en menos de 45 días si corregimos los duplicados de dirección. ¿Hacemos llamada?"
                </p>
              </div>

              {/* Message 2 */}
              <div className="pt-4 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-gray-700">Growth NYC</span>
                  <span className="text-gray-400">Ayer</span>
                </div>
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-150 font-medium">
                  "Perfecto Clara. Ya hemos comenzado la auditoría de citaciones duplicadas. Te enviaremos el Excel mañana al final de la tarde."
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-150 mt-4">
              <span className="text-[10px] font-black tracking-wider text-[#D32323] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> CHAT PROTEGIDO POR SEO LOCAL
              </span>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <ProjectRequestModal
          categories={marketplaceCategories}
          onClose={() => setShowProjectModal(false)}
          onSubmit={handleCreateProjectLead}
        />
      )}

      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowCompareModal(false)} />
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[88vh] shadow-2xl z-10 relative border border-gray-150 flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-gray-150 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#D32323]/10 text-[#D32323] flex items-center justify-center shrink-0">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#D32323]">Comparador de FUR-Servicios</p>
                  <h3 className="font-black text-xl text-[#333]">Compara servicios antes de contratar</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Evalúa precio, modalidad, entrega, categoría y alcance para elegir mejor.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {compareServices.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompareServices}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-black text-gray-500 hover:text-[#D32323] hover:border-[#D32323]/35 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Limpiar
                  </button>
                )}
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setShowCompareModal(false)}
                  aria-label="Cerrar comparador"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {compareServices.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-4">
                <GitCompare className="w-14 h-14 mx-auto text-gray-250" />
                <div>
                  <h4 className="font-black text-lg text-[#333]">Aún no hay servicios para comparar</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Usa el botón de comparar dentro de cualquier tarjeta del catálogo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  className="inline-flex items-center gap-2 bg-[#D32323] hover:bg-[#b01c1c] text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
                >
                  Volver al catálogo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto p-5 sm:p-7 bg-[#f5f5f5]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {compareServices.map((service) => (
                    <article key={service.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <span className="inline-flex items-center rounded-full bg-red-50 text-[#D32323] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">
                          {service.code || 'FUR'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompareService(service.id)}
                          className="w-8 h-8 rounded-xl border border-gray-200 text-gray-400 hover:text-[#D32323] hover:border-[#D32323]/40 flex items-center justify-center transition-all"
                          aria-label={`Quitar ${service.title} del comparador`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="font-black text-base text-[#333] leading-tight line-clamp-2 min-h-[2.5rem]">{service.title}</h4>
                      <p className="text-[10px] uppercase tracking-wider font-black text-[#D32323] mt-2 line-clamp-1">{service.categoryName || 'SEO Local'}</p>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed mt-3 line-clamp-3 min-h-[3.7rem]">{service.description}</p>

                      <div className="grid grid-cols-1 gap-2 mt-4 text-[11px] font-bold text-gray-500">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                          <CalendarDays className="w-4 h-4 text-[#333]" />
                          <span>Entrega {service.deliveryDays ? `${service.deliveryDays} días` : 'a coordinar'}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                          <Clock3 className="w-4 h-4 text-[#333]" />
                          <span>Modalidad {formatServiceBilling(service.billingPeriod)}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-150 flex items-end justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Desde</span>
                          <div className="flex items-end gap-1.5">
                            <span className="text-2xl font-black text-[#333] leading-none">${service.price}</span>
                            {service.billingPeriod && service.billingPeriod !== 'único' && (
                              <span className="text-[10px] text-gray-400 font-bold pb-0.5">{formatServiceBilling(service.billingPeriod)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompareModal(false);
                            navigateToService(service);
                          }}
                          className="bg-[#D32323] hover:bg-[#b01c1c] text-white rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Ver ficha
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(service)}
                          className="border border-gray-200 bg-white text-gray-600 hover:text-[#D32323] hover:border-[#D32323]/40 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Carrito
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[#333]">Puedes comparar hasta 4 servicios.</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">El comparador no duplica productos; solo organiza servicios seleccionados para decisión rápida.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(false)}
                    className="inline-flex items-center justify-center gap-2 border border-gray-250 bg-white hover:border-[#D32323]/40 hover:text-[#D32323] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Seguir explorando <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. Core Checkout Modal component */}
      <CheckoutModal
        isOpen={selectedPurchaseItem !== null}
        onClose={() => setSelectedPurchaseItem(null)}
        selectedItem={selectedPurchaseItem}
        onConfirmSuccess={() => triggerToast('¡Gracias! Tu pago de Escrow ha quedado retenido de forma totalmente segura.')}
      />

      {/* 11. Immersive Agency Profile/Review Modal component */}
      <AgencyDetailsModal
        isOpen={selectedAgency !== null}
        onClose={() => setSelectedAgency(null)}
        agency={selectedAgency}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onAddReview={handleAddReview}
        onHireAgency={handleHireAgency}
      />

      {/* Modern Floating back to top controller */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-[#D32323] hover:bg-[#b01c1c] text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer border border-[#D32323]/22 transition-all duration-300"
          aria-label="Volver al inicio de la página"
        >
          <span className="text-xl font-black leading-none -translate-y-0.5">↑</span>
        </button>
      )}
    </div>
  );
}
