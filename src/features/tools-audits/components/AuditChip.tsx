const variants: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  redchip: 'bg-red-50 text-red-700 border-red-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface AuditChipProps {
  children: React.ReactNode;
  tone?: 'green' | 'blue' | 'amber' | 'redchip' | 'purple' | 'gray';
}

export default function AuditChip({ children, tone = 'gray' }: AuditChipProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${variants[tone]}`}>
      {children}
    </span>
  );
}
