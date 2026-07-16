import type { AuditProject } from '../types/audit';
import AuditChip from './AuditChip';

interface AuditProjectHeaderProps {
  project: AuditProject;
}

export default function AuditProjectHeader({ project }: AuditProjectHeaderProps) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-3 shadow-sm mb-4">
      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center font-black text-[#333]">
        {project.logoLetters}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-black text-[#333] truncate">
          {project.name} <AuditChip tone="green">{project.status}</AuditChip>
        </h3>
        <p className="text-[10px] text-gray-500 font-semibold truncate">
          {project.serviceLine} · {project.location} · {project.auditId}
        </p>
      </div>
      <div className="hidden sm:flex gap-2">
        <button type="button" className="border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-[10px] font-black text-[#333] hover:border-gray-300 transition-colors">
          Cambiar proyecto
        </button>
        <button type="button" className="bg-[#D32323] text-white rounded-lg px-3 py-1.5 text-[10px] font-black hover:bg-[#b01c1c] transition-colors">
          Generar reporte
        </button>
      </div>
    </div>
  );
}
