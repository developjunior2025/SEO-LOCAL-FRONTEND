/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRoundSearch,
} from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import {
  Empty,
  ErrorBox,
  Kpi,
  Loading,
  Modal,
  PageHead,
  Panel,
  Status,
  SuccessBox,
  formatDate,
  text,
} from './UtilidadesCommon';

const STATUS_OPTIONS = [
  ['new', 'Nuevo'],
  ['contacted', 'Contactado'],
  ['qualified', 'Calificado'],
  ['converted', 'Convertido'],
  ['discarded', 'Descartado'],
] as const;

export default function UtilidadesProspectsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load(search = query) {
    setLoading(true);
    try {
      const [prospects, locationResponse] = await Promise.all([
        utilidadesV15Api.prospects({ search: search || undefined, limit: 100 }),
        utilidadesV15Api.locations({ limit: 100, sort: 'name', order: 'ASC' }),
      ]);
      setItems(prospects.items);
      setLocations(locationResponse.items);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los prospectos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load('');
  }, []);

  const locationNames = useMemo(
    () => new Map(locations.map((location) => [Number(location.id), text(location.name)])),
    [locations],
  );

  const filtered = useMemo(
    () => (status ? items.filter((item) => String(item.status ?? '') === status) : items),
    [items, status],
  );

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setLoading(true);
    setSuccess(null);
    try {
      await utilidadesV15Api.createProspect(form);
      setForm(null);
      setSuccess('Prospecto registrado y vinculado al seguimiento comercial.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear el prospecto.');
      setLoading(false);
    }
  }

  async function submitUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editing?.id) return;
    setLoading(true);
    setSuccess(null);
    try {
      await utilidadesV15Api.updateProspect(Number(editing.id), {
        name: editing.name,
        email: editing.email || undefined,
        phone: editing.phone || undefined,
        locationId: editing.locationId || undefined,
        source: editing.source || undefined,
        notes: editing.notes || undefined,
        status: editing.status,
      });
      setEditing(null);
      setSuccess('El prospecto fue actualizado.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar el prospecto.');
      setLoading(false);
    }
  }

  function newProspect() {
    setForm({
      name: '',
      email: '',
      phone: '',
      source: 'utilidades',
      notes: '',
      locationId: '',
    });
  }

  return (
    <>
      <PageHead
        eyebrow="Gestión comercial"
        title="Generador de Prospectos"
        subtitle="Registra oportunidades reales, asígnalas a una ubicación y mantén el estado comercial conectado con seo_lead cuando exista correo."
      >
        <button className="util-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} /> Actualizar
        </button>
        <button className="util-btn primary" onClick={newProspect}>
          <Plus size={14} /> Nuevo prospecto
        </button>
      </PageHead>

      <ErrorBox message={error} onRetry={() => void load()} />
      <SuccessBox message={success} />

      <div className="util-kpis">
        <Kpi label="Prospectos" value={items.length} icon={<UserRoundSearch size={18} />} />
        <Kpi
          label="Nuevos"
          value={items.filter((item) => item.status === 'new').length}
          tone="info"
        />
        <Kpi
          label="Calificados"
          value={items.filter((item) => item.status === 'qualified').length}
          tone="success"
        />
        <Kpi
          label="Vinculados a lead"
          value={items.filter((item) => Boolean(item.leadId)).length}
          icon={<CheckCircle2 size={18} />}
          helper="Registro comercial real"
        />
      </div>

      <Panel title="Prospectos y oportunidades" subtitle="Busca en el backend y filtra por etapa comercial.">
        <form
          className="util-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre o correo"
            aria-label="Buscar prospectos"
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="util-btn primary" type="submit">Buscar</button>
        </form>

        {filtered.length ? (
          <div className="util-table-wrap">
            <table className="util-table">
              <thead>
                <tr>
                  <th>Prospecto</th>
                  <th>Contacto</th>
                  <th>Ubicación</th>
                  <th>Fuente</th>
                  <th>Estado</th>
                  <th>Lead</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={Number(item.id)}>
                    <td>
                      <strong>{text(item.name)}</strong>
                      <div className="util-table-sub">Creado {formatDate(item.createdAt)}</div>
                    </td>
                    <td>
                      <div className="util-table-sub"><Mail size={12} /> {text(item.email, 'Sin correo')}</div>
                      <div className="util-table-sub"><Phone size={12} /> {text(item.phone, 'Sin teléfono')}</div>
                    </td>
                    <td>
                      {item.locationId ? (
                        <span className="util-pill"><MapPin size={12} /> {locationNames.get(Number(item.locationId)) ?? `Ubicación ${item.locationId}`}</span>
                      ) : (
                        'Sin ubicación'
                      )}
                    </td>
                    <td>{text(item.source, 'Utilidades')}</td>
                    <td><Status value={item.status} /></td>
                    <td>{item.leadId ? `#${text(item.leadId)}` : 'No vinculado'}</td>
                    <td>
                      <button className="util-btn" onClick={() => setEditing({ ...item })}>
                        <Pencil size={13} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={items.length ? 'Sin coincidencias' : 'No hay prospectos'}
            text={items.length ? 'Cambia el filtro de estado.' : 'Registra la primera oportunidad para iniciar su seguimiento.'}
            action={!items.length ? <button className="util-btn primary" onClick={newProspect}><Plus size={14} /> Crear prospecto</button> : undefined}
          />
        )}
      </Panel>

      {form ? (
        <ProspectModal
          title="Nuevo prospecto"
          form={form}
          locations={locations}
          onChange={setForm}
          onClose={() => setForm(null)}
          onSubmit={submitCreate}
          loading={loading}
          includeStatus={false}
        />
      ) : null}

      {editing ? (
        <ProspectModal
          title="Editar prospecto"
          form={editing}
          locations={locations}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSubmit={submitUpdate}
          loading={loading}
          includeStatus
        />
      ) : null}

      <Loading show={loading} />
    </>
  );
}

function ProspectModal({
  title,
  form,
  locations,
  onChange,
  onClose,
  onSubmit,
  loading,
  includeStatus,
}: {
  title: string;
  form: Row;
  locations: Row[];
  onChange: (row: Row) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  loading: boolean;
  includeStatus: boolean;
}) {
  const formId = includeStatus ? 'prospect-edit-form' : 'prospect-create-form';
  return (
    <Modal
      title={title}
      subtitle="El correo es opcional; cuando existe, el backend crea o conserva el vínculo comercial."
      onClose={onClose}
      footer={
        <>
          <button className="util-btn" onClick={onClose}>Cancelar</button>
          <button className="util-btn primary" form={formId} disabled={loading}>Guardar</button>
        </>
      }
      wide
    >
      <form id={formId} onSubmit={onSubmit} className="util-formgrid">
        <div className="util-field">
          <label>Nombre</label>
          <input required value={String(form.name ?? '')} onChange={(event) => onChange({ ...form, name: event.target.value })} />
        </div>
        <div className="util-field">
          <label>Correo</label>
          <input type="email" value={String(form.email ?? '')} onChange={(event) => onChange({ ...form, email: event.target.value })} />
        </div>
        <div className="util-field">
          <label>Teléfono</label>
          <input value={String(form.phone ?? '')} onChange={(event) => onChange({ ...form, phone: event.target.value })} />
        </div>
        <div className="util-field">
          <label>Ubicación relacionada</label>
          <select
            value={String(form.locationId ?? '')}
            onChange={(event) => onChange({ ...form, locationId: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">Sin ubicación</option>
            {locations.map((location) => (
              <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>
            ))}
          </select>
        </div>
        <div className="util-field">
          <label>Fuente</label>
          <input value={String(form.source ?? 'utilidades')} onChange={(event) => onChange({ ...form, source: event.target.value })} />
        </div>
        {includeStatus ? (
          <div className="util-field">
            <label>Estado comercial</label>
            <select value={String(form.status ?? 'new')} onChange={(event) => onChange({ ...form, status: event.target.value })}>
              {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        ) : null}
        <div className="util-field util-wide">
          <label>Necesidad detectada</label>
          <textarea value={String(form.notes ?? '')} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
