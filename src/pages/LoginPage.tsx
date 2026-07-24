import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, User } from 'lucide-react';
import { useAppState } from '@/state/useAppState';
import { redirectAfterLogin } from '@/components/toolsDropdownConfig';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, authLoading, authError, login, clearAuthError } = useAppState();
  const returnTo = useMemo(() => searchParams.get('returnTo'), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirectAfterLogin(user.role, returnTo));
    }
  }, [user, authLoading, returnTo, navigate]);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  const loading = authLoading || submitting;

  return (
    <section className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#f5f5f5] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-xs font-black uppercase text-gray-500 hover:text-[#D32323] flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-[#D32323] text-white rounded-2xl flex items-center justify-center mx-auto font-black text-xl shadow-md">
            Y
          </div>
          <h1 className="font-black text-2xl text-[#333]">Accede a tu cuenta</h1>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Ingresa con tu cuenta administrativa para gestionar el marketplace desde el dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Email Corporativo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full bg-white border border-gray-200 py-3 pl-10 pr-4 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#D32323]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 py-3 pl-10 pr-4 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#D32323]"
              />
            </div>
          </div>

          {authError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-[#D32323]">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D32323] hover:bg-[#b01c1c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Verificando…' : 'Iniciar sesión'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#333] hover:bg-black text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Ir al dashboard admin
          </button>
        </form>

        {import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true' && (
          <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4 text-[10px] text-gray-500 leading-relaxed">
            <p className="font-bold text-gray-700 mb-1">Modo demostración activo</p>
            <p>Usa los usuarios de prueba configurados en tu entorno de desarrollo. Las credenciales reales no se muestran por seguridad.</p>
          </div>
        )}
      </div>
    </section>
  );
}
