import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Cable,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileClock,
  FileSearch,
  FolderKanban,
  Gauge,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Palette,
  ShieldCheck,
  Star,
  Store,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAppState } from '@/state/useAppState';
import './utilidades-v15.css';

type NavItem = {
  path: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  superadminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { path: '', label: 'Resumen', icon: Gauge },
      { path: 'ubicaciones', label: 'Ubicaciones', icon: MapPin },
      { path: 'clientes', label: 'Clientes', icon: Users },
      { path: 'agencias', label: 'Agencias', icon: Building2 },
    ],
  },
  {
    label: 'Operación',
    items: [
      { path: 'alertas', label: 'Alertas', icon: AlertTriangle },
      { path: 'casos', label: 'Casos', icon: FolderKanban },
      { path: 'operaciones', label: 'Centro de Operaciones', icon: ClipboardCheck },
      { path: 'acciones', label: 'Acciones', icon: Wrench },
      { path: 'ordenes-trabajo', label: 'Órdenes de Trabajo', icon: BriefcaseBusiness },
    ],
  },
  {
    label: 'Crecimiento local',
    items: [
      { path: 'campanas-resenas', label: 'Campañas de Reseñas', icon: Star },
      { path: 'campanas-citaciones', label: 'Campañas de Citaciones', icon: FileSearch },
      { path: 'publicaciones-gbp', label: 'Publicaciones GBP', icon: Megaphone },
      { path: 'integraciones', label: 'Integraciones', icon: Cable },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { path: 'mercado', label: 'Mercado de Servicios', icon: BarChart3 },
      { path: 'prospectos', label: 'Prospectos', icon: Users },
    ],
  },
  {
    label: 'Administración',
    items: [
      { path: 'marca-blanca', label: 'Marca Blanca', icon: Palette },
      { path: 'auditoria', label: 'Auditoría', icon: FileClock },
      { path: 'alcances', label: 'Alcances y permisos', icon: ShieldCheck, superadminOnly: true },
    ],
  },
];

const routeLabels = new Map(
  navGroups.flatMap((group) => group.items.map((item) => [item.path, item.label] as const)),
);

export default function UtilidadesLayout() {
  const { user, logout } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLocationWorkspace = /^\/utilidades\/ubicaciones\/\d+(?:\/|$)/.test(location.pathname);

  const currentLabel = useMemo(() => {
    const relative = location.pathname.replace(/^\/utilidades\/?/, '');
    if (!relative) return 'Resumen';
    if (relative.startsWith('ubicaciones/')) return 'Expediente de ubicación';
    const firstSegment = relative.split('/')[0];
    return routeLabels.get(firstSegment) ?? 'Centro de Control';
  }, [location.pathname]);


  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  async function exit() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className={`util-v15 ${isLocationWorkspace ? 'util-focus-workspace' : ''}`}>
      <header className="util-top">
        <button
          type="button"
          className="util-mobile-menu"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir navegación"
          aria-expanded={menuOpen}
        >
          <Menu size={19} />
        </button>

        <button type="button" className="util-brand" onClick={() => navigate('/utilidades')} aria-label="Ir al resumen de Utilidades">
          <span className="util-brand-mark">Y</span>
          <span className="util-brand-copy">
            <strong>SEO<span>LOCAL</span></strong>
            <small>Centro de Control</small>
          </span>
        </button>

        {isLocationWorkspace ? (
          <button
            type="button"
            className="util-focus-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu general de Utilidades"
            aria-expanded={menuOpen}
          >
            <Menu size={16} />
            <span>Panel Utilidades</span>
          </button>
        ) : null}

        <div className="util-breadcrumb" aria-label="Ruta actual">
          <Activity size={14} />
          <span>Utilidades</span>
          <ChevronRight size={13} />
          <strong>{currentLabel}</strong>
        </div>

        <div className="util-top-actions">
          <div className="util-session" title={user?.email || ''}>
            <span className="util-session-dot" />
            <div>
              <strong>{user?.name || user?.email || 'Usuario Utilidades'}</strong>
              <small>{user?.roleCode === 'superadmin' ? 'Superadministrador' : 'Operación activa'}</small>
            </div>
          </div>
          <button className="util-btn subtle" onClick={() => navigate('/')}>
            <Store size={15} />
            Marketplace
          </button>
          <button className="util-btn red" onClick={() => void exit()} disabled={signingOut}>
            <LogOut size={15} />
            {signingOut ? 'Saliendo…' : 'Salir'}
          </button>
        </div>
      </header>

      <div className="util-shell">
        <aside className={`util-side ${menuOpen ? 'open' : ''}`} aria-label="Panel de Utilidades">
          <div className="util-side-mobile-head">
            <strong>Navegación</strong>
            <button type="button" className="util-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar navegación">
              <X size={18} />
            </button>
          </div>

          <div className="util-side-summary">
            <div className="util-side-summary-icon"><Database size={17} /></div>
            <div>
              <strong>Panel Utilidades</strong>
              <span>Operación conectada a PostgreSQL</span>
            </div>
          </div>

          <nav aria-label="Navegación de Utilidades">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((item) => !item.superadminOnly || user?.roleCode === 'superadmin');
              if (!visibleItems.length) return null;
              return (
                <div className="util-nav-group" key={group.label}>
                  <span className="util-nav-label">{group.label}</span>
                  {visibleItems.map(({ path, label, icon: Icon }) => (
                    <NavLink key={path} end={path === ''} to={path} onClick={() => setMenuOpen(false)}>
                      <Icon size={17} />
                      <span>{label}</span>
                      <ChevronRight className="util-nav-chevron" size={14} />
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="util-side-footer">
            <div className="util-side-footer-icon"><ShieldCheck size={16} /></div>
            <div>
              <strong>Acceso protegido</strong>
              <span>Roles, permisos y auditoría activos</span>
            </div>
          </div>
        </aside>

        {menuOpen ? (
          <button
            type="button"
            className="util-side-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar navegación"
          />
        ) : null}

        <main className="util-main">
          <div className="util-canvas"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
