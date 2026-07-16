import { useState } from 'react';
import AuditChip from './AuditChip';
import type { AuditTimelineSnapshot } from '../types/audit';

interface AuditTimelineProps {
  snapshots: AuditTimelineSnapshot[];
}

export default function AuditTimeline({ snapshots }: AuditTimelineProps) {
  const [index, setIndex] = useState(snapshots.length - 1);
  const current = snapshots[index];
  const points = [
    { label: 'SALUD', value: current.health },
    { label: 'CVL', value: current.cvl },
    { label: 'NAP', value: current.nap },
    { label: 'RESPUESTA', value: current.response },
    { label: 'CPL', value: current.cpl },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
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
          <label className="text-[10px] font-black text-gray-400 uppercase">Inicio</label>
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="flex-1 accent-[#D32323]"
          />
          <label className="text-[10px] font-black text-gray-400 uppercase">Actual</label>
          <span className="min-w-[120px] text-right text-xs font-black text-[#0074E0]">{current.label}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {points.map((point, i) => (
            <div
              key={point.label}
              className={`border rounded-lg p-2 text-center ${i === index ? 'border-[#8dc7f8] bg-blue-50' : 'border-gray-200'}`}
            >
              <small className="block text-[8px] text-gray-500">{point.label}</small>
              <b className="block text-sm font-black text-[#333] mt-1">{point.value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
