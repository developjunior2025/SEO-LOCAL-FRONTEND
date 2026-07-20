import { useCallback, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuditShell from '../AuditShell';
import CitationForm from './CitationForm';
import CitationCopyPanel from './CitationCopyPanel';
import CitationDirectoryTracker from './CitationDirectoryTracker';
import {
  clearCitationDraft,
  createEmptyCitationDraft,
  exportCitationDraft,
  importCitationDraft,
  loadCitationDraft,
  saveCitationDraft,
} from '../../services/citationStorage';
import type { CitationDraft, CitationStepKey } from '../../types/citations';
import { useAppState } from '@/state/useAppState';

const SAVE_DELAY = 400;

export default function CitationsManagerPage() {
  const navigate = useNavigate();
  const { triggerToast } = useAppState();
  const [draft, setDraft] = useState<CitationDraft>(() => loadCitationDraft());
  const [activeStep, setActiveStep] = useState<CitationStepKey>('account');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [selectedDirectoryIndex, setSelectedDirectoryIndex] = useState(0);
  const [copyPanelOpen, setCopyPanelOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scheduleSave = useCallback((nextDraft: CitationDraft) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveCitationDraft(nextDraft);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaved(`Guardado local: ${time}`);
    }, SAVE_DELAY);
  }, []);

  const handleDraftChange = useCallback((nextDraft: CitationDraft) => {
    setDraft(nextDraft);
    scheduleSave(nextDraft);
  }, [scheduleSave]);

  const handleManualSave = () => {
    saveCitationDraft(draft);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSaved(`Guardado local: ${time}`);
    triggerToast('Borrador guardado');
  };

  const handleExport = () => {
    const blob = new Blob([exportCitationDraft(draft)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SEOLOCAL_citaciones_borrador.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imported = importCitationDraft(String(reader.result));
      if (imported) {
        setDraft(imported);
        saveCitationDraft(imported);
        triggerToast('Datos importados');
      } else {
        triggerToast('JSON no válido');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (!window.confirm('¿Limpiar todos los datos del gestor manual?')) return;
    clearCitationDraft();
    setDraft(createEmptyCitationDraft());
    triggerToast('Datos eliminados');
  };

  const handleOpenPanel = (index: number) => {
    setSelectedDirectoryIndex(index);
    setCopyPanelOpen(true);
  };

  return (
    <AuditShell
      title="Gestor manual de citaciones"
      description="Registra una sola vez la información del negocio y copia cada campo en los 20 directorios incluidos."
      activeTab="citations"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate('/herramientas/auditorias?tab=summary')}
          className="inline-flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-[10px] font-black text-[#333] hover:border-gray-300"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Centro 360
        </button>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-[9px] text-gray-500 font-semibold">{lastSaved || 'Los cambios se guardan automáticamente.'}</span>
          <button type="button" onClick={handleClear} className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300">Limpiar</button>
          <button type="button" onClick={handleExport} className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300">Exportar JSON</button>
          <label className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300 cursor-pointer">
            Importar JSON
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
          </label>
          <button type="button" onClick={handleManualSave} className="bg-[#D32323] text-white rounded-lg px-3 py-2 text-[9px] font-black hover:bg-[#b01c1c]">Guardar borrador</button>
        </div>
      </div>

      <div className="space-y-4">
        <CitationForm draft={draft} activeStep={activeStep} onChange={handleDraftChange} onStepChange={setActiveStep} />
        <CitationDirectoryTracker
          draft={draft}
          onChange={handleDraftChange}
          selectedDirectoryIndex={selectedDirectoryIndex}
          onOpenPanel={handleOpenPanel}
        />
      </div>

      <CitationCopyPanel
        draft={draft}
        selectedDirectoryIndex={selectedDirectoryIndex}
        onSelectDirectory={setSelectedDirectoryIndex}
        isOpen={copyPanelOpen}
        onOpenChange={setCopyPanelOpen}
      />

      <div className="text-center mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-500">
          Etapa 1 manual · sincronización real y automatización en próxima fase
        </span>
      </div>
    </AuditShell>
  );
}
