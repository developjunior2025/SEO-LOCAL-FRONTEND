import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronDown,
  FileCheck2,
  LayoutDashboard,
  MapPinned,
  NotebookTabs,
  ShieldCheck,
  Star,
  Store,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';
import { useAppState } from '@/state/useAppState';
import { clientAuditDemoData as data } from '../data/clientAuditDemoData';
import AuditProjectHeader from './AuditProjectHeader';
import type { AuditTabKey } from '@/components/toolsDropdownConfig';
import { AUDIT_TAB_OPTIONS, buildAuditUrl } from '@/components/toolsDropdownConfig';

interface AuditShellProps {
  title: string;
  description: string;
  activeTab: AuditTabKey | 'citations';
  children: React.ReactNode;
}

const SHELL_TABS = [
  ...AUDIT_TAB_OPTIONS.map((opt) => ({ key: opt.key, label: opt.label, href: buildAuditUrl(opt.key) })),
  { key: 'citations' as const, label: 'Citaciones', href: '/herramientas/citaciones' },
];

const MODULE_META: Record<
  string,
  { description: string; icon: React.ElementType }
> = {
  summary: { description: 'Resumen general del proyecto.', icon: LayoutDashboard },
  proof: { description: 'Pruebas, acciones, impacto y trazabilidad.', icon: ShieldCheck },
  rankings: { description: 'Posición local, zonas y competidores.', icon: MapPinned },
  listings: { description: 'Presencia, integridad y fichas locales.', icon: Store },
  reviews: { description: 'Confianza, sentimiento y respuesta.', icon: Star },
  site: { description: 'Salud, rendimiento y autoridad.', icon: Wrench },
  ads: { description: 'Campañas, leads y retorno.', icon: TrendingUp },
  files: { description: 'Archivos, reportes y validación.', icon: FileCheck2 },
  citations: { description: 'Registro, copiado y seguimiento manual.', icon: NotebookTabs },
};

const MODULES = SHELL_TABS.map((tab) => ({
  ...tab,
  description: MODULE_META[tab.key]?.description ?? '',
  icon: MODULE_META[tab.key]?.icon ?? LayoutDashboard,
}));

export default function AuditShell({ title, description, activeTab, children }: AuditShellProps) {
  const navigate = useNavigate();
  const { user } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const activeIndex = Math.max(
    0,
    MODULES.findIndex((m) => m.key === activeTab)
  );
  const activeModule = MODULES[activeIndex];

  const navigateTo = (index: number) => {
    const tab = MODULES[index];
    if (tab) {
      navigate(tab.href);
      setMenuOpen(false);
    }
  };

  const goPrev = () => {
    const nextIndex = (activeIndex - 1 + MODULES.length) % MODULES.length;
    navigateTo(nextIndex);
  };

  const goNext = () => {
    const nextIndex = (activeIndex + 1) % MODULES.length;
    navigateTo(nextIndex);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [menuOpen]);

  const ActiveIcon = activeModule.icon;

  return (
    <div className="cc360 bg-[#f4f7fa] min-h-[calc(100vh-80px)]">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#333] tracking-tight mb-1">{title}</h1>
            <p className="text-xs text-gray-500 font-medium">{description}</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D32323] text-white text-xs font-black">
              <BarChart3 className="w-4 h-4" /> Panel cliente
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#213a53] to-[#dda079] text-white flex items-center justify-center text-xs font-black">
                {user?.name?.charAt(0) ?? <User className="w-3.5 h-3.5" />}
              </div>
              <div>
                <b className="block text-xs text-[#333]">{user?.name ?? 'Invitado'}</b>
                <small className="block text-[9px] text-gray-500">{user?.role === 'client' ? 'Cliente' : user?.role}</small>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        <AuditProjectHeader project={data.project} />

        <nav className="mt-5" aria-label="Navegación de módulos">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2.5 items-stretch">
            <div className="relative" ref={selectorRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="w-full min-h-[70px] bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-3 text-left shadow-md hover:border-[#BFC8D3] focus:outline-none focus-visible:border-[#BFC8D3] focus-visible:ring-2 focus-visible:ring-[#0074E0] transition-colors"
              >
                <span className="w-11 h-11 rounded-xl bg-red-50 text-[#D32323] grid place-items-center shrink-0">
                  <ActiveIcon className="w-5 h-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm text-[#333]">{activeModule.label}</strong>
                  <small className="block text-[10px] text-gray-500 truncate mt-0.5">
                    {activeModule.description}
                  </small>
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-200 ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Módulos del proyecto"
                  className="absolute z-20 left-0 right-0 top-[calc(100%+9px)] bg-white border border-gray-200 rounded-2xl p-2.5 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  {MODULES.map((module, index) => {
                    const Icon = module.icon;
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={module.key}
                        type="button"
                        role="menuitem"
                        onClick={() => navigateTo(index)}
                        className={`grid grid-cols-[34px_minmax(0,1fr)] gap-2.5 items-start text-left rounded-xl p-2.5 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0074E0] ${
                          isActive
                            ? 'bg-red-50 border-[#F0BBBB] text-[#D32323]'
                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-[34px] h-[34px] rounded-[10px] grid place-items-center shrink-0 ${
                            isActive ? 'bg-[#FFE2E2]' : 'bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <strong className="block text-[11px] font-black">{module.label}</strong>
                          <small className="block text-[9px] text-gray-500 leading-tight mt-0.5">
                            {module.description}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end md:justify-start">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Módulo anterior"
                title="Módulo anterior"
                className="w-[52px] h-[52px] md:h-auto border border-gray-200 bg-white rounded-2xl grid place-items-center shadow-md text-gray-600 hover:text-[#D32323] hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0074E0] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Módulo siguiente"
                title="Módulo siguiente"
                className="w-[52px] h-[52px] md:h-auto border border-gray-200 bg-white rounded-2xl grid place-items-center shadow-md text-gray-600 hover:text-[#D32323] hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0074E0] transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-center pt-2.5 px-1">
            <div className="grid grid-cols-9 gap-[5px]">
              {MODULES.map((module, index) => {
                const isDone = index < activeIndex;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={module.key}
                    type="button"
                    title={`Ir a ${module.label}`}
                    aria-label={`Ir a ${module.label}`}
                    onClick={() => navigateTo(index)}
                    className={`h-2 rounded-full border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0074E0] focus-visible:ring-offset-2 transition-colors ${
                      isActive
                        ? 'bg-[#D32323]'
                        : isDone
                          ? 'bg-[#CFEEDF]'
                          : 'bg-[#DDE4EA]'
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-[10px] text-gray-500 font-bold text-right md:text-left">
              Módulo{' '}
              <strong className="text-[#333]">
                {activeIndex + 1} de {MODULES.length}
              </strong>
            </div>
          </div>
        </nav>

        {children}
      </div>
    </div>
  );
}
