import type { CitationDraft } from '../../types/citations';

const REQUIRED_FIELDS: Array<keyof CitationDraft['profile'] | keyof CitationDraft['business'] | keyof CitationDraft['listing']> = [
  'firstName', 'lastName', 'accountEmail', 'username', 'password',
  'businessName', 'category', 'address1', 'city', 'state', 'postalCode', 'country', 'phone', 'publicEmail', 'website',
  'listingTitle', 'shortDescription', 'description',
];

function computeCitationProgress(draft: CitationDraft): { done: number; total: number; pct: number } {
  const values: Record<string, string | boolean> = {
    ...draft.profile,
    ...draft.business,
    ...draft.listing,
  };
  const done = REQUIRED_FIELDS.filter((key) => {
    const value = values[key];
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  }).length;
  const total = REQUIRED_FIELDS.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

interface CitationProgressProps {
  draft: CitationDraft;
}

export default function CitationProgress({ draft }: CitationProgressProps) {
  const { pct } = computeCitationProgress(draft);
  return (
    <div className="min-w-[142px]">
      <div className="text-[9px] font-black text-gray-500 text-right">{pct}% completado</div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mt-1">
        <div className="h-full bg-[#D32323] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
