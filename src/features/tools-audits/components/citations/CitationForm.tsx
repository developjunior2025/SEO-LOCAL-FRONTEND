import type { CitationDraft, CitationDay, CitationStepKey } from '../../types/citations';
import { CITATION_FORM_STEPS, CITATION_DAYS } from '../../types/citations';

interface CitationFormProps {
  draft: CitationDraft;
  activeStep: CitationStepKey;
  onChange: (draft: CitationDraft) => void;
  onStepChange: (step: CitationStepKey) => void;
}

function updateProfile(draft: CitationDraft, patch: Partial<CitationDraft['profile']>): CitationDraft {
  return { ...draft, profile: { ...draft.profile, ...patch } };
}

function updateBusiness(draft: CitationDraft, patch: Partial<CitationDraft['business']>): CitationDraft {
  return { ...draft, business: { ...draft.business, ...patch } };
}

function updateListing(draft: CitationDraft, patch: Partial<CitationDraft['listing']>): CitationDraft {
  return { ...draft, listing: { ...draft.listing, ...patch } };
}

function updateSocial(draft: CitationDraft, patch: Partial<CitationDraft['social']>): CitationDraft {
  return { ...draft, social: { ...draft.social, ...patch } };
}

function updateHours(draft: CitationDraft, day: CitationDay, patch: Partial<CitationDraft['hours'][CitationDay]>): CitationDraft {
  return { ...draft, hours: { ...draft.hours, [day]: { ...draft.hours[day], ...patch } } };
}

function Field({
  label,
  required,
  children,
  help,
  full,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  help?: string;
  full?: boolean;
}) {
  return (
    <div className={`${full ? 'col-span-full' : ''}`}>
      <label className="block text-[8px] uppercase tracking-wider text-gray-500 font-black mb-1.5">
        {label}
        {required && <span className="text-[#D32323] ml-0.5">*</span>}
      </label>
      {children}
      {help && <p className="text-[8px] text-gray-500 mt-1 leading-tight">{help}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full border border-gray-200 rounded-lg bg-white text-[#333] px-3 py-2 text-[11px] font-semibold outline-none focus:border-[#D32323] focus:ring-2 focus:ring-[#D32323]/10"
    />
  );
}

function Textarea({
  value,
  onChange,
  required,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full border border-gray-200 rounded-lg bg-white text-[#333] px-3 py-2 text-[11px] font-semibold outline-none focus:border-[#D32323] focus:ring-2 focus:ring-[#D32323]/10 min-h-[88px] resize-y leading-relaxed"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg bg-white text-[#333] px-3 py-2 text-[11px] font-semibold outline-none focus:border-[#D32323] focus:ring-2 focus:ring-[#D32323]/10"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function Check({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex gap-2 items-start border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#D32323]"
      />
      <span>
        <b className="text-[10px] block text-[#333]">{label}</b>
        <small className="text-[8px] text-gray-500 leading-tight block mt-0.5">{description}</small>
      </span>
    </label>
  );
}

export default function CitationForm({ draft, activeStep, onChange, onStepChange }: CitationFormProps) {
  const plans = ['Free Trial', 'Starter $0.99', 'Basic $3.00', 'Surge $5.00', 'Bundle $249.00'];

  const renderAccount = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Nombre" required><Input value={draft.profile.firstName} onChange={(v) => onChange(updateProfile(draft, { firstName: v }))} required /></Field>
      <Field label="Apellido" required><Input value={draft.profile.lastName} onChange={(v) => onChange(updateProfile(draft, { lastName: v }))} required /></Field>
      <Field label="Correo para registros" required full><Input type="email" value={draft.profile.accountEmail} onChange={(v) => onChange(updateProfile(draft, { accountEmail: v }))} required /></Field>
      <Field label="Usuario sugerido" required><Input value={draft.profile.username} onChange={(v) => onChange(updateProfile(draft, { username: v }))} required /></Field>
      <Field label="Contraseña" required><Input value={draft.profile.password} onChange={(v) => onChange(updateProfile(draft, { password: v }))} required /></Field>
      <Field label="Correo de recuperación"><Input type="email" value={draft.profile.recoveryEmail} onChange={(v) => onChange(updateProfile(draft, { recoveryEmail: v }))} /></Field>
      <Field label="Cargo del contacto"><Input value={draft.profile.contactRole} onChange={(v) => onChange(updateProfile(draft, { contactRole: v }))} /></Field>
      <Field label="Notas internas" full><Textarea value={draft.profile.internalNotes} onChange={(v) => onChange(updateProfile(draft, { internalNotes: v }))} /></Field>
    </div>
  );

  const renderBusiness = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Nombre comercial" required full><Input value={draft.business.businessName} onChange={(v) => onChange(updateBusiness(draft, { businessName: v }))} required /></Field>
      <Field label="Razón social"><Input value={draft.business.legalName} onChange={(v) => onChange(updateBusiness(draft, { legalName: v }))} /></Field>
      <Field label="Categoría principal" required><Input value={draft.business.category} onChange={(v) => onChange(updateBusiness(draft, { category: v }))} required /></Field>
      <Field label="Dirección" required full><Input value={draft.business.address1} onChange={(v) => onChange(updateBusiness(draft, { address1: v }))} required /></Field>
      <Field label="Suite, piso o referencia" full><Input value={draft.business.address2} onChange={(v) => onChange(updateBusiness(draft, { address2: v }))} /></Field>
      <Field label="Ciudad" required><Input value={draft.business.city} onChange={(v) => onChange(updateBusiness(draft, { city: v }))} required /></Field>
      <Field label="Estado / provincia" required><Input value={draft.business.state} onChange={(v) => onChange(updateBusiness(draft, { state: v }))} required /></Field>
      <Field label="Código postal" required><Input value={draft.business.postalCode} onChange={(v) => onChange(updateBusiness(draft, { postalCode: v }))} required /></Field>
      <Field label="País" required><Input value={draft.business.country} onChange={(v) => onChange(updateBusiness(draft, { country: v }))} required /></Field>
      <Field label="Teléfono principal" required><Input value={draft.business.phone} onChange={(v) => onChange(updateBusiness(draft, { phone: v }))} required /></Field>
      <Field label="Teléfono móvil"><Input value={draft.business.mobile} onChange={(v) => onChange(updateBusiness(draft, { mobile: v }))} /></Field>
      <Field label="Correo público" required><Input type="email" value={draft.business.publicEmail} onChange={(v) => onChange(updateBusiness(draft, { publicEmail: v }))} required /></Field>
      <Field label="Sitio web" required><Input type="url" placeholder="https://" value={draft.business.website} onChange={(v) => onChange(updateBusiness(draft, { website: v }))} required /></Field>
      <Field label="Latitud"><Input value={draft.business.latitude} onChange={(v) => onChange(updateBusiness(draft, { latitude: v }))} /></Field>
      <Field label="Longitud"><Input value={draft.business.longitude} onChange={(v) => onChange(updateBusiness(draft, { longitude: v }))} /></Field>
    </div>
  );

  const renderListing = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Título de la ficha" required full>
        <Input value={draft.listing.listingTitle} onChange={(v) => onChange(updateListing(draft, { listingTitle: v }))} required maxLength={120} />
        <div className="text-[8px] text-gray-500 text-right mt-1">{draft.listing.listingTitle.length}/120</div>
      </Field>
      <Field label="Descripción corta" required full>
        <Textarea value={draft.listing.shortDescription} onChange={(v) => onChange(updateListing(draft, { shortDescription: v }))} required maxLength={160} />
        <div className="text-[8px] text-gray-500 text-right mt-1">{draft.listing.shortDescription.length}/160</div>
      </Field>
      <Field label="Descripción completa" required full>
        <Textarea value={draft.listing.description} onChange={(v) => onChange(updateListing(draft, { description: v }))} required maxLength={10000} />
        <div className="text-[8px] text-gray-500 text-right mt-1">{draft.listing.description.length}/10000</div>
      </Field>
      <Field label="Palabras clave" full>
        <Input value={draft.listing.keywords} onChange={(v) => onChange(updateListing(draft, { keywords: v }))} />
        <p className="text-[8px] text-gray-500 mt-1 leading-tight">Separar por comas. Evitar repeticiones artificiales.</p>
      </Field>
      <Field label="Organización"><Input value={draft.listing.organization} onChange={(v) => onChange(updateListing(draft, { organization: v }))} /></Field>
      <Field label="Plan a seleccionar"><Select value={draft.listing.plan} options={plans} onChange={(v) => onChange(updateListing(draft, { plan: v }))} /></Field>
      <Field label="Opciones" full>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Check label="Incluir perfil con la ficha" description="Usar logo, foto y descripción del perfil cuando el directorio lo permita." checked={draft.listing.includeProfile} onChange={(v) => onChange(updateListing(draft, { includeProfile: v }))} />
          <Check label="Abierto los domingos" description="Marca rápida utilizada por varios formularios." checked={draft.listing.openSundays} onChange={(v) => onChange(updateListing(draft, { openSundays: v }))} />
          <Check label="Descuento militar" description="Característica opcional." checked={draft.listing.militaryDiscount} onChange={(v) => onChange(updateListing(draft, { militaryDiscount: v }))} />
          <Check label="Descuento tercera edad" description="Característica opcional." checked={draft.listing.seniorDiscount} onChange={(v) => onChange(updateListing(draft, { seniorDiscount: v }))} />
          <Check label="Descuento estudiantil" description="Característica opcional." checked={draft.listing.studentDiscount} onChange={(v) => onChange(updateListing(draft, { studentDiscount: v }))} />
        </div>
      </Field>
    </div>
  );

  const renderHours = () => (
    <div className="space-y-2">
      {CITATION_DAYS.map((day) => (
        <div key={day} className="grid grid-cols-[90px_1fr_1fr_auto] gap-2 items-center">
          <div className="text-[10px] font-black text-[#333]">{day}</div>
          <input
            type="time"
            value={draft.hours[day].open}
            onChange={(e) => onChange(updateHours(draft, day, { open: e.target.value }))}
            disabled={draft.hours[day].closed}
            className="border border-gray-200 rounded-lg px-2 py-2 text-[9px] disabled:opacity-50"
          />
          <input
            type="time"
            value={draft.hours[day].close}
            onChange={(e) => onChange(updateHours(draft, day, { close: e.target.value }))}
            disabled={draft.hours[day].closed}
            className="border border-gray-200 rounded-lg px-2 py-2 text-[9px] disabled:opacity-50"
          />
          <label className="text-[9px] font-semibold text-gray-600 flex items-center gap-1 whitespace-nowrap">
            <input
              type="checkbox"
              checked={draft.hours[day].closed}
              onChange={(e) => onChange(updateHours(draft, day, { closed: e.target.checked }))}
              className="accent-[#D32323]"
            />
            Cerrado
          </label>
        </div>
      ))}
    </div>
  );

  const renderSocial = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Facebook"><Input type="url" placeholder="https://" value={draft.social.facebook} onChange={(v) => onChange(updateSocial(draft, { facebook: v }))} /></Field>
      <Field label="LinkedIn"><Input type="url" placeholder="https://" value={draft.social.linkedin} onChange={(v) => onChange(updateSocial(draft, { linkedin: v }))} /></Field>
      <Field label="X / Twitter"><Input type="url" placeholder="https://" value={draft.social.twitter} onChange={(v) => onChange(updateSocial(draft, { twitter: v }))} /></Field>
      <Field label="Instagram"><Input type="url" placeholder="https://" value={draft.social.instagram} onChange={(v) => onChange(updateSocial(draft, { instagram: v }))} /></Field>
      <Field label="URL del logo"><Input type="url" placeholder="https://" value={draft.social.logoUrl} onChange={(v) => onChange(updateSocial(draft, { logoUrl: v }))} /></Field>
      <Field label="URL de foto principal"><Input type="url" placeholder="https://" value={draft.social.photoUrl} onChange={(v) => onChange(updateSocial(draft, { photoUrl: v }))} /></Field>
      <Field label="Título del PDF"><Input value={draft.social.attachmentTitle} onChange={(v) => onChange(updateSocial(draft, { attachmentTitle: v }))} /></Field>
      <Field label="URL del PDF"><Input type="url" placeholder="https://" value={draft.social.attachmentUrl} onChange={(v) => onChange(updateSocial(draft, { attachmentUrl: v }))} /></Field>
    </div>
  );

  const renderReview = () => {
    const required = [
      draft.profile.firstName, draft.profile.lastName, draft.profile.accountEmail, draft.profile.username, draft.profile.password,
      draft.business.businessName, draft.business.address1, draft.business.phone, draft.business.publicEmail, draft.business.website,
      draft.listing.listingTitle, draft.listing.description,
    ];
    const napOk = Boolean(draft.business.businessName && draft.business.address1 && draft.business.phone);
    const credentialsOk = Boolean(draft.profile.accountEmail && draft.profile.username && draft.profile.password);
    const listingOk = Boolean(draft.listing.listingTitle && draft.listing.description);
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-gray-200 rounded-xl bg-gray-50 p-3">
          <h4 className="text-[10px] font-black text-[#333] mb-2">Validación</h4>
          <ReviewLine label="Campos obligatorios" value={required.filter(Boolean).length === required.length ? 'Completos' : `${required.filter(Boolean).length}/${required.length} completos`} ok={required.filter(Boolean).length === required.length} />
          <ReviewLine label="Consistencia NAP" value={napOk ? 'Lista para revisar' : 'Pendiente'} ok={napOk} />
          <ReviewLine label="Credenciales" value={credentialsOk ? 'Completas' : 'Pendientes'} ok={credentialsOk} />
          <ReviewLine label="Ficha pública" value={listingOk ? 'Completa' : 'Pendiente'} ok={listingOk} />
        </div>
        <div className="border border-gray-200 rounded-xl bg-gray-50 p-3">
          <h4 className="text-[10px] font-black text-[#333] mb-2">Resumen operativo</h4>
          <ReviewLine label="Negocio" value={draft.business.businessName || 'Sin completar'} ok={Boolean(draft.business.businessName)} />
          <ReviewLine label="Plan seleccionado" value={draft.listing.plan} ok />
          <ReviewLine label="Directorios incluidos" value="20" ok />
        </div>
      </div>
    );
  };

  const panels: Record<CitationStepKey, React.ReactNode> = {
    account: renderAccount(),
    business: renderBusiness(),
    listing: renderListing(),
    hours: renderHours(),
    social: renderSocial(),
    review: renderReview(),
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-black text-[#333]">Registro general de citaciones</h2>
          <p className="text-[10px] text-gray-500 mt-1">Los datos se guardan en este navegador. No se realizan solicitudes de red ni automatizaciones.</p>
        </div>
      </div>

      <div className="flex gap-1.5 p-3 border-b border-gray-200 overflow-auto">
        {CITATION_FORM_STEPS.map((step) => (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepChange(step.key)}
            className={`whitespace-nowrap border rounded-full px-3 py-2 text-[9px] font-black transition-colors ${
              activeStep === step.key
                ? 'bg-[#D32323] border-[#D32323] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      <div className="p-4">{panels[activeStep]}</div>
    </div>
  );
}

function ReviewLine({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-200 last:border-0 text-[9px]">
      <span className="text-gray-600">{label}</span>
      <strong className={ok ? 'text-emerald-600' : 'text-amber-600'}>{value}</strong>
    </div>
  );
}

