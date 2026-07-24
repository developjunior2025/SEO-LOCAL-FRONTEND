import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/apiConfig';
import type { CitationDraft } from '../types/citations';
import {
  createEmptyCitationDraft,
  loadCitationDraft,
  saveCitationDraft as saveLocalCitationDraft,
} from '../services/citationStorage';
import {
  fetchCitationDraft,
  saveCitationDraft as saveRemoteCitationDraft,
} from '../services/clientCitationsApi';

function isMasterRecordComplete(draft: CitationDraft): boolean {
  const required = [
    draft.profile.firstName,
    draft.profile.lastName,
    draft.profile.accountEmail,
    draft.profile.username,
    draft.profile.password,
    draft.business.businessName,
    draft.business.address1,
    draft.business.phone,
    draft.business.publicEmail,
    draft.business.website,
    draft.listing.listingTitle,
    draft.listing.description,
  ];
  return required.every(Boolean);
}

export interface UseCitationDraftReturn {
  draft: CitationDraft | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setDraft: (draft: CitationDraft) => void;
  saveDraft: (nextDraft?: CitationDraft) => Promise<boolean>;
  retry: () => void;
}

export function useCitationDraft(): UseCitationDraftReturn {
  const [draft, setDraftState] = useState<CitationDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const handleRemoteError = useCallback((error: unknown, fallbackMessage: string): string => {
    if (error instanceof ApiError) {
      if (error.code === 'unauthorized' || error.code === 'forbidden') {
        return 'Sesión inválida. Vuelve a iniciar sesión.';
      }
      if (error.code === 'network' || error.code === 'timeout') {
        return 'No se pudo conectar con el servidor.';
      }
      return error.message;
    }
    if (error instanceof Error) return error.message;
    return fallbackMessage;
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchCitationDraft(signal);
      if (!mounted.current) return;
      setDraftState(remote);
      saveLocalCitationDraft(remote);
    } catch (error: unknown) {
      if (!mounted.current) return;
      if (error instanceof ApiError && error.status === 404) {
        const local = loadCitationDraft();
        setDraftState(local);
      } else {
        setError(handleRemoteError(error, 'Error al cargar el borrador'));
        setDraftState(createEmptyCitationDraft());
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [handleRemoteError]);

  /* eslint-disable react-hooks/set-state-in-effect -- Carga inicial del borrador; migrar a React Query queda fuera del alcance. */
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    load(controller.signal);
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setDraft = useCallback((nextDraft: CitationDraft) => {
    if (!mounted.current) return;
    setDraftState(nextDraft);
    saveLocalCitationDraft(nextDraft);
  }, []);

  const saveDraft = useCallback(async (explicitDraft?: CitationDraft): Promise<boolean> => {
    const target = explicitDraft ?? draft;
    if (!target) return false;
    if (!mounted.current) return false;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveRemoteCitationDraft(target);
      if (!mounted.current) return false;
      setDraftState(saved);
      saveLocalCitationDraft(saved);
      return true;
    } catch (error: unknown) {
      if (!mounted.current) return false;
      setError(handleRemoteError(error, 'Error al guardar el borrador'));
      return false;
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [draft, handleRemoteError]);

  const retry = useCallback(() => {
    const controller = new AbortController();
    load(controller.signal);
  }, [load]);

  return { draft, loading, saving, error, setDraft, saveDraft, retry };
}

export { isMasterRecordComplete };
