import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Globe2,
  Layers3,
  LayoutTemplate,
  MapPin,
  MessageCircle,
  MousePointerClick,
  PackageCheck,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Target,
  TrendingUp,
  UsersRound,
  Zap,
} from 'lucide-react';
import type { Service } from '@/types';
import { getServiceRoute } from '@/utils/serviceRoutes';

// FICHA_24_FUR_S_CT_004_V5_37_53_CUSTOM_PAGE_MARKER

type Props = {
  service: Service;
  relatedServices: Service[];
  onAddToCart: (service: Service) => void;
  onBackToServices: () => void;
};

type Channel = 'Google Ads local' | 'Google Maps' | 'Meta Ads' | 'SEO orgánico';

const modules = [
  ['01', 'Conversion Brief Local', 'Objetivo, oferta, audiencia, ciudad, servicio y acción principal que debe producir la landing.', Target],
  ['02', 'Intención y audiencia', 'Mapa de intención local y fricciones del usuario antes de llamar, reservar o solicitar presupuesto.', UsersRound],
  ['03', 'Arquitectura de oferta', 'Propuesta de valor, diferenciadores, objeciones, garantía y estructura de precio o llamada a cotizar.', Layers3],
  ['04', 'Hero de conversión', 'Mensaje principal, beneficio, prueba rápida y CTA visibles desde el primer scroll.', LayoutTemplate],
  ['05', 'Prueba y confianza', 'Reseñas, casos, badges, garantías, cobertura y señales que reducen el riesgo percibido.', ShieldCheck],
  ['06', 'Sistema de CTA', 'Botones, formularios, llamadas, WhatsApp y microconversiones según dispositivo y canal.', MousePointerClick],
  ['07', 'Experiencia móvil', 'Jerarquía, velocidad, formularios breves y navegación pensada para tráfico móvil local.', Smartphone],
  ['08', 'Contenido geolocalizado', 'Copy de servicio + ciudad, cobertura, preguntas locales y señales de relevancia territorial.', MapPin],
  ['09', 'Analítica y eventos', 'GA4/GTM, clics, formularios, llamadas y eventos clave preparados para medir conversión.', BarChart3],
  ['10', 'SEO técnico y schema', 'Title, meta, canonical, LocalBusiness/Service schema e indexabilidad de la landing.', Search],
  ['11', 'QA de lanzamiento', 'Validación de enlaces, formularios, responsive, tracking, velocidad y consistencia del contenido.', BadgeCheck],
  ['12', 'Optimización inicial', 'Lectura de señales tempranas y recomendaciones para mejorar conversión después del lanzamiento.', TrendingUp],
] as const;

const benefits = [
  ['Más conversiones locales', 'La página se diseña alrededor de una sola intención y una sola acción principal.', MousePointerClick],
  ['Mejor calidad de lead', 'La oferta y el contenido filtran mejor al usuario antes de que contacte al negocio.', Target],
  ['Menor fricción móvil', 'La estructura prioriza velocidad, lectura rápida y CTAs accesibles en teléfono.', Smartphone],
  ['Medición accionable', 'Cada conversión importante queda preparada para ser medida y optimizada.', BarChart3],
] as const;

const phases: Record<string, string[]> = {
  'Fase 1 · Brief': ['Objetivo de campaña y oferta', 'Ciudad/área objetivo', 'Conversión primaria y secundaria'],
  'Fase 2 · UX + Copy': ['Wireframe de conversión', 'Redacción geolocalizada', 'Pruebas de confianza y CTA'],
  'Fase 3 · Build': ['Maquetación responsive', 'SEO técnico + schema', 'Integración de formularios y eventos'],
  'Fase 4 · QA': ['Pruebas móvil/escritorio', 'Validación de tracking', 'Checklist técnico y de contenido'],
  'Fase 5 · Launch': ['Publicación', 'Validación post-lanzamiento', 'Recomendaciones de optimización inicial'],
};

const channelModifier: Record<Channel, { conversion: number; quality: number; cpa: number; note: string }> = {
  'Google Ads local': { conversion: 1.1, quality: 4, cpa: 8, note: 'Tráfico de intención alta; exige coherencia estricta entre anuncio, keyword y landing.' },
  'Google Maps': { conversion: 0.8, quality: 6, cpa: -4, note: 'El usuario ya tiene intención local; la confianza, proximidad y acción rápida pesan más.' },
  'Meta Ads': { conversion: -0.2, quality: -2, cpa: 12, note: 'Tráfico más frío; la oferta, prueba social y claridad visual son críticas.' },
  'SEO orgánico': { conversion: 0.4, quality: 3, cpa: -12, note: 'La relevancia temática y local puede producir leads sostenibles con menor costo incremental.' },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function LandingPageLocalServicePage({ service, relatedServices, onAddToCart, onBackToServices }: Props) {
  const [channel, setChannel] = useState<Channel>('Google Ads local');
  const [traffic, setTraffic] = useState(1200);
  const [offerStrength, setOfferStrength] = useState(72);
  const [speed, setSpeed] = useState(78);
  const [trust, setTrust] = useState(68);
  const [mobileUx, setMobileUx] = useState(82);
  const [activePhase, setActivePhase] = useState('Fase 1 · Brief');

  const model = useMemo(() => {
    const modifier = channelModifier[channel];
    const conversionScore = Math.round(
      offerStrength * 0.28 + speed * 0.17 + trust * 0.24 + mobileUx * 0.23 + 8,
    );
    const score = clamp(conversionScore, 0, 100);
    const conversionRate = clamp(1.15 + score * 0.055 + modifier.conversion, 1.2, 9.8);
    const leads = Math.max(1, Math.round(traffic * (conversionRate / 100)));
    const qualifiedRate = clamp(36 + score * 0.42 + modifier.quality, 35, 86);
    const qualifiedLeads = Math.max(1, Math.round(leads * (qualifiedRate / 100)));
    const lift = clamp(Math.round((score - 44) * 1.28), 0, 72);
    const cpaIndex = clamp(Math.round(132 - score * 0.72 + modifier.cpa), 42, 135);
    const diagnosis = score >= 84
      ? 'Landing con base sólida para escalar inversión y probar variaciones de oferta/CTA.'
      : score >= 70
        ? 'Buen potencial de conversión; conviene reforzar la señal más débil antes de aumentar tráfico.'
        : score >= 55
          ? 'La página puede captar leads, pero todavía pierde oportunidades por fricción o confianza.'
          : 'Prioridad alta: corregir oferta, velocidad, confianza y experiencia móvil antes de comprar más tráfico.';
    return { score, conversionRate, leads, qualifiedRate, qualifiedLeads, lift, cpaIndex, diagnosis, channelNote: modifier.note };
  }, [channel, traffic, offerStrength, speed, trust, mobileUx]);

  const billing = service.billingPeriod === 'mes' ? '/mes' : service.billingPeriod === 'trimestre' ? '/trimestre' : 'pago único';
  const curatedRelated = relatedServices.filter((item) => item.code !== service.code).slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-[#333333]">
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={onBackToServices} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 transition hover:text-[#D32323]">
            <ArrowLeft className="h-4 w-4" /> Volver a servicios
          </button>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-gray-200 bg-[#f5f5f5]">
        <div className="absolute right-[-120px] top-[-140px] h-96 w-96 rounded-full border-[60px] border-white/70" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#D32323] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">FUR 24 · {service.code}</span>
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Contenido Local</span>
            </div>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.28em] text-[#D32323]">Landing de campaña + conversión local</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.94] tracking-[-0.06em] text-[#171717] sm:text-6xl">
              LANDING PAGE <span className="text-[#D32323]">LOCAL</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base font-medium leading-7 text-gray-600">
              Diseño, redacción y preparación técnica de una landing enfocada en convertir tráfico local en llamadas, formularios, WhatsApp, reservas o solicitudes de presupuesto.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['Oferta + UX + Copy', 'SEO local + schema', 'Tracking de conversiones', 'Mobile-first'].map((tag) => (
                <span key={tag} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 shadow-sm">{tag}</span>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <button type="button" onClick={() => onAddToCart(service)} className="inline-flex items-center gap-2 rounded-sm bg-[#D32323] px-6 py-4 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-red-900/15 transition hover:bg-[#b81f1f] active:scale-95">
                Agregar al carrito <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#landing-lab" className="inline-flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-6 py-4 text-xs font-black uppercase tracking-wider text-[#333] transition hover:border-[#D32323] hover:text-[#D32323]">
                Abrir Local Landing Lab <Gauge className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative z-10 rounded-sm border border-gray-200 bg-white p-7 shadow-2xl shadow-gray-900/10">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-5">
              <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Plan base</p><h2 className="mt-2 text-2xl font-black text-[#171717]">Landing Conversion Build</h2></div>
              <Rocket className="h-8 w-8 text-[#D32323]" />
            </div>
            <div className="mt-6 flex items-end justify-between gap-5"><div><p className="text-4xl font-black text-[#8b0010]">US${service.price}</p><p className="mt-1 text-xs font-bold text-gray-400">{billing}</p></div><span className="rounded-full bg-green-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-green-700">Entrega {service.deliveryDays || 10} días</span></div>
            <div className="mt-7 space-y-3">
              {['Arquitectura de conversión', 'Copy geolocalizado', 'Diseño responsive', 'SEO técnico y schema', 'Tracking de eventos', 'QA + publicación'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-gray-600"><CheckCircle2 className="h-4 w-4 text-[#D32323]" /> {item}</div>
              ))}
            </div>
            <button type="button" onClick={() => onAddToCart(service)} className="mt-7 w-full rounded-sm bg-[#171717] px-5 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#D32323] active:scale-95">Contratar landing local</button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-4">
            {([
              ['Objetivo', '1 conversión principal', Target],
              ['Estructura', '12 módulos operativos', Layers3],
              ['Implementación', `${service.deliveryDays || 10} días`, CalendarDays],
              ['Medición', 'Eventos + KPIs', BarChart3],
            ] as Array<[string, string, LucideIcon]>).map(([label, value, Icon]) => (
              <div key={String(label)} className="rounded-sm border border-gray-200 bg-[#fbfbfb] p-6 shadow-sm">
                <Icon className="h-6 w-6 text-[#D32323]" />
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">{label}</p>
                <p className="mt-2 text-lg font-black text-[#171717]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-[#f5f5f5] py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.24em] text-[#D32323]">Alcance funcional</p><h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] text-[#171717]">12 módulos para una landing lista para vender</h2><p className="mt-4 text-sm font-medium leading-7 text-gray-500">La ficha deja de ser una landing genérica: organiza estrategia, producción, publicación y medición como un servicio operativo.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map(([number, title, text, Icon]) => (
              <div key={number} className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between"><span className="text-xs font-black tracking-[0.2em] text-gray-400">{number}</span><span className="flex h-10 w-10 items-center justify-center bg-red-50 text-[#D32323]"><Icon className="h-5 w-5" /></span></div>
                <h3 className="mt-5 text-lg font-black text-[#171717]">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="landing-lab" className="bg-white py-18">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D32323]">Local Landing Lab</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] text-[#171717]">Landing Conversion Builder</h2>
            <p className="mt-5 text-sm font-medium leading-7 text-gray-500">Simula cómo cambian la conversión y la calidad de los leads según el canal, el tráfico y la preparación de la landing. Los resultados son estimaciones operativas, no garantías comerciales.</p>
            <div className="mt-7 rounded-sm border border-gray-200 bg-[#f5f5f5] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Canal de adquisición</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(Object.keys(channelModifier) as Channel[]).map((item) => (
                  <button key={item} type="button" onClick={() => setChannel(item)} className={`rounded-sm border px-4 py-3 text-left text-xs font-black transition ${channel === item ? 'border-[#D32323] bg-[#D32323] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#D32323]'}`}>{item}</button>
                ))}
              </div>
              <p className="mt-4 text-xs font-medium leading-5 text-gray-500">{model.channelNote}</p>
            </div>
            <div className="mt-6 space-y-5">
              {[
                { label: 'Tráfico mensual estimado', value: traffic, min: 100, max: 10000, step: 100, setter: setTraffic, suffix: ' visitas' },
                { label: 'Fuerza de la oferta', value: offerStrength, min: 10, max: 100, step: 1, setter: setOfferStrength, suffix: '/100' },
                { label: 'Velocidad y estabilidad', value: speed, min: 10, max: 100, step: 1, setter: setSpeed, suffix: '/100' },
                { label: 'Señales de confianza', value: trust, min: 10, max: 100, step: 1, setter: setTrust, suffix: '/100' },
                { label: 'Experiencia móvil', value: mobileUx, min: 10, max: 100, step: 1, setter: setMobileUx, suffix: '/100' },
              ].map((row) => (
                <label key={row.label} className="block rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
                  <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-gray-500"><span>{row.label}</span><span className="text-[#D32323]">{row.value}{row.suffix}</span></span>
                  <input type="range" className="mt-4 w-full accent-[#D32323]" min={row.min} max={row.max} step={row.step} value={row.value} onChange={(event) => row.setter(Number(event.target.value))} />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-gray-200 bg-[#171717] p-7 text-white shadow-2xl shadow-gray-900/15">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.26em] text-gray-400">Modelo de conversión</p><h3 className="mt-2 text-3xl font-black">Diagnóstico proyectado</h3></div><Zap className="h-8 w-8 text-[#D32323]" /></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ['Conversion score', `${model.score}/100`],
                ['Visitas', traffic.toLocaleString('es-ES')],
                ['Leads', model.leads.toString()],
                ['Leads calificados', model.qualifiedLeads.toString()],
                ['Tasa conversión', `${model.conversionRate.toFixed(1)}%`],
                ['Lift proyectado', `+${model.lift}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-sm border border-white/10 bg-white/5 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm bg-[#D32323] p-5"><p className="text-[10px] font-black uppercase tracking-wider text-red-100">Índice CPA relativo</p><p className="mt-2 text-3xl font-black">{model.cpaIndex}</p><p className="mt-1 text-xs font-medium text-red-100">100 = referencia. Menor es mejor.</p></div>
              <div className="rounded-sm border border-white/10 bg-white/5 p-5"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Calidad estimada</p><p className="mt-2 text-3xl font-black">{Math.round(model.qualifiedRate)}%</p><p className="mt-1 text-xs font-medium text-gray-400">Proporción estimada de leads calificados.</p></div>
            </div>
            <div className="mt-5 rounded-sm border border-white/10 bg-white/5 p-5"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Diagnóstico automático</p><p className="mt-3 text-sm font-bold leading-6 text-gray-200">{model.diagnosis}</p></div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-[#f5f5f5] py-18">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D32323]">Requisitos y KPIs</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] text-[#171717]">Lo que necesitamos y lo que medimos</h2>
            <div className="mt-8 space-y-3">
              {['Servicio y ciudad/área objetivo', 'Oferta, precio o mecanismo de cotización', 'Logo, identidad y activos visuales', 'Reseñas, casos o pruebas de confianza disponibles', 'Acceso al CMS/hosting o entorno de publicación', 'Acceso a GA4/GTM si se requiere tracking'].map((item) => <div key={item} className="flex items-start gap-3 rounded-sm border border-gray-200 bg-white p-4 text-sm font-bold text-gray-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D32323]" />{item}</div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Tasa de conversión', 'Leads / sesiones', 'Controla si la landing transforma tráfico en acciones.'],
              ['Leads calificados', 'Calidad comercial', 'Separa volumen de contactos de oportunidades reales.'],
              ['CTR de CTA', 'Interacción', 'Mide qué tan efectiva es la propuesta y la jerarquía de botones.'],
              ['Velocidad móvil', 'CWV', 'Reduce abandono y protege la experiencia de campañas móviles.'],
              ['Costo por lead', 'CPA/CPL', 'Conecta la página con la eficiencia del presupuesto de adquisición.'],
              ['Conversión por canal', 'Ads · Maps · SEO', 'Permite decidir dónde escalar inversión y qué mensaje ajustar.'],
            ].map(([title, value, note]) => <div key={title} className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</p><p className="mt-2 text-xl font-black text-[#8b0010]">{value}</p><p className="mt-3 text-sm font-medium leading-6 text-gray-500">{note}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D32323]">Beneficios</p>
              <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] text-[#171717]">Diseñada para convertir, no solo para verse bien</h2>
              <div className="mt-8 space-y-4">{benefits.map(([title, text, Icon]) => <div key={title} className="flex gap-4 rounded-sm border border-gray-200 bg-[#fbfbfb] p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-50 text-[#D32323]"><Icon className="h-5 w-5" /></span><div><h3 className="font-black text-[#171717]">{title}</h3><p className="mt-1 text-sm font-medium leading-6 text-gray-500">{text}</p></div></div>)}</div>
            </div>
            <div className="rounded-sm border border-gray-200 bg-[#f5f5f5] p-7 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Plan operativo por fases</p>
              <div className="mt-5 flex flex-wrap gap-2">{Object.keys(phases).map((phase) => <button key={phase} type="button" onClick={() => setActivePhase(phase)} className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${activePhase === phase ? 'border-[#D32323] bg-[#D32323] text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-[#D32323]'}`}>{phase}</button>)}</div>
              <h3 className="mt-7 text-2xl font-black text-[#171717]">{activePhase}</h3>
              <div className="mt-5 grid gap-3">{phases[activePhase].map((item) => <div key={item} className="flex items-center gap-3 rounded-sm border border-gray-200 bg-white p-4"><PackageCheck className="h-5 w-5 text-[#8b0010]" /><p className="text-sm font-black text-gray-600">{item}</p></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-[#fbfbfb] py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">Herramientas y canales</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">{['GA4', 'GTM', 'Search Console', 'PageSpeed', 'WordPress', 'Google Ads', 'Google Maps', 'Meta Ads', 'Schema.org', 'Hotjar / Clarity'].map((tool) => <span key={tool} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-500 shadow-sm">{tool}</span>)}</div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center bg-red-50 text-[#D32323]"><Rocket className="h-7 w-7" /></div>
          <h2 className="mt-6 text-4xl font-black uppercase tracking-[-0.05em] text-[#171717]">Convierte tráfico local en oportunidades reales</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-gray-500">Lanza una página enfocada en una oferta, una zona y una conversión medible.</p>
          <button type="button" onClick={() => onAddToCart(service)} className="mt-8 rounded-sm bg-[#8b0010] px-8 py-4 text-xs font-black uppercase text-white shadow-xl shadow-red-900/15 transition hover:bg-[#D32323] active:scale-95">Solicitar Landing Page Local</button>
        </div>
      </section>

      {curatedRelated.length > 0 && (
        <section className="bg-[#fbfbfb] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.24em] text-[#D32323]">Servicios relacionados</p><h2 className="mt-2 text-3xl font-black text-[#171717]">Complementa la landing y su adquisición</h2></div>
            <div className="grid gap-5 md:grid-cols-3">{curatedRelated.map((item) => <a key={item.id} href={getServiceRoute(item)} className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><p className="text-xs font-black uppercase tracking-wider text-gray-400">{item.code}</p><h3 className="mt-3 text-lg font-black text-[#171717]">{item.title}</h3><p className="mt-3 line-clamp-3 text-sm font-medium leading-relaxed text-gray-500">{item.description}</p><div className="mt-5 flex items-center justify-between gap-3"><span className="text-xl font-black text-[#D32323]">US${item.price}</span><span className="inline-flex items-center gap-2 text-sm font-black text-[#333]">Ver ficha <ArrowRight className="h-4 w-4" /></span></div></a>)}</div>
          </div>
        </section>
      )}

      <section className="border-t border-gray-200 bg-[#171717] py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#D32323]" /><span className="text-xs font-black uppercase tracking-wider">Entrega base: {service.deliveryDays || 10} días</span></div><div className="flex items-center gap-3"><Globe2 className="h-5 w-5 text-[#D32323]" /><span className="text-xs font-black uppercase tracking-wider">Google Ads · Maps · Meta · SEO</span></div><div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-[#D32323]" /><span className="text-xs font-black uppercase tracking-wider">CTA medible</span></div></div>
      </section>
    </div>
  );
}
