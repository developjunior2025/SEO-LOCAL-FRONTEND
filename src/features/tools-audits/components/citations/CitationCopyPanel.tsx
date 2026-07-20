import { forwardRef, useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CitationDraft, CitationDay } from '../../types/citations';
import { CITATION_DIRECTORIES } from '../../data/citationDirectories';
import { CITATION_DAYS, CITATION_STATUS_LABELS } from '../../types/citations';

interface CitationCopyPanelProps {
  draft: CitationDraft;
  selectedDirectoryIndex: number;
  onSelectDirectory: (index: number) => void;
  expanded: boolean;
  onToggle: () => void;
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

function GroupCard({
  title,
  rows,
  showPassword,
  onCopyGroup,
  onCopyValue,
}: {
  title: string;
  rows: CopyRow[];
  showPassword: boolean;
  onCopyGroup: (rows: CopyRow[]) => void;
  onCopyValue: (value: string) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="h-9 flex items-center justify-between gap-2 px-2.5 bg-gray-50 border-b border-gray-200">
        <b className="text-[8px] uppercase tracking-wider text-gray-600">{title}</b>
        <button
          type="button"
          onClick={() => onCopyGroup(rows)}
          className="border border-blue-200 rounded-md bg-white px-2 py-1 text-[7px] font-black text-[#0074E0] hover:text-[#D32323] hover:border-[#D32323]"
        >
          Copiar grupo
        </button>
      </div>
      <div className="py-0.5">
        {rows.map((row) => {
          const isPassword = row.sensitive && !showPassword;
          return (
            <div
              key={row.label}
              className="min-h-[29px] grid grid-cols-[105px_minmax(0,1fr)_27px] gap-1.5 items-center px-1.5 py-[3px] border-b border-gray-100 last:border-0"
            >
              <div className="text-[7px] font-black text-gray-500 leading-tight">{row.label}</div>
              <div
                className={`min-w-0 text-[8px] font-semibold truncate ${
                  isPassword ? 'blur-[5px] select-none' : ''
                } ${row.value ? 'text-[#333]' : 'text-gray-400 italic'}`}
                title={row.value}
              >
                {row.value || 'Sin completar'}
              </div>
              <button
                type="button"
                onClick={() => onCopyValue(row.value)}
                className="w-[26px] h-[26px] border border-gray-200 rounded-md bg-white flex items-center justify-center text-[#0074E0] hover:text-[#D32323] hover:border-[#D32323]"
                aria-label={`Copiar ${row.label}`}
                title={`Copiar ${row.label}`}
              >
                ⧉
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CitationCopyPanel = forwardRef<HTMLDivElement, CitationCopyPanelProps>(
  function CitationCopyPanel(
    { draft, selectedDirectoryIndex, onSelectDirectory, expanded, onToggle },
    ref
  ) {
    const [showPassword, setShowPassword] = useState(false);
    const { copy, message } = useClipboard();
    const messageTimerRef = useRef<number | null>(null);

    const safeIndex = Math.min(
      Math.max(0, selectedDirectoryIndex),
      CITATION_DIRECTORIES.length - 1
    );
    const selectedSite = CITATION_DIRECTORIES[safeIndex];
    const currentStatus = draft.statuses[selectedSite.id] || 'pending';

    const accountRows: CopyRow[] = [
      { label: 'Nombre', value: `${draft.profile.firstName} ${draft.profile.lastName}`.trim() },
      { label: 'Correo de cuenta', value: draft.profile.accountEmail },
      { label: 'Usuario', value: draft.profile.username },
      { label: 'Contraseña', value: draft.profile.password, sensitive: true },
      { label: 'Correo de recuperación', value: draft.profile.recoveryEmail },
      { label: 'Cargo', value: draft.profile.contactRole },
      { label: 'Notas internas', value: draft.profile.internalNotes },
    ];

    const businessRows: CopyRow[] = [
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
    ];

    const listingRows: CopyRow[] = [
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
    ];

    const hoursRows: CopyRow[] = CITATION_DAYS.map((day: CitationDay) => ({
      label: day,
      value: draft.hours[day].closed
        ? 'Cerrado'
        : `${draft.hours[day].open} - ${draft.hours[day].close}`,
    }));

    const socialRows: CopyRow[] = [
      { label: 'Facebook', value: draft.social.facebook },
      { label: 'LinkedIn', value: draft.social.linkedin },
      { label: 'X / Twitter', value: draft.social.twitter },
      { label: 'Instagram', value: draft.social.instagram },
      { label: 'Logo', value: draft.social.logoUrl },
      { label: 'Foto principal', value: draft.social.photoUrl },
      { label: 'Título del adjunto', value: draft.social.attachmentTitle },
      { label: 'PDF / adjunto', value: draft.social.attachmentUrl },
    ];

    const copyGroup = (rows: CopyRow[]) => {
      copy(rows.map((r) => `${r.label}: ${r.value}`).join('\n'));
    };

    const copyAll = () => {
      const lines = [
        `DIRECTORIO: ${selectedSite.name}`,
        `URL: ${selectedSite.url}`,
        '',
        'CUENTA',
        ...accountRows.map((r) => `${r.label}: ${r.value}`),
        '',
        'NEGOCIO Y NAP',
        ...businessRows.map((r) => `${r.label}: ${r.value}`),
        '',
        'FICHA PÚBLICA',
        ...listingRows.map((r) => `${r.label}: ${r.value}`),
        '',
        'HORARIOS',
        ...hoursRows.map((r) => `${r.label}: ${r.value}`),
        '',
        'REDES Y ARCHIVOS',
        ...socialRows.map((r) => `${r.label}: ${r.value}`),
        '',
      ];
      copy(lines.join('\n'));
    };

    const copyNap = () => {
      copy(businessRows.map((r) => `${r.label}: ${r.value}`).join('\n'));
    };

    const copyHours = () => {
      copy(hoursRows.map((r) => `${r.label}: ${r.value}`).join('\n'));
    };

    const copyCredentials = () => {
      copy(
        accountRows
          .filter((r) => ['Correo de cuenta', 'Usuario', 'Contraseña'].includes(r.label))
          .map((r) => `${r.label}: ${r.value}`)
          .join('\n')
      );
    };

    useEffect(() => {
      if (!message) return;
      if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = window.setTimeout(() => {}, 0);
    }, [message]);

    return (
      <div ref={ref} className="space-y-0">
        <section className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center p-3 mb-4 border border-[#D9E5EE] rounded-[15px] bg-gradient-to-r from-blue-50/50 to-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#EDF6FF] text-[#0074E0] grid place-items-center text-lg font-black shrink-0">
            ⧉
          </div>
          <div>
            <b className="block text-[11px] text-[#333]">Información preparada para copiar</b>
            <small className="block text-[8px] text-gray-500 mt-0.5">
              Despliega un panel dentro de la página, organizado en cuatro columnas y sin ocultar la lista de los 20 directorios.
            </small>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="bg-[#0074E0] border border-[#0074E0] text-white rounded-lg px-3 py-2 text-[9px] font-black hover:bg-blue-700 min-w-[165px]"
          >
            {expanded ? 'Ocultar datos para copiar' : 'Mostrar datos para copiar'}
          </button>
        </section>

        {expanded && (
          <section
            id="citation-inline-copy-panel"
            className="bg-white border border-gray-200 rounded-[18px] shadow-md overflow-hidden scroll-mt-24"
          >
            <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-black text-[#333]">Datos listos para copiar</h3>
                <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                  Todos los campos quedan disponibles en una sola vista compacta, con copiado individual, por grupo y completo.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="border border-gray-200 bg-[#F8FAFB] rounded-lg px-3 py-2 text-[9px] font-black text-[#333] hover:border-gray-300"
              >
                Ocultar panel
              </button>
            </div>

            <div className="grid grid-cols-[minmax(260px,1.35fr)_minmax(125px,.48fr)_minmax(125px,.48fr)_auto_auto_auto] gap-2 items-end p-3 border-b border-gray-200 bg-[#F7F9FB] max-lg:grid-cols-3 max-md:grid-cols-2">
              <div className="flex flex-col gap-1 max-lg:col-span-full">
                <label
                  htmlFor="copy-site-selector"
                  className="text-[7px] font-black uppercase tracking-wider text-gray-500"
                >
                  Directorio seleccionado
                </label>
                <select
                  id="copy-site-selector"
                  value={safeIndex}
                  onChange={(e) => onSelectDirectory(Number(e.target.value))}
                  className="w-full h-[34px] border border-gray-200 rounded-lg bg-white px-2.5 text-[9px] font-semibold"
                >
                  {CITATION_DIRECTORIES.map((site, i) => (
                    <option key={site.id} value={i}>
                      {String(i + 1).padStart(2, '0')} · {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black uppercase tracking-wider text-gray-500">
                  Plan
                </span>
                <div className="h-[34px] border border-gray-200 rounded-lg bg-white flex items-center px-2.5 text-[8px] font-black text-gray-600 truncate">
                  {selectedSite.plan}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black uppercase tracking-wider text-gray-500">
                  Estado
                </span>
                <div className="h-[34px] border border-gray-200 rounded-lg bg-white flex items-center px-2.5 text-[8px] font-black text-gray-600 truncate">
                  {CITATION_STATUS_LABELS[currentStatus]}
                </div>
              </div>
              <a
                href={selectedSite.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 h-[34px] border border-gray-200 bg-white rounded-lg px-3 text-[8px] font-black text-[#333] hover:border-gray-300 whitespace-nowrap"
              >
                <ExternalLink className="w-3 h-3" /> Abrir sitio
              </a>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="h-[34px] border border-gray-200 bg-white rounded-lg px-3 text-[8px] font-black text-[#333] hover:border-gray-300 whitespace-nowrap"
              >
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="h-[34px] bg-[#D32323] text-white rounded-lg px-3 text-[8px] font-black hover:bg-[#b01c1c] whitespace-nowrap"
              >
                Copiar todo
              </button>
            </div>

            {selectedSite.note && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200 bg-[#FFF8E8] text-amber-800 text-[8px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {selectedSite.note}
              </div>
            )}

            {message && (
              <p className="py-1 text-[9px] text-center font-black text-emerald-600 bg-white border-b border-gray-200">
                {message}
              </p>
            )}

            <div className="grid grid-cols-4 gap-2 p-2 bg-[#F2F5F7] max-xl:grid-cols-2 max-md:grid-cols-1">
              <div className="flex flex-col gap-2">
                <GroupCard
                  title="Cuenta"
                  rows={accountRows}
                  showPassword={showPassword}
                  onCopyGroup={copyGroup}
                  onCopyValue={copy}
                />
                <GroupCard
                  title="Horarios"
                  rows={hoursRows}
                  showPassword={showPassword}
                  onCopyGroup={copyGroup}
                  onCopyValue={copy}
                />
              </div>

              <div className="flex flex-col gap-2">
                <GroupCard
                  title="Negocio y NAP"
                  rows={businessRows}
                  showPassword={showPassword}
                  onCopyGroup={copyGroup}
                  onCopyValue={copy}
                />
              </div>

              <div className="flex flex-col gap-2">
                <GroupCard
                  title="Ficha pública"
                  rows={listingRows}
                  showPassword={showPassword}
                  onCopyGroup={copyGroup}
                  onCopyValue={copy}
                />
              </div>

              <div className="flex flex-col gap-2">
                <GroupCard
                  title="Redes y archivos"
                  rows={socialRows}
                  showPassword={showPassword}
                  onCopyGroup={copyGroup}
                  onCopyValue={copy}
                />
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm flex-1">
                  <div className="h-9 flex items-center px-2.5 bg-gray-50 border-b border-gray-200">
                    <b className="text-[8px] uppercase tracking-wider text-gray-600">Acciones rápidas</b>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copyNap}
                      className="bg-[#0074E0] text-white rounded-lg px-2 py-2 text-[8px] font-black hover:bg-blue-700"
                    >
                      Copiar NAP
                    </button>
                    <button
                      type="button"
                      onClick={copyCredentials}
                      className="border border-gray-200 bg-white rounded-lg px-2 py-2 text-[8px] font-black text-[#333] hover:border-gray-300"
                    >
                      Credenciales
                    </button>
                    <button
                      type="button"
                      onClick={copyHours}
                      className="border border-gray-200 bg-white rounded-lg px-2 py-2 text-[8px] font-black text-[#333] hover:border-gray-300"
                    >
                      Horarios
                    </button>
                    <button
                      type="button"
                      onClick={copyAll}
                      className="bg-[#D32323] text-white rounded-lg px-2 py-2 text-[8px] font-black hover:bg-[#b01c1c]"
                    >
                      Copiar todo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }
);

export default CitationCopyPanel;
