import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, LogOut, ShieldCheck, UserRoundCheck } from 'lucide-react';
import DashboardPage from '@/pages/DashboardPage';
import { useAppState } from '@/state/useAppState';

function panelLabel(role: string) {
  if (role === 'client') return 'Herramientas · Command Center 360';
  if (role === 'utilidades') return 'Centro de Control Utilidades';
  return 'Dashboard Enterprise';
}

/**
 * Puerta única de acceso a los tres paneles SEOLOCAL.
 *
 * Regla v5.38.4:
 * - V5384_DASHBOARD_GATE: entrar a /dashboard NUNCA redirige automáticamente por una sesión previa;
 * - si existe una sesión, se muestra de forma explícita y el usuario decide
 *   continuar con ella o cambiar de cuenta;
 * - después de un login válido se usa ?continue=1 para entrar al panel
 *   correspondiente al rol autenticado.
 */
export default function DashboardGatewayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, authLoading, logout } = useAppState();
  const [switchingUser, setSwitchingUser] = useState(false);
  const continueRequested = searchParams.get('continue') === '1';

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-12 h-12 rounded-full border-4 border-[#D32323]/20 border-t-[#D32323] animate-spin" />
      </div>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent('/dashboard?continue=1');
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (continueRequested) {
    if (user.role === 'client') {
      return <Navigate to="/herramientas/auditorias?tab=summary" replace />;
    }

    if (user.role === 'utilidades') {
      return <Navigate to="/utilidades" replace />;
    }

    return <DashboardPage />;
  }

  const handleSwitchUser = async () => {
    if (switchingUser) return;
    setSwitchingUser(true);
    try {
      await logout();
    } finally {
      navigate('/login?returnTo=%2Fdashboard%3Fcontinue%3D1', { replace: true });
    }
  };

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[#f5f5f5] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D32323] text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D32323]">Acceso único SEOLOCAL</p>
              <h1 className="mt-1 text-2xl font-black text-[#333] sm:text-3xl">Selecciona cómo entrar al Dashboard</h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                No se abrirá ningún panel automáticamente por una sesión anterior. Confirma la sesión actual o cambia de usuario para entrar al panel que corresponda.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#D32323] shadow-sm ring-1 ring-gray-200">
                  <UserRoundCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Sesión detectada</p>
                  <p className="truncate text-sm font-black text-[#333]">{user.name || user.email}</p>
                  <p className="truncate text-xs font-semibold text-gray-500">{user.email}</p>
                  <p className="mt-1 text-xs font-black text-[#D32323]">{panelLabel(user.role)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:min-w-52">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard?continue=1', { replace: true })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D32323] px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#b01c1c]"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  disabled={switchingUser}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-wide text-[#333] transition hover:border-[#D32323] hover:text-[#D32323] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {switchingUser ? 'Cerrando sesión…' : 'Cambiar usuario'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-black text-[#333]">Herramientas</p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">Cliente → Command Center 360.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-black text-[#333]">Utilidades</p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">Usuario Utilidades → Centro de Control.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-black text-[#333]">Enterprise</p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">Superadmin y roles internos → Dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
