import { useEffect, useRef, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { CitationDraft, CitationDay } from '../../types/citations';
import { CITATION_DIRECTORIES } from '../../data/citationDirectories';
import { CITATION_DAYS, CITATION_STATUS_LABELS } from '../../types/citations';

interface CitationCopyPanelProps {
  draft: CitationDraft;
  selectedDirectoryIndex: number;
  onSelectDirectory: (index: number) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CopyRow {
  label: string;
  value: string;
  sensitive?: boolean;
}

function useClipboard() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const copy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setMessage('Copiado');
    } catch {
      setMessage('No se pudo copiar');
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(null), 1800);
  };

  return { copy, message };
}

export default function CitationCopyPanel({
  draft,
  selectedDirectoryIndex,
  onSelectDirectory,
  isOpen,
  onOpenChange,
}: CitationCopyPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { copy, message } = useClipboard();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(isOpen);

  const safeIndex = Math.min(
    Math.max(0, selectedDirectoryIndex),
    CITATION_DIRECTORIES.length - 1
  );
  const selectedSite = CITATION_DIRECTORIES[safeIndex];
  const currentStatus = draft.statuses[selectedSite.id] || 'pending';

  const groups: Record<string, CopyRow[]> = {
    Cuenta: [
      { label: 'Nombre', value: `${draft.profile.firstName} ${draft.profile.lastName}`.trim() },
      { label: 'Correo de cuenta', value: draft.profile.accountEmail },
      { label: 'Usuario', value: draft.profile.username },
      { label: 'Contraseña', value: draft.profile.password, sensitive: true },
      { label: 'Correo de recuperación', value: draft.profile.recoveryEmail },
      { label: 'Cargo', value: draft.profile.contactRole },
      { label: 'Notas internas', value: draft.profile.internalNotes },
    ],
    'Negocio y NAP': [
      { label: 'Nombre comercial', value: draft.business.businessName },
      { label: 'Razón social', value: draft.business.legalName },
      { label: 'Categoría', value: draft.business.category },
      { label: 'Dirección', value: draft.business.address1 },
      { label: 'Dirección adicional', value: draft.business.address2 },
      { label: 'Ciudad', value: draft.business.city },
      { label: 'Estado', value: draft.business.state },
      { label: 'Código postal', value: draft.business.postalCode },
      { label: 'País', value: draft.business.country },
      { label: 'Teléfono', value: draft.business.phone },
      { label: 'Teléfono móvil', value: draft.business.mobile },
      { label: 'Correo público', value: draft.business.publicEmail },
      { label: 'Sitio web', value: draft.business.website },
      { label: 'Latitud', value: draft.business.latitude },
      { label: 'Longitud', value: draft.business.longitude },
    ],
    'Ficha pública': [
      { label: 'Título', value: draft.listing.listingTitle },
      { label: 'Descripción corta', value: draft.listing.shortDescription },
      { label: 'Descripción', value: draft.listing.description },
      { label: 'Palabras clave', value: draft.listing.keywords },
      { label: 'Organización', value: draft.listing.organization },
      { label: 'Plan', value: draft.listing.plan },
      { label: 'Incluir perfil', value: draft.listing.includeProfile ? 'Sí' : 'No' },
      { label: 'Abierto domingos', value: draft.listing.openSundays ? 'Sí' : 'No' },
      { label: 'Descuento militar', value: draft.listing.militaryDiscount ? 'Sí' : 'No' },
      { label: 'Descuento tercera edad', value: draft.listing.seniorDiscount ? 'Sí' : 'No' },
      { label: 'Descuento estudiantil', value: draft.listing.studentDiscount ? 'Sí' : 'No' },
    ],
    Horarios: CITATION_DAYS.map((day: CitationDay) => ({
      label: day,
      value: draft.hours[day].closed
        ? 'Cerrado'
        : `${draft.hours[day].open} - ${draft.hours[day].close}`,
    })),
    'Redes y archivos': [
      { label: 'Facebook', value: draft.social.facebook },
      { label: 'LinkedIn', value: draft.social.linkedin },
      { label: 'X / Twitter', value: draft.social.twitter },
      { label: 'Instagram', value: draft.social.instagram },
      { label: 'Logo', value: draft.social.logoUrl },
      { label: 'Foto principal', value: draft.social.photoUrl },
      { label: 'Título del adjunto', value: draft.social.attachmentTitle },
      { label: 'PDF / adjunto', value: draft.social.attachmentUrl },
    ],
  };

  const totalFields = Object.values(groups).reduce(
    (sum, rows) => sum + rows.length,
    0
  );

  const copyGroup = (rows: CopyRow[]) => {
    copy(rows.map((r) => `${r.label}: ${r.value}`).join('\n'));
  };

  const copyAll = () => {
    const lines = [
      `DIRECTORIO: ${selectedSite.name}`,
      `URL: ${selectedSite.url}`,
      '',
      ...Object.entries(groups).flatMap(([group, rows]) => [
        group.toUpperCase(),
        ...rows.map((r) => `${r.label}: ${r.value}`),
        '',
      ]),
    ];
    copy(lines.join('\n'));
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        id="citation-copy-trigger"
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="citation-copy-bubble"
        className={`fixed right-6 bottom-6 z-[48] flex items-center gap-2.5 min-w-[214px] rounded-2xl px-3.5 py-2.5 text-white shadow-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#102237] ${
          isOpen
            ? 'bg-gradient-to-r from-[#D32323] to-[#a81717]'
            : 'bg-gradient-to-r from-[#102237] to-[#1c4566]'
        }`}
      >
        <span className="w-9 h-9 rounded-xl bg-white/15 grid place-items-center text-lg font-black shrink-0">
          ⧉
        </span>
        <span className="min-w-0 flex-1 text-left">
          <strong className="block text-xs leading-tight">Copiar datos</strong>
          <small className="block max-w-[135px] truncate text-[8px] font-bold text-blue-100/80 mt-1">
            {selectedSite.name}
          </small>
        </span>
        <span
          className={`text-sm font-black transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ↑
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[42] bg-[#102237]/30 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <section
            id="citation-copy-bubble"
            role="dialog"
            aria-modal="true"
            aria-labelledby="citation-copy-title"
            aria-hidden={!isOpen}
            className="fixed z-[46] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(1080px,calc(100vw-36px))] h-[min(790px,calc(100vh-38px))] max-md:w-[calc(100vw-20px)] max-md:h-[calc(100vh-20px)] flex flex-col overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-2xl"
          >
            <header className="flex-shrink-0 flex items-start justify-between gap-3 p-5 text-white bg-gradient-to-br from-[#102237] to-[#1d4565]">
              <div>
                <span className="inline-block mb-1 text-[8px] font-black uppercase tracking-[0.13em] text-sky-200">
                  Panel completo
                </span>
                <h3
                  id="citation-copy-title"
                  className="text-lg font-black tracking-tight"
                >
                  Todos los datos para copiar
                </h3>
                <p className="text-[10px] text-blue-100/80 mt-1 leading-relaxed">
                  Cada campo aparece visible con su botón de copiado individual.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Cerrar panel"
                className="shrink-0 w-8 h-8 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-shrink-0 grid grid-cols-[minmax(250px,1fr)_auto_auto_auto] gap-2 items-end p-3 border-b border-gray-200 bg-[#f7f9fb] max-md:grid-cols-2">
              <div className="flex flex-col gap-1 max-md:col-span-full">
                <label
                  htmlFor="copy-site-selector"
                  className="text-[8px] font-black uppercase tracking-wider text-gray-500"
                >
                  Directorio seleccionado
                </label>
                <select
                  id="copy-site-selector"
                  value={safeIndex}
                  onChange={(e) => onSelectDirectory(Number(e.target.value))}
                  className="w-full min-h-[35px] border border-gray-200 rounded-lg bg-white px-3 py-2 text-[10px] font-semibold"
                >
                  {CITATION_DIRECTORIES.map((site, i) => (
                    <option key={site.id} value={i}>
                      {i + 1}. {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <a
                href={selectedSite.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 border border-gray-200 bg-white rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300 min-h-[35px] whitespace-nowrap"
              >
                <ExternalLink className="w-3 h-3" /> Abrir sitio
              </a>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300 min-h-[35px] whitespace-nowrap"
              >
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="bg-[#D32323] text-white rounded-lg px-3 py-2 text-[9px] font-black hover:bg-[#b01c1c] min-h-[35px] whitespace-nowrap"
              >
                Copiar todos los datos
              </button>
            </div>

            <div className="flex-shrink-0 p-2.5 border-b border-gray-200 bg-white">
              <div className="rounded-lg border border-gray-200 bg-[#f8fafb] p-2 text-[9px] font-bold text-gray-600">
                <b className="text-[#333]">{selectedSite.name}</b>
                <span className="mx-1">·</span>
                Plan: {selectedSite.plan}
                <span className="mx-1">·</span>
                Estado: {CITATION_STATUS_LABELS[currentStatus]}
              </div>
              {selectedSite.note && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[8px] font-bold text-amber-700 leading-tight">
                  {selectedSite.note}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 flex flex-col overflow-hidden bg-[#f4f7fa]">
              <div className="flex-shrink-0 flex items-center justify-between gap-3 p-3 border-b border-gray-200 bg-white">
                <div>
                  <strong className="block text-xs text-[#333]">
                    Información completa
                  </strong>
                  <small className="block text-[8px] text-gray-500 mt-0.5">
                    Cuenta, negocio y NAP, ficha pública, horarios, redes y archivos.
                  </small>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[8px] font-black text-gray-600">
                  {totalFields} campos
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
                {message && (
                  <p className="mb-2 text-[9px] text-center font-black text-emerald-600">
                    {message}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  {Object.entries(groups).map(([group, rows]) => (
                    <div
                      key={group}
                      className="self-start border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-200">
                        <b className="text-[9px] uppercase tracking-wider text-gray-600">
                          {group}
                        </b>
                        <button
                          type="button"
                          onClick={() => copyGroup(rows)}
                          className="border border-blue-200 rounded-md bg-white px-2 py-1 text-[8px] font-black text-[#0074E0] hover:text-[#D32323] hover:border-[#D32323]"
                        >
                          Copiar grupo
                        </button>
                      </div>
                      {rows.map((row) => {
                        const isPassword = row.sensitive && !showPassword;
                        return (
                          <div
                            key={row.label}
                            className="grid grid-cols-[125px_minmax(0,1fr)_34px] gap-2 items-center min-h-[42px] px-2.5 py-1.5 border-b border-gray-100 last:border-0"
                          >
                            <div className="text-[8px] font-black text-gray-500 leading-tight">
                              {row.label}
                            </div>
                            <div
                              className={`text-[9px] font-semibold leading-relaxed break-words ${
                                isPassword
                                  ? 'blur-[5px] select-none'
                                  : ''
                              } ${
                                row.value
                                  ? 'text-[#333]'
                                  : 'text-gray-400 italic'
                              }`}
                              title={row.value}
                            >
                              {row.value || 'Sin completar'}
                            </div>
                            <button
                              type="button"
                              onClick={() => copy(row.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-[#0074E0] hover:text-[#D32323] hover:border-[#D32323] hover:bg-red-50"
                              aria-label={`Copiar ${row.label}`}
                              title={`Copiar ${row.label}`}
                            >
                              ⧉
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
