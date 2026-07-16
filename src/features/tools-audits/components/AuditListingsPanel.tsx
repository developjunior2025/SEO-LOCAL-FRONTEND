import AuditChip from './AuditChip';
import type { AuditListing } from '../types/audit';

interface AuditListingsPanelProps {
  kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
  directories: AuditListing[];
}

const statusTone: Record<string, 'green' | 'amber' | 'redchip'> = {
  Sincronizado: 'green',
  'En proceso': 'amber',
  Conflicto: 'redchip',
  Verificado: 'green',
};

export default function AuditListingsPanel({ kpis, directories }: AuditListingsPanelProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <small className="block text-[8px] text-gray-500 font-black uppercase">{kpi.label}</small>
            <strong className="block text-xl font-black text-[#333] my-1">{kpi.value}</strong>
            <span className={`text-[8px] font-black ${kpi.positive ? 'text-emerald-600' : 'text-red-600'}`}>{kpi.delta}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#333]">Estado por directorio</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-500 text-[8px] uppercase text-left">
                <th className="py-2">Directorio</th>
                <th className="py-2">NAP</th>
                <th className="py-2">Horarios</th>
                <th className="py-2">Categoría</th>
                <th className="py-2">Duplicado</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {directories.map((dir) => (
                <tr key={dir.directory}>
                  <td className="py-2 font-bold text-[#333]">{dir.directory}</td>
                  <td className="py-2">{dir.nap}</td>
                  <td className="py-2">{dir.hours}</td>
                  <td className="py-2">{dir.category}</td>
                  <td className="py-2">{dir.duplicate}</td>
                  <td className="py-2">
                    <AuditChip tone={statusTone[dir.status] ?? 'gray'}>{dir.status}</AuditChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
