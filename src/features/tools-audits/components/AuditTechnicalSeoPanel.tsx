import AuditChip from './AuditChip';
import type { AuditTechnicalIssue } from '../types/audit';

interface AuditTechnicalSeoPanelProps {
  kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
  issues: AuditTechnicalIssue[];
}

const severityTone: Record<string, 'redchip' | 'amber' | 'gray'> = {
  Crítico: 'redchip',
  Alto: 'amber',
  Medio: 'gray',
};

const statusTone: Record<string, 'blue' | 'gray' | 'purple'> = {
  'En ejecución': 'blue',
  Planificado: 'gray',
  Análisis: 'purple',
};

export default function AuditTechnicalSeoPanel({ kpis, issues }: AuditTechnicalSeoPanelProps) {
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
          <h3 className="text-xs font-black text-[#333]">Problemas priorizados</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-500 text-[8px] uppercase text-left">
                <th className="py-2">Severidad</th>
                <th className="py-2">Hallazgo</th>
                <th className="py-2">Impacto</th>
                <th className="py-2">Confianza</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.map((issue) => (
                <tr key={issue.finding}>
                  <td className="py-2">
                    <AuditChip tone={severityTone[issue.severity]}>{issue.severity}</AuditChip>
                  </td>
                  <td className="py-2 font-bold text-[#333]">{issue.finding}</td>
                  <td className="py-2">{issue.impact}</td>
                  <td className="py-2">{issue.confidence}</td>
                  <td className="py-2">
                    <AuditChip tone={statusTone[issue.status] ?? 'gray'}>{issue.status}</AuditChip>
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
