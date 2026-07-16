import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useAppState } from '@/state/useAppState';
import { getDashboardPathForRole } from '@/state/authHelpers';
import { buildAuditUrl } from './toolsDropdownConfig';

interface ToolsDropdownProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function ToolsDropdown({ mobile, onClose }: ToolsDropdownProps) {
  const navigate = useNavigate();
  const { user } = useAppState();

  const handleClick = () => {
    onClose?.();
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(buildAuditUrl('summary'))}`);
      return;
    }
    if (user.role === 'client') {
      navigate(buildAuditUrl('summary'));
      return;
    }
    navigate(getDashboardPathForRole(user.role));
  };

  const isActive = typeof window !== 'undefined' && window.location.pathname === '/herramientas/auditorias';

  if (mobile) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 transition-colors"
      >
        <Layers className="w-5 h-5 text-[#D32323] shrink-0" />
        <span className="text-base font-semibold text-[#333]">Herramientas</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors relative py-1 after:content-[""] after:absolute after:h-0.5 after:bottom-0 after:left-0 after:bg-[#D32323] after:transition-all after:duration-300 ${
        isActive
          ? 'text-[#D32323] after:w-full'
          : 'text-[#333] hover:text-[#D32323] after:w-0 hover:after:w-full'
      }`}
    >
      <Layers className="w-4 h-4" />
      Herramientas
    </button>
  );
}
