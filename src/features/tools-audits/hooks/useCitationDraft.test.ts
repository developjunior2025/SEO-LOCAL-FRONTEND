import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCitationDraft } from './useCitationDraft';
import * as clientCitationsApi from '../services/clientCitationsApi';
import * as citationStorage from '../services/citationStorage';
import type { CitationDraft } from '../types/citations';

function buildDraft(overrides: Partial<CitationDraft> = {}): CitationDraft {
  const empty = citationStorage.createEmptyCitationDraft();
  return {
    ...empty,
    profile: {
      ...empty.profile,
      firstName: 'Test',
      lastName: 'User',
      accountEmail: 'test@example.com',
      username: 'testuser',
      password: 'secret',
    },
    business: {
      ...empty.business,
      businessName: 'Test Business',
      address1: '123 Main St',
      phone: '555-1234',
      publicEmail: 'biz@example.com',
      website: 'https://example.com',
    },
    listing: {
      ...empty.listing,
      listingTitle: 'Test Listing',
      description: 'Description',
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'false');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('useCitationDraft', () => {
  it('carga borrador remoto al montar', async () => {
    const draft = buildDraft();
    vi.spyOn(clientCitationsApi, 'fetchCitationDraft').mockResolvedValue(draft);

    const { result } = renderHook(() => useCitationDraft());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.draft?.profile.firstName).toBe('Test');
  });

  it('saveDraft guarda exactamente el borrador recibido', async () => {
    const initial = buildDraft({ profile: { ...buildDraft().profile, firstName: 'Initial' } });
    const updated = buildDraft({ profile: { ...buildDraft().profile, firstName: 'Updated' } });
    vi.spyOn(clientCitationsApi, 'fetchCitationDraft').mockResolvedValue(initial);
    const saveSpy = vi.spyOn(clientCitationsApi, 'saveCitationDraft').mockResolvedValue(updated);

    const { result } = renderHook(() => useCitationDraft());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(async () => result.current.saveDraft(updated));

    expect(ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(updated);
    expect(result.current.draft?.profile.firstName).toBe('Updated');
  });

  it('no muestra "guardado" si PUT falla', async () => {
    const initial = buildDraft();
    vi.spyOn(clientCitationsApi, 'fetchCitationDraft').mockResolvedValue(initial);
    vi.spyOn(clientCitationsApi, 'saveCitationDraft').mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useCitationDraft());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(async () => result.current.saveDraft(initial));

    expect(ok).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('persiste inmediatamente al importar', async () => {
    const initial = citationStorage.createEmptyCitationDraft();
    const imported = buildDraft();
    vi.spyOn(clientCitationsApi, 'fetchCitationDraft').mockResolvedValue(initial);
    const saveSpy = vi.spyOn(clientCitationsApi, 'saveCitationDraft').mockResolvedValue(imported);

    const { result } = renderHook(() => useCitationDraft());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await act(async () => result.current.saveDraft(imported));

    expect(ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(imported);
    expect(result.current.draft?.profile.firstName).toBe('Test');
  });

  it('persiste inmediatamente al limpiar', async () => {
    const initial = buildDraft();
    vi.spyOn(clientCitationsApi, 'fetchCitationDraft').mockResolvedValue(initial);
    const saveSpy = vi.spyOn(clientCitationsApi, 'saveCitationDraft').mockImplementation(async (d) => d);

    const { result } = renderHook(() => useCitationDraft());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const empty = citationStorage.createEmptyCitationDraft();
    const ok = await act(async () => result.current.saveDraft(empty));

    expect(ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(empty);
  });
});
