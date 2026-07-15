import AuditChip from './AuditChip';
import type { AuditReviewTopic, AuditReviewQueueItem } from '../types/audit';

interface AuditReputationPanelProps {
  kpis: Array<{ label: string; value: string; delta: string; positive?: boolean }>;
  topics: AuditReviewTopic[];
  queue: AuditReviewQueueItem[];
}

const trendTone: Record<string, 'green' | 'redchip' | 'amber'> = {
  Fortaleza: 'green',
  Riesgo: 'redchip',
  Mejora: 'green',
  Vigilar: 'amber',
};

const priorityTone: Record<string, 'redchip' | 'amber' | 'blue'> = {
  Urgente: 'redchip',
  Revisar: 'amber',
  Responder: 'blue',
};

export default function AuditReputationPanel({ kpis, topics, queue }: AuditReputationPanelProps) {
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
            <h3 className="text-xs font-black text-[#333]">Temas y sentimiento</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 text-[8px] uppercase text-left">
                  <th className="py-2">Tema</th>
                  <th className="py-2">Menciones</th>
                  <th className="py-2">Nota</th>
                  <th className="py-2">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topics.map((topic) => (
                  <tr key={topic.topic}>
                    <td className="py-2 font-bold text-[#333]">{topic.topic}</td>
                    <td className="py-2">{topic.mentions}</td>
                    <td className="py-2">{topic.score}</td>
                    <td className="py-2">
                      <AuditChip tone={trendTone[topic.trend]}>{topic.trend}</AuditChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <h3 className="text-xs font-black text-[#333]">Cola de respuesta</h3>
            <AuditChip tone="amber">{queue.length} pendientes</AuditChip>
          </div>
          <div className="p-4">
            <table className="w-full text-[10px]">
              <tbody className="divide-y divide-gray-100">
                {queue.map((item, i) => (
                  <tr key={`${item.platform}-${i}`}>
                    <td className="py-2">
                      <b className="block text-[#333]">{item.platform} · {item.rating}★</b>
                      <span className="text-[8px] text-gray-500">{item.age}</span>
                    </td>
                    <td className="py-2 text-right">
                      <AuditChip tone={priorityTone[item.priority]}>{item.priority}</AuditChip>
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
