import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Info, Users, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Agency } from '@/types';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  agencies: Agency[];
  hoveredAgencyId: string | null;
  onHoverAgency: (id: string | null) => void;
  onSelectAgency: (agency: Agency) => void;
}

function BoundsFitter({ agencies }: { agencies: Agency[] }) {
  const map = useMap();
  useEffect(() => {
    const withCoords = agencies.filter((a): a is Agency & { lat: number; lng: number } =>
      typeof a.lat === 'number' && typeof a.lng === 'number'
    );
    if (withCoords.length === 0) return;
    const bounds = L.latLngBounds(withCoords.map((a) => [a.lat, a.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12, animate: true });
  }, [map, agencies]);
  return null;
}

function createCustomIcon(agency: Agency, active: boolean) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${active ? '#D32323' : '#ffffff'};
        color: ${active ? '#ffffff' : '#D32323'};
        border: 2px solid ${active ? '#D32323' : '#e5e7eb'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 13px;
        box-shadow: 0 6px 18px rgba(211,35,35,0.28);
        transform: scale(${active ? 1.25 : 1});
        transition: all 0.2s ease;
      ">${agency.logoLetter}</div>
      ${active ? '<span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;background:rgba(211,35,35,0.18);z-index:-1;animation:pulse 1.5s infinite;"></span>' : ''}
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function MapView({
  agencies,
  hoveredAgencyId,
  onHoverAgency,
  onSelectAgency,
}: MapViewProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showClusters, setShowClusters] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const agenciesWithCoords = useMemo(
    () => agencies.filter((a): a is Agency & { lat: number; lng: number } => typeof a.lat === 'number' && typeof a.lng === 'number'),
    [agencies]
  );

  const fallbackCenter: [number, number] = [6.2442, -75.5812];

  return (
    <section className="py-20 bg-white border-b border-gray-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#D32323] tracking-wider block mb-2">
              GEOLOCALIZACIÓN INTERACTIVA
            </span>
            <h2 className="text-3xl font-black text-[#333] tracking-tight">
              Encuentra expertos en el mapa local
            </h2>
            <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
              Coloca el cursor sobre las agencias en el listado para localizarlas en el mapa real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowClusters(!showClusters)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                showClusters
                  ? 'bg-red-50 text-[#D32323] border-red-200'
                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
              }`}
            >
              Clusterizar: {showClusters ? 'SI' : 'NO'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px] overflow-hidden rounded-3xl border border-gray-200 shadow-xl">
          <div className="lg:col-span-4 bg-[#F9FAFB] flex flex-col h-full scrollbar-thin overflow-y-auto border-r border-gray-200 divide-y divide-gray-150">
            <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Agencias en el Radar
              </span>
              <span className="bg-[#D32323] text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                {agencies.length} activas
              </span>
            </div>

            {agencies.map((agency) => {
              const isHighlighted = hoveredAgencyId === agency.id || selectedPinId === agency.id;

              return (
                <div
                  key={agency.id}
                  onMouseEnter={() => onHoverAgency(agency.id)}
                  onMouseLeave={() => onHoverAgency(null)}
                  onClick={() => {
                    setSelectedPinId(agency.id);
                    onHoverAgency(agency.id);
                  }}
                  className={`p-4 transition-all duration-300 cursor-pointer flex flex-col gap-1.5 relative ${
                    isHighlighted
                      ? 'bg-red-50/75 border-l-4 border-l-[#D32323]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-sm text-[#333] group-hover:text-[#D32323]">
                      {agency.name}
                    </h4>
                    <span className="bg-gray-100 text-gray-600 font-extrabold text-[9px] px-2 py-0.5 rounded-md shrink-0">
                      {agency.distance} km
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#D32323] text-xs">
                    <span className="font-extrabold">{agency.rating.toFixed(1)} ★</span>
                    <span className="text-gray-400">({agency.reviewsCount} reseñas)</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500 font-bold">{agency.priceLevel}</span>
                  </div>

                  <p className="text-[11px] text-gray-400 font-medium truncate">{agency.location}</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAgency(agency);
                    }}
                    className="mt-1 text-left text-[11px] font-black text-[#D32323] hover:underline flex items-center gap-0.5"
                  >
                    <span>Detalles del contacto</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-[#f5f5f5] h-full relative overflow-hidden select-none">
            {showClusters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 left-4 z-[400] bg-blue-600 text-white font-black text-[10px] px-3 py-1.5 rounded-full shadow-md flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5" />
                <span>MULTIPLE-MARKERS DETECTADOS (CLUSTER)</span>
              </motion.div>
            )}

            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 border border-gray-200 px-3 py-2 rounded-xl shadow-md flex items-center gap-2 text-xs">
              <Info className="w-4 h-4 text-[#D32323]" />
              <div>
                <span className="font-black text-gray-700 block text-[10px]">COBERTURA LOCAL</span>
                <span className="text-gray-500 block font-medium">Mapa real · OpenStreetMap</span>
              </div>
            </div>

            <MapContainer
              center={fallbackCenter}
              zoom={6}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
              whenReady={() => setMapReady(true)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <BoundsFitter agencies={agenciesWithCoords} />
              {agenciesWithCoords.map((agency) => {
                const isSelected = selectedPinId === agency.id;
                const isHovered = hoveredAgencyId === agency.id;
                const active = isSelected || isHovered;

                return (
                  <Marker
                    key={agency.id}
                    position={[agency.lat, agency.lng]}
                    icon={createCustomIcon(agency, active)}
                    eventHandlers={{
                      click: () => setSelectedPinId(agency.id),
                      mouseover: () => onHoverAgency(agency.id),
                      mouseout: () => onHoverAgency(null),
                    }}
                  >
                    <Popup>
                      <div className="text-left space-y-1 min-w-[180px]">
                        <h5 className="font-extrabold text-xs text-[#333] tracking-tight truncate">
                          {agency.name}
                        </h5>
                        <div className="flex items-center gap-1 text-[10px] text-[#D32323]">
                          <span>{agency.rating}★</span>
                          <span className="text-gray-400">({agency.reviewsCount})</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 block truncate">
                          {agency.location}
                        </span>
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-black text-[#D32323]">
                            ${agency.startingPrice}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAgency(agency);
                            }}
                            className="text-[9px] bg-[#D32323] text-white px-2 py-1 rounded font-bold hover:bg-[#b01c1c] transition-all cursor-pointer"
                          >
                            Ir
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {!mapReady && (
              <div className="absolute inset-0 z-[300] bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <MapPin className="w-8 h-8 text-[#D32323] animate-bounce" />
                  <span className="text-xs font-bold">Cargando mapa real...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
