import type { AuditGeoPoint } from '../types/audit';

interface AuditGeoGridProps {
  points: AuditGeoPoint[];
}

export default function AuditGeoGrid({ points }: AuditGeoGridProps) {
  return (
    <div>
      <div className="cc360-geo">
        {points.map((point, i) => (
          <span key={i} className={`cc360-g${point.rankBucket}`} title={`Posición ${point.label}`}>
            {point.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mt-2">
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-[#148a57]" />1–3</span>
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-[#54ad62]" />4–6</span>
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-[#d8ad2f]" />7–10</span>
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-[#e68a29]" />11–20</span>
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-[#d64848]" />21+</span>
      </div>
    </div>
  );
}
