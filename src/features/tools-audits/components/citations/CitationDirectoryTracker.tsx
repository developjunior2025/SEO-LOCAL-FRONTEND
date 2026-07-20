import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CitationDraft, CitationDirectoryStatus } from '../../types/citations';
import { CITATION_DIRECTORIES } from '../../data/citationDirectories';
import { CITATION_STATUS_LABELS } from '../../types/citations';

interface CitationDirectoryTrackerProps {
  draft: CitationDraft;
  onChange: (draft: CitationDraft) => void;
  onSelectDirectory?: (index: number) => void;
}

export default function CitationDirectoryTracker({ draft, onChange, onSelectDirectory }: CitationDirectoryTrackerProps) {
  const [search, setSearch] = useState('');

  const filtered = CITATION_DIRECTORIES.filter((dir) => dir.name.toLowerCase().includes(search.toLowerCase()));

  const updateStatus = (id: string, status: CitationDirectoryStatus) => {
    onChange({ ...draft, statuses: { ...draft.statuses, [id]: status } });
  };

  const resetStatuses = () => {
    if (!window.confirm('¿Reiniciar el estado de los 20 directorios?')) return;
    onChange({
      ...draft,
      statuses: Object.fromEntries(CITATION_DIRECTORIES.map((dir) => [dir.id, 'pending' as const])),
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-200">
        <div>
          <h3 className="text-base font-black text-[#333]">Seguimiento de los 20 directorios</h3>
          <p className="text-[10px] text-gray-500 mt-1">Actualiza el estado manual de cada registro. No se ejecuta automatización.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar directorio"
            className="border border-gray-200 rounded-lg px-3 py-2 text-[10px] font-semibold w-full sm:w-[230px]"
          />
          <button
            type="button"
            onClick={resetStatuses}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300 whitespace-nowrap"
          >
            Reiniciar estados
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 text-[8px] uppercase tracking-wider text-gray-500 font-black">Directorio</th>
              <th className="text-left px-3 py-2 text-[8px] uppercase tracking-wider text-gray-500 font-black">Plan</th>
              <th className="text-left px-3 py-2 text-[8px] uppercase tracking-wider text-gray-500 font-black">Estado</th>
              <th className="text-left px-3 py-2 text-[8px] uppercase tracking-wider text-gray-500 font-black">Observación</th>
              <th className="text-left px-3 py-2 text-[8px] uppercase tracking-wider text-gray-500 font-black">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((dir, index) => {
              const status = draft.statuses[dir.id] || 'pending';
              return (
                <tr key={dir.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2">
                    <span className="block text-[10px] font-black text-[#333]">{index + 1}. {dir.name}</span>
                    <a href={dir.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[8px] text-[#0074E0] font-bold hover:underline">
                      {dir.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 text-[8px] font-black">
                      {dir.plan}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={status}
                      onChange={(e) => updateStatus(dir.id, e.target.value as CitationDirectoryStatus)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-[9px] font-bold bg-white"
                    >
                      {Object.entries(CITATION_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-[8px] text-amber-700 font-semibold max-w-[260px]">{dir.note}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelectDirectory?.(CITATION_DIRECTORIES.findIndex((d) => d.id === dir.id))}
                      className="border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-[9px] font-black text-[#333] hover:border-gray-300"
                    >
                      Usar panel
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
