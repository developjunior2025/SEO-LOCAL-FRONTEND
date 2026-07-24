import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/apiConfig';
import type { ClientAuditData } from '../types/audit';
import { fetchClientAudit } from '../services/clientAuditApi';

export interface UseClientAuditReturn {
  data: ClientAuditData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useClientAudit(): UseClientAuditReturn {
  const [state, setState] = useState<{
    data: ClientAuditData | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchClientAudit(signal);
      setState({ data, loading: false, error: null });
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.code === 'unauthorized' || error.code === 'forbidden'
            ? 'Sesión inválida. Vuelve a iniciar sesión.'
            : error.code === 'network' || error.code === 'timeout'
              ? 'No se pudo conectar con el servidor.'
              : error.message
          : error instanceof Error
            ? error.message
            : 'Error al cargar la auditoría';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Carga inicial de auditoría; migrar a React Query queda fuera del alcance. */
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const retry = useCallback(() => {
    const controller = new AbortController();
    load(controller.signal);
  }, [load]);

  return { ...state, retry };
}
