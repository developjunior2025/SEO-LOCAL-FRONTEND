// V5385_CC360_ROUTE_ERROR_BOUNDARY
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate, useRouteError } from 'react-router-dom';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Se produjo un error inesperado al renderizar Command Center 360.';
}

export default function ClientAuditRouteErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();

  return (
    <section className="min-h-[60vh] bg-[#f7f7f7] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#D32323]">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-black text-[#333]">Command Center 360 necesita recargarse</h1>
        <p className="mt-2 text-sm text-gray-600">
          El panel protegió la sesión y evitó mostrar una pantalla técnica. Puedes reintentar o volver a la puerta Dashboard.
        </p>
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500" role="status">
          {getErrorMessage(error)}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D32323] px-4 py-2 text-xs font-black text-white hover:bg-[#b01c1c]"
          >
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-[#333] hover:bg-gray-50"
          >
            Volver a Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}
