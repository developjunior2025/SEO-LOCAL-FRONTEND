import AuditChip from './AuditChip';
import type { AuditFunnelRow, AuditCampaign } from '../types/audit';

interface AuditSemPanelProps {
  kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
  funnel: AuditFunnelRow[];
  campaigns: AuditCampaign[];
}

const statusTone: Record<string, 'green' | 'amber'> = {
  Escalar: 'green',
  Óptima: 'green',
  Optimizar: 'amber',
};

export default function AuditSemPanel({ kpis, funnel, campaigns }: AuditSemPanelProps) {
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

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-[#333]">Embudo de conversiones</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-[10px]">
              <tbody className="divide-y divide-gray-100">
                {funnel.map((row) => (
                  <tr key={row.label}>
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-right font-black text-[#333]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-[#333]">Campañas</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-[10px]">
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((camp) => (
                  <tr key={camp.name}>
                    <td className="py-2">
                      <b className="block text-[#333]">{camp.name}</b>
                      <span className="text-[8px] text-gray-500">{camp.platform}</span>
                    </td>
                    <td className="py-2">{camp.roas}×</td>
                    <td className="py-2 text-right">
                      <AuditChip tone={statusTone[camp.status]}>{camp.status}</AuditChip>
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
