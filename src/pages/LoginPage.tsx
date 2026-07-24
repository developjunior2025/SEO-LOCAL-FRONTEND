import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = useMemo(() => searchParams.get('returnTo'), [searchParams]);

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
          <h1 className="font-black text-2xl text-[#333]">Estado del acceso</h1>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            El acceso autenticado para clientes todavía no está habilitado como producto real dentro del marketplace.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 text-[#D32323]" />
              <p>Las acciones públicas reales actualmente son enviar solicitudes comerciales y reseñas públicas.</p>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 mt-0.5 text-[#D32323]" />
              <p>El panel cliente y el Command Center 360 autenticado siguen fuera de alcance hasta tener backend público real.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-[#D32323]" />
              <p>Si eres operador interno, usa el dashboard administrativo autenticado.</p>
            </div>
          </div>

          {returnTo && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-900">
              La ruta <code>{returnTo}</code> requiere una experiencia cliente que aún no está habilitada en backend.
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#333] hover:bg-black text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Ir al dashboard admin
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-[10px] text-amber-900 leading-relaxed">
          <p className="font-bold mb-1">Estado actual del acceso</p>
          <p>Este acceso ya no simula credenciales de cliente. El ingreso real disponible hoy es el del dashboard administrativo.</p>
        </div>
      </div>
    </section>
  );
}
