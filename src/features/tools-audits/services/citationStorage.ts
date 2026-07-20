import type { CitationDraft, CitationHours } from '../types/citations';
import { CITATION_DIRECTORIES } from '../data/citationDirectories';

const STORAGE_KEY = 'seolocal.manual-citations.v1';

const defaultHours = (): CitationHours => ({
  Lunes: { open: '09:00', close: '17:00', closed: false },
  Martes: { open: '09:00', close: '17:00', closed: false },
  Miércoles: { open: '09:00', close: '17:00', closed: false },
  Jueves: { open: '09:00', close: '17:00', closed: false },
  Viernes: { open: '09:00', close: '17:00', closed: false },
  Sábado: { open: '09:00', close: '17:00', closed: false },
  Domingo: { open: '09:00', close: '17:00', closed: true },
});

export const createEmptyCitationDraft = (): CitationDraft => ({
  profile: {
    firstName: '',
    lastName: '',
    accountEmail: '',
    username: '',
    password: '',
    recoveryEmail: '',
    contactRole: '',
    internalNotes: '',
  },
  business: {
    businessName: '',
    legalName: '',
    category: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    mobile: '',
    publicEmail: '',
    website: '',
    latitude: '',
    longitude: '',
  },
  listing: {
    listingTitle: '',
    shortDescription: '',
    description: '',
    keywords: '',
    organization: '',
    plan: 'Free Trial',
    includeProfile: false,
    openSundays: false,
    militaryDiscount: false,
    seniorDiscount: false,
    studentDiscount: false,
  },
  hours: defaultHours(),
  social: {
    facebook: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    logoUrl: '',
    photoUrl: '',
    attachmentTitle: '',
    attachmentUrl: '',
  },
  statuses: Object.fromEntries(CITATION_DIRECTORIES.map((dir) => [dir.id, 'pending' as const])),
});

export function loadCitationDraft(): CitationDraft {
  if (typeof window === 'undefined') return createEmptyCitationDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyCitationDraft();
    const parsed = JSON.parse(raw) as Partial<CitationDraft>;
    return {
      ...createEmptyCitationDraft(),
      ...parsed,
      hours: { ...defaultHours(), ...(parsed.hours || {}) },
      statuses: {
        ...Object.fromEntries(CITATION_DIRECTORIES.map((dir) => [dir.id, 'pending' as const])),
        ...(parsed.statuses || {}),
      },
    };
  } catch {
    return createEmptyCitationDraft();
  }
}

export function saveCitationDraft(draft: CitationDraft): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearCitationDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportCitationDraft(draft: CitationDraft): string {
  return JSON.stringify(draft, null, 2);
}

export function importCitationDraft(json: string): CitationDraft | null {
  try {
    const parsed = JSON.parse(json) as Partial<CitationDraft>;
    return {
      ...createEmptyCitationDraft(),
      ...parsed,
      hours: { ...defaultHours(), ...(parsed.hours || {}) },
      statuses: {
        ...Object.fromEntries(CITATION_DIRECTORIES.map((dir) => [dir.id, 'pending' as const])),
        ...(parsed.statuses || {}),
      },
    };
  } catch {
    return null;
  }
}
