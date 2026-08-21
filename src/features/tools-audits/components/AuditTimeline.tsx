// V5385_CC360_EMPTY_TIMELINE_GUARD
import { useMemo, useState } from 'react';
import AuditChip from './AuditChip';
import type { AuditTimelineSnapshot } from '../types/audit';

interface AuditTimelineProps {
  snapshots?: AuditTimelineSnapshot[] | null;
}

export default function AuditTimeline({ snapshots }: AuditTimelineProps) {
  const safeSnapshots = useMemo(
    () => (Array.isArray(snapshots) ? snapshots.filter(Boolean) : []),
    [snapshots]
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (safeSnapshots.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm" data-testid="audit-timeline-empty">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#333]">Viaje temporal del proyecto</h3>
          <AuditChip tone="amber">Pendiente de mediciones</AuditChip>
        </div>
        <div className="p-5">
          <p className="text-xs font-black text-[#333]">Todavía no hay snapshots históricos.</p>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
            El panel seguirá disponible sin errores y mostrará la evolución cuando exista la primera medición comparable.
          </p>
        </div>
      </div>
    );
  }

  const index = selectedIndex === null
    ? safeSnapshots.length - 1
    : Math.min(selectedIndex, safeSnapshots.length - 1);
  const current = safeSnapshots[index] ?? safeSnapshots[safeSnapshots.length - 1];
  const points = [
    { label: 'SALUD', value: current?.health ?? '—' },
    { label: 'CVL', value: current?.cvl ?? '—' },
    { label: 'NAP', value: current?.nap ?? '—' },
    { label: 'RESPUESTA', value: current?.response ?? '—' },
    { label: 'CPL', value: current?.cpl ?? '—' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm" data-testid="audit-timeline">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-black text-[#333]">Viaje temporal del proyecto</h3>
        <AuditChip tone="blue">Comparabilidad 100%</AuditChip>
        <div className="ml-auto">
          <button type="button" className="border border-gray-200 rounded-lg px-2.5 py-1 text-[10px] font-black text-[#333]">
            Metodología
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <label className="text-[10px] font-black text-gray-400 uppercase" htmlFor="audit-timeline-range">Inicio</label>
          <input
            id="audit-timeline-range"
            aria-label="Seleccionar snapshot temporal"
            type="range"
            min={0}
            max={Math.max(0, safeSnapshots.length - 1)}
            value={index}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="flex-1 accent-[#D32323]"
          />
          <label className="text-[10px] font-black text-gray-400 uppercase" htmlFor="audit-timeline-range">Actual</label>
          <span className="min-w-[120px] text-right text-xs font-black text-[#0074E0]">{current?.label ?? 'Sin fecha'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {points.map((point) => (
            <div key={point.label} className="border border-gray-200 rounded-lg p-2 text-center bg-white">
              <small className="block text-[8px] text-gray-500">{point.label}</small>
              <b className="block text-sm font-black text-[#333] mt-1">{point.value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
