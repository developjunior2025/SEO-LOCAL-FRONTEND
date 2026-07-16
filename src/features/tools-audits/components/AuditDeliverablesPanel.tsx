import AuditChip from './AuditChip';
import type { AuditDeliverable, AuditApproval } from '../types/audit';

interface AuditDeliverablesPanelProps {
  deliverables: AuditDeliverable[];
  approvals: AuditApproval[];
}

const statusTone: Record<string, 'amber' | 'green' | 'blue' | 'purple' | 'redchip'> = {
  'En revisión': 'amber',
  Aprobado: 'green',
  Compartido: 'blue',
  Inmutable: 'purple',
  'Acción cliente': 'redchip',
  Pendiente: 'amber',
};

export default function AuditDeliverablesPanel({ deliverables, approvals }: AuditDeliverablesPanelProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#333]">Entregables y versiones</h3>
          <AuditChip tone="amber">{deliverables.filter((d) => d.status === 'En revisión').length} por aprobar</AuditChip>
        </div>
        <div className="p-4">
          <table className="w-full text-[10px]">
            <tbody className="divide-y divide-gray-100">
              {deliverables.map((item) => (
                <tr key={item.name}>
                  <td className="py-2">
                    <b className="block text-[#333]">{item.name}</b>
                    <span className="text-[8px] text-gray-500">{item.type}</span>
                  </td>
                  <td className="py-2 text-right">
                    <AuditChip tone={statusTone[item.status] ?? 'gray'}>{item.status}</AuditChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#333]">Aprobaciones</h3>
        </div>
        <div className="p-4">
          <table className="w-full text-[10px]">
            <tbody className="divide-y divide-gray-100">
              {approvals.map((item) => (
                <tr key={item.name}>
                  <td className="py-2">
                    <b className="block text-[#333]">{item.name}</b>
                    <span className="text-[8px] text-gray-500">{item.detail}</span>
                  </td>
                  <td className="py-2 text-right">
                    <AuditChip tone={statusTone[item.status] ?? 'gray'}>{item.status}</AuditChip>
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
