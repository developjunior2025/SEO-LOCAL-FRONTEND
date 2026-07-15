import type { AuditSummary, AuditCompareRow, AuditDataSource } from '../types/audit';

interface AuditExecutiveSummaryProps {
  summary: AuditSummary;
  compareRows: AuditCompareRow[];
  sources: AuditDataSource[];
}

export default function AuditExecutiveSummary({ summary, compareRows, sources }: AuditExecutiveSummaryProps) {
  return (
    <aside className="cc360-summary">
      <h3 className="text-xs font-black mb-3">Resumen ejecutivo</h3>
      <div className="cc360-sumgrid">
        <div className="cc360-sum">
          <small className="block text-[6px] text-[#9fb0bd]">TRABAJO</small>
          <b className="block text-[17px] mt-1">{summary.workVerified}%</b>
          <span className="text-[7px] text-emerald-300">+{summary.workDelta} pp</span>
        </div>
        <div className="cc360-sum">
          <small className="block text-[6px] text-[#9fb0bd]">RESULTADO</small>
          <b className="block text-[17px] mt-1">{summary.resultAchieved}%</b>
          <span className="text-[7px] text-emerald-300">+{summary.resultDelta} pp</span>
        </div>
        <div className="cc360-sum">
          <small className="block text-[6px] text-[#9fb0bd]">CONFIANZA</small>
          <b className="block text-[17px] mt-1">{summary.dataConfidence}%</b>
          <span className="text-[7px] text-emerald-300">{summary.confidenceLabel}</span>
        </div>
        <div className="cc360-sum">
          <small className="block text-[6px] text-[#9fb0bd]">ROI</small>
          <b className="block text-[17px] mt-1">{summary.roi}×</b>
          <span className="text-[7px] text-emerald-300">{summary.roiLabel}</span>
        </div>
      </div>

      <div className="cc360-compare">
        <h4 className="text-[9px] font-black mb-2">Antes → Ahora → Meta</h4>
        {compareRows.map((row) => (
          <div key={row.label} className="cc360-crow">
            <span>{row.label}</span>
            <span className="cc360-cbar">
              <i className="cc360-cbar-fill" style={{ width: `${row.width}%` }} />
            </span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>

      <div className="cc360-sourcebox">
        <h4 className="text-[9px] font-black mb-2">Fuentes y vigencia</h4>
        <div className="cc360-sources">
          {sources.map((source) => (
            <div key={source.key} className="cc360-source">
              <small className="block text-[6px] text-[#9fb0bd]">{source.label}</small>
              <b className="text-[8px] block">{source.status}</b>
              <span className="block text-[6px] text-emerald-300 mt-0.5">{source.updatedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
