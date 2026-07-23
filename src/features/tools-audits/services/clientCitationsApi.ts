import { apiFetch, isDemoDataEnabled } from '@/lib/apiConfig';
import type { CitationDraft } from '../types/citations';
import { createEmptyCitationDraft } from '../services/citationStorage';

export interface CitationDraftResponse {
  draft: CitationDraft;
}

export async function fetchCitationDraft(signal?: AbortSignal): Promise<CitationDraft> {
  if (isDemoDataEnabled()) {
    return createEmptyCitationDraft();
  }
  const response = await apiFetch<CitationDraftResponse | CitationDraft>(
    '/client/citations/draft',
    {},
    { signal }
  );
  return 'draft' in response ? response.draft : response;
}

export async function saveCitationDraft(draft: CitationDraft): Promise<void> {
  if (isDemoDataEnabled()) {
    return;
  }
  await apiFetch('/client/citations/draft', {
    method: 'PUT',
    body: JSON.stringify(draft),
  });
}
