export type CitationDirectoryStatus =
  | 'pending'
  | 'account_created'
  | 'listing_started'
  | 'submitted'
  | 'published'
  | 'needs_review';

export interface CitationProfile {
  firstName: string;
  lastName: string;
  accountEmail: string;
  username: string;
  password: string;
  recoveryEmail: string;
  contactRole: string;
  internalNotes: string;
}

export interface CitationBusinessNap {
  businessName: string;
  legalName: string;
  category: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  mobile: string;
  publicEmail: string;
  website: string;
  latitude: string;
  longitude: string;
}

export interface CitationListingContent {
  listingTitle: string;
  shortDescription: string;
  description: string;
  keywords: string;
  organization: string;
  plan: string;
  includeProfile: boolean;
  openSundays: boolean;
  militaryDiscount: boolean;
  seniorDiscount: boolean;
  studentDiscount: boolean;
}

export interface CitationDayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface CitationHours {
  Lunes: CitationDayHours;
  Martes: CitationDayHours;
  Miércoles: CitationDayHours;
  Jueves: CitationDayHours;
  Viernes: CitationDayHours;
  Sábado: CitationDayHours;
  Domingo: CitationDayHours;
}

export interface CitationSocialAssets {
  facebook: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  logoUrl: string;
  photoUrl: string;
  attachmentTitle: string;
  attachmentUrl: string;
}

export interface CitationDirectory {
  id: string;
  name: string;
  url: string;
  plan: string;
  note: string;
}

export interface CitationDirectoryStatusEntry {
  directoryId: string;
  status: CitationDirectoryStatus;
  observation: string;
}

export interface CitationDraft {
  profile: CitationProfile;
  business: CitationBusinessNap;
  listing: CitationListingContent;
  hours: CitationHours;
  social: CitationSocialAssets;
  statuses: Record<string, CitationDirectoryStatus>;
}

export const CITATION_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export type CitationDay = (typeof CITATION_DAYS)[number];

export const CITATION_STATUS_LABELS: Record<CitationDirectoryStatus, string> = {
  pending: 'Pendiente',
  account_created: 'Cuenta creada',
  listing_started: 'Ficha iniciada',
  submitted: 'Enviada',
  published: 'Publicada',
  needs_review: 'Requiere revisión',
};

export const CITATION_FORM_STEPS = [
  { key: 'account', label: 'Cuenta' },
  { key: 'business', label: 'Negocio y NAP' },
  { key: 'listing', label: 'Ficha pública' },
  { key: 'hours', label: 'Horarios' },
  { key: 'social', label: 'Redes y archivos' },
  { key: 'review', label: 'Revisión' },
] as const;

export type CitationStepKey = (typeof CITATION_FORM_STEPS)[number]['key'];
