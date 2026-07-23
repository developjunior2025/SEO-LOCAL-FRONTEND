import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { Offer } from '@/types';
import { marketplaceApi } from '@/services/marketplaceApi';
import { isDemoDataEnabled } from '@/lib/apiConfig';
import { SPECIAL_OFFERS } from '@/data';
import { Percent, Tag, Loader2, AlertCircle } from 'lucide-react';

interface OffersProps {
  onClaimOffer: (offer: Offer, payload?: { email: string; name?: string; phone?: string }) => Promise<void>;
}

export default function Offers({ onClaimOffer }: OffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await marketplaceApi.getActiveOffers();
        if (!cancelled) setOffers(response.items || []);
      } catch {  // backend unavailable
        if (isDemoDataEnabled()) {
          setOffers(SPECIAL_OFFERS);
        } else if (!cancelled) {
          setError('No se pudieron cargar las ofertas.');
          setOffers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const activeOffers = useMemo(() => {
    const now = new Date().toISOString();
    return offers.filter((offer) => {
      if (offer.status && offer.status !== 'active') return false;
      if (offer.startsAt && offer.startsAt > now) return false;
      if (offer.expiresAt && offer.expiresAt < now) return false;
      return true;
    });
  }, [offers]);

  if (loading) {
    return (
      <section id="offers" className="py-16 bg-gray-50 border-t border-b border-gray-150 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-sm font-bold text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando ofertas...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="offers" className="py-12 bg-gray-50 border-t border-b border-gray-150 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-sm font-bold text-gray-500">
          <AlertCircle className="w-4 h-4 text-[#D32323]" /> {error}
        </div>
      </section>
    );
  }

  if (activeOffers.length === 0) {
    return null;
  }

  return (
    <section id="offers" className="py-20 bg-gray-50 border-t border-b border-gray-150 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-[#D32323]/10 text-[#D32323] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5" /> Ahorro Garantizado
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#333] tracking-tight leading-tight">
              Ofertas exclusivas por tiempo limitado
            </h2>
            <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed">
              Nuestras agencias verificadas ofrecen paquetes especiales con descuentos temporales diseñados especialmente para nuevos clientes de SEO LOCAL.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Email para recibir ofertas</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-[#333] outline-none focus:border-[#D32323]"
              />
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeOffers.map((offer) => {
              const saveAmount = offer.originalPrice - offer.discountedPrice;
              const discount = offer.discountPercent || Math.round((saveAmount / offer.originalPrice) * 100);

              return (
                <motion.div
                  key={offer.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-lg relative flex flex-col hover:shadow-2xl transition-all duration-300"
                >
                  <div className="absolute top-4 right-4 bg-[#D32323] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    {discount}% DESCUENTO
                  </div>

                  <span className="text-xs uppercase font-extrabold text-[#D32323] tracking-widest block mb-1">
                    PROMOCIÓN
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
                    <span className="text-lg text-gray-400 font-bold line-through">
                      ${offer.originalPrice}
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg shrink-0 ml-auto">
                      Ahorras ${saveAmount}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (!email) {
                        alert('Ingresa tu email para reclamar la oferta.');
                        return;
                      }
                      setClaiming(offer.id);
                      onClaimOffer(offer, { email }).finally(() => setClaiming(null));
                    }}
                    disabled={claiming === offer.id}
                    className="w-full bg-[#333] hover:bg-[#D32323] text-white cursor-pointer font-extrabold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-60"
                  >
                    <Tag className="w-4 h-4" />
                    <span>{claiming === offer.id ? 'Reclamando...' : 'Obtener esta oferta'}</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
