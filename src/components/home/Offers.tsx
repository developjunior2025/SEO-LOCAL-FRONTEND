import { motion } from 'motion/react';
import { Offer, Service } from '@/types';
import { Percent, Tag } from 'lucide-react';

interface OffersProps {
  offers: Offer[];
  sourceServicesCount: number;
  onClaimOffer: (offer: Offer) => void;
}

export function buildHomeOffersFromServices(services: Service[]): Offer[] {
  return services
    .filter((service) => service.isPopular)
    .slice(0, 2)
    .map((service, index) => ({
      id: `catalog-offer-${service.id}`,
      title: service.title,
      description: service.description,
      originalPrice: service.price,
      discountedPrice: service.price,
      badge: index === 0 ? 'CATÁLOGO REAL' : 'SELECCIÓN ACTUAL',
    }));
}

export default function Offers({ offers, sourceServicesCount, onClaimOffer }: OffersProps) {
  if (offers.length === 0) return null;

  return (
    <section id="offers" className="py-20 bg-gray-50 border-t border-b border-gray-150 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-[#D32323]/10 text-[#D32323] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5" /> Catálogo operativo
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#333] tracking-tight leading-tight">
              Selecciones destacadas del catálogo actual
            </h2>

            <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed">
              Estos servicios provienen del catálogo activo del marketplace. Se muestran como referencia comercial para continuar una solicitud real sin depender de promociones mock.
            </p>

            <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-2">
              <span className="text-[10px] font-extrabold text-[#777] uppercase tracking-wider block">
                SERVICIOS DISPONIBLES
              </span>
              <p className="text-sm font-bold text-[#333]">{sourceServicesCount} servicios reales listos para explorar y solicitar.</p>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {offers.map((offer) => (
              <motion.div
                key={offer.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-lg relative flex flex-col hover:shadow-2xl transition-all duration-300"
              >
                <div className="absolute top-4 right-4 bg-[#D32323] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  {offer.badge}
                </div>

                <span className="text-xs uppercase font-extrabold text-[#D32323] tracking-widest block mb-1">
                  SELECCIÓN
                </span>

                <h3 className="font-extrabold text-lg sm:text-xl text-[#333] mb-3 leading-snug">
                  {offer.title}
                </h3>

                <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed flex-1">
                  {offer.description}
                </p>

                <div className="flex items-baseline gap-2 mb-6 pt-4 border-t border-gray-100">
                  <span className="text-4xl font-black text-[#D32323]">
                    ${offer.discountedPrice}
                  </span>
                  <span className="text-xs font-black text-gray-500 bg-gray-100 px-2 py-1.5 rounded-lg shrink-0 ml-auto">
                    Precio actual del catálogo
                  </span>
                </div>

                <button
                  onClick={() => onClaimOffer(offer)}
                  className="w-full bg-[#333] hover:bg-[#D32323] text-white cursor-pointer font-extrabold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <Tag className="w-4 h-4" />
                  <span>Solicitar este servicio</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
