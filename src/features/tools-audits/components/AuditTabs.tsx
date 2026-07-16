import { AUDIT_TAB_OPTIONS, type AuditTabKey } from '@/components/toolsDropdownConfig';

interface AuditTabsProps {
  active: AuditTabKey;
  onChange: (tab: AuditTabKey) => void;
}

export default function AuditTabs({ active, onChange }: AuditTabsProps) {
  return (
    <div className="flex gap-2 overflow-auto mb-3 pb-1" role="tablist" aria-label="Secciones del Command Center">
      {AUDIT_TAB_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={active === opt.key}
          onClick={() => onChange(opt.key)}
          className={`whitespace-nowrap border rounded-full px-3 py-1.5 text-[10px] font-black transition-colors ${
            active === opt.key
              ? 'bg-[#D32323] border-[#D32323] text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
