import { useCallback, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
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
  saveCitationDraft as saveLocalCitationDraft,
} from '../../services/citationStorage';
import { useCitationDraft } from '../../hooks/useCitationDraft';
import type { CitationDraft, CitationStepKey } from '../../types/citations';
import { useAppState } from '@/state/useAppState';

const SAVE_DELAY = 400;

function isMasterRecordComplete(draft: CitationDraft): boolean {
  const required = [
    draft.profile.firstName,
    draft.profile.lastName,
    draft.profile.accountEmail,
    draft.profile.username,
    draft.profile.password,
    draft.business.businessName,
    draft.business.address1,
    draft.business.phone,
    draft.business.publicEmail,
    draft.business.website,
    draft.listing.listingTitle,
    draft.listing.description,
  ];
  return required.every(Boolean);
}

function CitationsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="h-48 bg-gray-200 rounded-2xl" />
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );
}

function CitationsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="w-8 h-8 text-[#D32323] mx-auto mb-3" />
      <p className="text-sm font-black text-[#333] mb-2">No se pudo cargar el borrador</p>
      <p className="text-xs text-gray-600 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-[#D32323] text-white px-4 py-2 text-xs font-black hover:bg-[#b01c1c]"
      >
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );
}

export default function CitationsManagerPage() {
  const navigate = useNavigate();
  const { triggerToast } = useAppState();
  const { draft, loading, saving, error, setDraft, saveDraft, retry } = useCitationDraft();

  const [activeStep, setActiveStep] = useState<CitationStepKey>('account');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [selectedDirectoryIndex, setSelectedDirectoryIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(() => !draft || !isMasterRecordComplete(draft));
  const [copyOpen, setCopyOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyPanelRef = useRef<HTMLDivElement>(null);

  const scheduleSave = useCallback((nextDraft: CitationDraft) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      saveLocalCitationDraft(nextDraft);
      await saveDraft();
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaved(`Guardado: ${time}`);
    }, SAVE_DELAY);
  }, [saveDraft]);

  const handleDraftChange = useCallback((nextDraft: CitationDraft) => {
    setDraft(nextDraft);
    scheduleSave(nextDraft);
  }, [setDraft, scheduleSave]);

  const handleManualSave = async () => {
    if (!draft) return;
    saveLocalCitationDraft(draft);
    await saveDraft();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSaved(`Guardado: ${time}`);
    triggerToast('Borrador guardado');
  };

  const handleExport = () => {
    if (!draft) return;
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
        saveLocalCitationDraft(imported);
        setFormOpen(!isMasterRecordComplete(imported));
        setCopyOpen(false);
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
    const empty = createEmptyCitationDraft();
    setDraft(empty);
    setFormOpen(true);
    setCopyOpen(false);
    triggerToast('Datos eliminados');
  };

  const handleOpenPanel = (index: number) => {
    setSelectedDirectoryIndex(index);
    setCopyOpen(true);
    window.setTimeout(() => {
      copyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleToggleCopyPanel = () => {
    setCopyOpen((open) => {
      const next = !open;
      if (next) {
        window.setTimeout(() => {
          copyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <AuditShell
        title="Gestor manual de citaciones"
        description="Registra una sola vez la información del negocio y copia cada campo en los 20 directorios incluidos."
        activeTab="citations"
      >
        <CitationsSkeleton />
      </AuditShell>
    );
  }

  if (error) {
    return (
      <AuditShell
        title="Gestor manual de citaciones"
        description="Registra una sola vez la información del negocio y copia cada campo en los 20 directorios incluidos."
        activeTab="citations"
      >
        <CitationsError message={error} onRetry={retry} />
      </AuditShell>
    );
  }

  if (!draft) {
    return (
      <AuditShell
        title="Gestor manual de citaciones"
        description="Registra una sola vez la información del negocio y copia cada campo en los 20 directorios incluidos."
        activeTab="citations"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-black text-amber-900">No se pudo inicializar el borrador</p>
        </div>
      </AuditShell>
    );
  }

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
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
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
          <button type="button" onClick={handleManualSave} disabled={saving} className="bg-[#D32323] text-white rounded-lg px-3 py-2 text-[9px] font-black hover:bg-[#b01c1c] disabled:opacity-60">Guardar borrador</button>
        </div>
      </div>

      <div className="space-y-4">
        <CitationForm
          draft={draft}
          activeStep={activeStep}
          onChange={handleDraftChange}
          onStepChange={setActiveStep}
          expanded={formOpen}
          onToggle={() => setFormOpen((v) => !v)}
        />
        <CitationCopyPanel
          ref={copyPanelRef}
          draft={draft}
          selectedDirectoryIndex={selectedDirectoryIndex}
          onSelectDirectory={setSelectedDirectoryIndex}
          expanded={copyOpen}
          onToggle={handleToggleCopyPanel}
        />
        <CitationDirectoryTracker
          draft={draft}
          onChange={handleDraftChange}
          selectedDirectoryIndex={selectedDirectoryIndex}
          onOpenPanel={handleOpenPanel}
        />
      </div>

      <div className="text-center mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-500">
          Etapa 1 manual · sincronización real y automatización en próxima fase
        </span>
      </div>
    </AuditShell>
  );
}
