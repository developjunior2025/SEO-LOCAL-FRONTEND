import AuditChip from './AuditChip';
import AuditGeoGrid from './AuditGeoGrid';
import type { AuditCompetitor, AuditGeoPoint } from '../types/audit';

interface AuditRankingsPanelProps {
  kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
  geoKeyword: string;
  geoGridSize: string;
  geoPoints: AuditGeoPoint[];
  competitors: AuditCompetitor[];
}

const tagTone: Record<string, 'redchip' | 'blue' | 'amber' | 'gray'> = {
  Líder: 'redchip',
  Cliente: 'blue',
  Emergente: 'amber',
  Estable: 'gray',
};

export default function AuditRankingsPanel({ kpis, geoKeyword, geoGridSize, geoPoints, competitors }: AuditRankingsPanelProps) {
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

      <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-[#333]">GeoGrid · {geoKeyword}</h3>
            <AuditChip tone="blue">{geoGridSize}</AuditChip>
          </div>
          <div className="p-4">
            <AuditGeoGrid points={geoPoints} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-[#333]">Inteligencia competitiva</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-[10px]">
              <tbody className="divide-y divide-gray-100">
                {competitors.map((comp) => (
                  <tr key={comp.name}>
                    <td className="py-2">
                      <b className="block text-[#333]">{comp.name}</b>
                      <span className="text-[8px] text-gray-500">CVL {comp.cvl}%</span>
                    </td>
                    <td className="py-2 text-right">
                      <AuditChip tone={tagTone[comp.tag]}>{comp.tag}</AuditChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
