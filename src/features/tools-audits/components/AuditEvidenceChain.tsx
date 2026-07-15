import AuditChip from './AuditChip';
import type { AuditEvidenceStep, AuditLedgerRow } from '../types/audit';

interface AuditEvidenceChainProps {
  chain: AuditEvidenceStep[];
  ledger: AuditLedgerRow[];
}

const statusTone: Record<string, 'green' | 'amber' | 'gray'> = {
  Aprobado: 'green',
  Revisión: 'amber',
  Pendiente: 'gray',
};

export default function AuditEvidenceChain({ chain, ledger }: AuditEvidenceChainProps) {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#333]">Cadena de evidencia completa</h3>
          <AuditChip tone="green">{chain.length} cadenas verificadas</AuditChip>
        </div>
        <div className="p-4 cc360-proof">
          {chain.map((step) => (
            <div key={step.number} className="cc360-pstep">
              <div className="cc360-pnum">{step.number}</div>
              <small className="text-[8px] text-gray-500 font-black uppercase">{step.phase}</small>
              <b className="text-[9px] block my-1.5">{step.title}</b>
              <p className="text-[8px] text-gray-500 leading-relaxed m-0">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-xs font-black text-[#333]">Libro mayor de evidencias</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-500 text-[8px] uppercase">
                <th className="text-left py-2">ID</th>
                <th className="text-left py-2">Acción</th>
                <th className="text-left py-2">Evidencia</th>
                <th className="text-left py-2">Verificación</th>
                <th className="text-left py-2">Cambio</th>
                <th className="text-left py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledger.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 text-gray-500">{row.id}</td>
                  <td className="py-2 font-bold text-[#333]">{row.action}</td>
                  <td className="py-2">{row.evidence}</td>
                  <td className="py-2">{row.verification}</td>
                  <td className="py-2">{row.change}</td>
                  <td className="py-2">
                    <AuditChip tone={statusTone[row.status]}>{row.status}</AuditChip>
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
