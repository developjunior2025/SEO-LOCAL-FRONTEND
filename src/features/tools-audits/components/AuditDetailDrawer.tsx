import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AuditDimension } from '../types/audit';

interface AuditDetailDrawerProps {
  dimension: AuditDimension | null;
  onClose: () => void;
}

export default function AuditDetailDrawer({ dimension, onClose }: AuditDetailDrawerProps) {
  useEffect(() => {
    if (!dimension) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dimension, onClose]);

  if (!dimension) return null;

  return (
    <>
      <div className="cc360-drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="cc360-drawer">
        <div className="flex items-center border-b border-gray-200 p-4">
          <h2 className="text-base font-black text-[#333]">{dimension.label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-[#D32323] text-2xl leading-none p-1"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{dimension.detail}</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {dimension.detailKpis.map((kpi) => (
              <div key={kpi.label} className="border border-gray-200 rounded-lg p-2">
                <small className="block text-[10px] text-gray-400">{kpi.label}</small>
                <b className="block text-sm font-black text-[#333]">{kpi.value}</b>
              </div>
            ))}
          </div>
          <h3 className="text-xs font-black text-[#333] mb-2">Fuentes</h3>
          <div className="grid gap-2">
            {dimension.sourceKpis.map((kpi) => (
              <div key={kpi.label} className="border border-gray-200 rounded-lg p-2">
                <b className="text-xs block">{kpi.label}</b>
                <p className="text-[10px] text-gray-500 m-0">{kpi.value}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full mt-4 bg-[#D32323] text-white font-black py-2.5 rounded-lg text-xs hover:bg-[#b01c1c] transition-colors"
          >
            Abrir módulo completo
          </button>
        </div>
      </aside>
    </>
  );
}
