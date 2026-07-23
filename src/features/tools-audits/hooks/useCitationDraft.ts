import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/apiConfig';
import type { CitationDraft } from '../types/citations';
import { createEmptyCitationDraft, loadCitationDraft, saveCitationDraft as saveLocalCitationDraft } from '../services/citationStorage';
import { fetchCitationDraft, saveCitationDraft as saveRemoteCitationDraft } from '../services/clientCitationsApi';

export interface UseCitationDraftReturn {
  draft: CitationDraft | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setDraft: (draft: CitationDraft) => void;
  saveDraft: () => Promise<void>;
  retry: () => void;
}

export function useCitationDraft(): UseCitationDraftReturn {
  const [draft, setDraftState] = useState<CitationDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchCitationDraft(signal);
      setDraftState(remote);
      saveLocalCitationDraft(remote);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        const local = loadCitationDraft();
        setDraftState(local);
      } else {
        const message =
          error instanceof ApiError
            ? error.code === 'unauthorized' || error.code === 'forbidden'
              ? 'Sesión inválida. Vuelve a iniciar sesión.'
              : error.code === 'network' || error.code === 'timeout'
                ? 'No se pudo conectar con el servidor.'
                : error.message
            : error instanceof Error
              ? error.message
              : 'Error al cargar el borrador';
        setError(message);
        setDraftState(createEmptyCitationDraft());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Carga inicial del borrador; migrar a React Query queda fuera del alcance. */
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setDraft = useCallback((nextDraft: CitationDraft) => {
    setDraftState(nextDraft);
    saveLocalCitationDraft(nextDraft);
  }, []);

  const saveDraft = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await saveRemoteCitationDraft(draft);
      saveLocalCitationDraft(draft);
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.code === 'unauthorized' || error.code === 'forbidden'
            ? 'Sesión inválida. Vuelve a iniciar sesión.'
            : error.message
          : 'Error al guardar el borrador';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const retry = useCallback(() => {
    const controller = new AbortController();
    load(controller.signal);
  }, [load]);

  return { draft, loading, saving, error, setDraft, saveDraft, retry };
}
