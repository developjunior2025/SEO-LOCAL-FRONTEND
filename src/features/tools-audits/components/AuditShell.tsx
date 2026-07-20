import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronDown, User } from 'lucide-react';
import { useAppState } from '@/state/useAppState';
import { clientAuditDemoData as data } from '../data/clientAuditDemoData';
import AuditProjectHeader from './AuditProjectHeader';
import type { AuditTabKey } from '@/components/toolsDropdownConfig';
import { AUDIT_TAB_OPTIONS, buildAuditUrl } from '@/components/toolsDropdownConfig';

interface AuditShellProps {
  title: string;
  description: string;
  activeTab: AuditTabKey | 'citations';
  children: React.ReactNode;
}

const SHELL_TABS = [
  ...AUDIT_TAB_OPTIONS.map((opt) => ({ key: opt.key, label: opt.label, href: buildAuditUrl(opt.key) })),
  { key: 'citations' as const, label: 'Citaciones', href: '/herramientas/citaciones' },
];

export default function AuditShell({ title, description, activeTab, children }: AuditShellProps) {
  const navigate = useNavigate();
  const { user } = useAppState();

  const handleTabChange = (key: string) => {
    const tab = SHELL_TABS.find((t) => t.key === key);
    if (tab) navigate(tab.href);
  };

  return (
    <div className="cc360 bg-[#f4f7fa] min-h-[calc(100vh-80px)]">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#333] tracking-tight mb-1">{title}</h1>
            <p className="text-xs text-gray-500 font-medium">{description}</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
            <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D32323] text-white text-xs font-black">
              <BarChart3 className="w-4 h-4" /> Panel cliente
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#213a53] to-[#dda079] text-white flex items-center justify-center text-xs font-black">
                {user?.name?.charAt(0) ?? <User className="w-3.5 h-3.5" />}
              </div>
              <div>
                <b className="block text-xs text-[#333]">{user?.name ?? 'Invitado'}</b>
                <small className="block text-[9px] text-gray-500">{user?.role === 'client' ? 'Cliente' : user?.role}</small>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>

        <AuditProjectHeader project={data.project} />

        <div className="flex gap-2 overflow-auto mb-3 pb-1" role="tablist" aria-label="Módulos del proyecto">
          {SHELL_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`whitespace-nowrap border rounded-full px-3 py-1.5 text-[10px] font-black transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#D32323] border-[#D32323] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
