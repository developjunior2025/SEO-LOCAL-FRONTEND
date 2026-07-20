import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CitationDraft, CitationDay } from '../../types/citations';
import { CITATION_DIRECTORIES } from '../../data/citationDirectories';
import { CITATION_DAYS } from '../../types/citations';

interface CitationCopyPanelProps {
  draft: CitationDraft;
}

interface CopyRow {
  label: string;
  value: string;
  sensitive?: boolean;
}

function useClipboard() {
  const [message, setMessage] = useState<string | null>(null);

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
    setTimeout(() => setMessage(null), 1800);
  };

  return { copy, message };
}

export default function CitationCopyPanel({ draft }: CitationCopyPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const { copy, message } = useClipboard();

  const selectedSite = CITATION_DIRECTORIES[selectedIndex];

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
      value: draft.hours[day].closed ? 'Cerrado' : `${draft.hours[day].open} - ${draft.hours[day].close}`,
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden sticky top-4 max-h-[calc(100vh-88px)] flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#102237] to-[#183653]">
        <h3 className="text-base font-black text-white">Panel para copiar y pegar</h3>
        <p className="text-[10px] text-blue-100 mt-1">Selecciona un directorio y copia campos individuales o todos los datos.</p>
      </div>

      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="border border-gray-200 rounded-lg bg-white px-2 py-2 text-[10px] font-semibold"
          >
            {CITATION_DIRECTORIES.map((site, i) => (
              <option key={site.id} value={i}>{i + 1}. {site.name}</option>
            ))}
          </select>
          <a
            href={selectedSite.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 border border-gray-200 bg-white rounded-lg px-3 py-2 text-[10px] font-black text-[#333] hover:border-gray-300"
          >
            <ExternalLink className="w-3 h-3" /> Abrir
          </a>
        </div>
        {selectedSite.note && (
          <p className="text-[8px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mt-2 leading-tight">
            {selectedSite.note}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="flex-1 border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-[9px] font-black text-[#333] hover:border-gray-300"
          >
            {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </button>
          <button
            type="button"
            onClick={copyAll}
            className="flex-1 bg-[#D32323] text-white rounded-lg px-2 py-1.5 text-[9px] font-black hover:bg-[#b01c1c]"
          >
            Copiar todo
          </button>
        </div>
        {message && <p className="text-[8px] text-center text-emerald-600 mt-1 font-black">{message}</p>}
      </div>

      <div className="overflow-auto p-3 flex-1">
        {Object.entries(groups).map(([group, rows]) => (
          <div key={group} className="border border-gray-200 rounded-xl mb-2 overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-2.5 py-2">
              <b className="text-[8px] uppercase tracking-wider text-gray-600">{group}</b>
              <button
                type="button"
                onClick={() => copyGroup(rows)}
                className="text-[8px] font-black text-[#0074E0] hover:text-[#D32323]"
              >
                Copiar grupo
              </button>
            </div>
            {rows.map((row) => {
              const isPassword = row.sensitive && !showPassword;
              return (
                <div key={row.label} className="grid grid-cols-[100px_minmax(0,1fr)_28px] gap-2 items-center px-2.5 py-1.5 border-b border-gray-100 last:border-0">
                  <div className="text-[8px] font-black text-gray-500">{row.label}</div>
                  <div
                    className={`text-[9px] font-semibold truncate ${isPassword ? 'blur-[5px] select-none' : ''} ${row.value ? 'text-[#333]' : 'text-gray-400 italic'}`}
                    title={row.value}
                  >
                    {row.value || 'Sin completar'}
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(row.value)}
                    className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#D32323] hover:border-[#D32323]"
                    aria-label={`Copiar ${row.label}`}
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
  );
}

