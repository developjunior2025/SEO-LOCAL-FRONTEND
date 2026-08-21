/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Download,
  Globe2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import {
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHead,
  Panel,
  Status,
  SuccessBox,
  text,
} from './UtilidadesCommon';

const blank: Row = {
  name: '',
  reference: '',
  city: '',
  countryCode: 'VE',
  address: '',
  phone: '',
  websiteUrl: '',
  primaryKeyword: '',
  primaryCategory: '',
  gbpPlaceId: '',
  ga4PropertyId: '',
  gscPropertyUrl: '',
  notes: '',
  active: true,
};

const countries = [
  ['VE', 'Venezuela'],
  ['CO', 'Colombia'],
  ['US', 'Estados Unidos'],
  ['MX', 'México'],
  ['AR', 'Argentina'],
  ['CL', 'Chile'],
  ['PE', 'Perú'],
  ['ES', 'España'],
];

export default function UtilidadesLocationsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Row>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);
  const [form, setForm] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [locationsResponse, clientsResponse] = await Promise.all([
        utilidadesV15Api.locations({
          search: query,
          status,
          page,
          limit: 20,
          sort,
          order,
        }),
        utilidadesV15Api.clients({ limit: 100 }),
      ]);
      setItems(locationsResponse.items);
      setMeta((locationsResponse.meta ?? {}) as Row);
      setClients(clientsResponse.items);
      setSelected((current) => {
        if (current) {
          return (
            locationsResponse.items.find((item) => item.id === current.id) ??
            locationsResponse.items[0] ??
            null
          );
        }
        return locationsResponse.items[0] ?? null;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar las ubicaciones.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [page, status, sort, order]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (form.id) {
        await utilidadesV15Api.updateLocation(Number(form.id), form);
        setSuccess('Ubicación actualizada correctamente.');
      } else {
        await utilidadesV15Api.createLocation(form);
        setSuccess('Ubicación creada y asignada al alcance del usuario.');
      }
      setForm(null);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo guardar la ubicación.'
      );
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const columns = [
      'id',
      'name',
      'reference',
      'city',
      'countryCode',
      'address',
      'phone',
      'websiteUrl',
      'primaryKeyword',
      'primaryCategory',
      'clientName',
    ];
    const lines = [
      columns.join(','),
      ...items.map((item) =>
        columns
          .map((column) => `"${String(item[column] ?? '').replaceAll('"', '""')}"`)
          .join(',')
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(['\ufeff', lines.join('\n')], {
        type: 'text/csv;charset=utf-8',
      })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ubicaciones-utilidades.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) => Number(client.id) === Number(selected?.clientProfileId)
      ),
    [clients, selected]
  );

  const currentPage = Number(meta.page ?? page);
  const totalPages = Number(meta.pages ?? 1);
  const total = Number(meta.total ?? items.length);

  return (
    <>
      <PageHead
        eyebrow="Cartera"
        title="Todas las ubicaciones"
        subtitle="Administra el NAP, conexiones, cliente, palabra clave principal y expediente operativo de cada sede."
      >
        <button className="util-btn subtle" onClick={exportCsv} disabled={!items.length}>
          <Download size={15} />
          Exportar CSV
        </button>
        <button className="util-btn primary" onClick={() => setForm({ ...blank })}>
          <Plus size={15} />
          Añadir ubicación
        </button>
      </PageHead>

      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />

      <div className="util-master">
        <div>
          <div className="util-toolbar">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(1);
                  void load();
                }
              }}
              placeholder="Buscar por nombre, ciudad o referencia"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
            <span className="grow" />
            <SlidersHorizontal size={15} />
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Ordenar por nombre</option>
              <option value="city">Ordenar por ciudad</option>
              <option value="createdAt">Más recientes</option>
            </select>
            <select value={order} onChange={(event) => setOrder(event.target.value)}>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
            <button className="util-icon-btn" onClick={load} aria-label="Actualizar">
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="util-table-wrap">
            <table className="util-table">
              <thead>
                <tr>
                  <th>Ubicación</th>
                  <th>Ciudad</th>
                  <th>Cliente</th>
                  <th>Conexiones</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const connections = [
                    item.gbpPlaceId,
                    item.ga4PropertyId,
                    item.gscPropertyUrl,
                  ].filter(Boolean).length;
                  return (
                    <tr key={Number(item.id)} onClick={() => setSelected(item)}>
                      <td>
                        <button className="util-link">{text(item.name)}</button>
                        <span className="util-table-sub">
                          {text(item.reference)} · {text(item.primaryKeyword, 'Sin keyword')}
                        </span>
                      </td>
                      <td>
                        {text(item.city)}
                        <span className="util-table-sub">{text(item.countryCode)}</span>
                      </td>
                      <td>{text(item.clientName ?? item.clientProfileId, 'Sin cliente')}</td>
                      <td>
                        <Status value={`${connections}/3 conectadas`} />
                      </td>
                      <td>
                        <Status value={item.active ? 'Activa' : 'Inactiva'} />
                      </td>
                      <td>
                        <div className="util-actions">
                          <button
                            className="util-btn subtle"
                            onClick={(event) => {
                              event.stopPropagation();
                              setForm({ ...item });
                            }}
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <button
                            className="util-btn primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/utilidades/ubicaciones/${item.id}/resumen`);
                            }}
                          >
                            Abrir expediente
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!items.length ? (
              <Empty
                title="No hay ubicaciones en este filtro"
                text="Añade una sede o cambia los filtros para comenzar a operar informes y campañas."
                action={
                  <button
                    className="util-btn primary"
                    onClick={() => setForm({ ...blank })}
                  >
                    <Plus size={14} />
                    Añadir ubicación
                  </button>
                }
              />
            ) : null}
          </div>

          <div className="util-pagination">
            <span>
              {total} registro{total === 1 ? '' : 's'} · página {currentPage} de {totalPages}
            </span>
            <button
              className="util-btn subtle"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Anterior
            </button>
            <button
              className="util-btn subtle"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>

        {selected ? (
          <aside className="util-preview">
            <Panel title="Vista rápida" subtitle="Datos operativos de la sede seleccionada.">
              <h3 className="util-preview-title">{text(selected.name)}</h3>
              <p className="util-preview-meta">
                <MapPin size={12} /> {text(selected.address, 'Dirección pendiente')} ·{' '}
                {text(selected.city)}
              </p>

              <div className="util-preview-grid">
                <div className="util-preview-metric">
                  <span>Cliente</span>
                  <strong>
                    {text(
                      selected.clientName ??
                        selectedClient?.company_name ??
                        selectedClient?.display_name,
                      'Sin asignar'
                    )}
                  </strong>
                </div>
                <div className="util-preview-metric">
                  <span>Keyword</span>
                  <strong>{text(selected.primaryKeyword, 'Sin configurar')}</strong>
                </div>
                <div className="util-preview-metric">
                  <span>Categoría</span>
                  <strong>{text(selected.primaryCategory, 'Sin configurar')}</strong>
                </div>
                <div className="util-preview-metric">
                  <span>Sitio web</span>
                  <strong>{text(selected.websiteUrl, 'Sin configurar')}</strong>
                </div>
              </div>

              <div className="util-setup-list" style={{ marginTop: 12 }}>
                {[
                  ['Google Business Profile', Boolean(selected.gbpPlaceId)],
                  ['Google Analytics 4', Boolean(selected.ga4PropertyId)],
                  ['Search Console', Boolean(selected.gscPropertyUrl)],
                ].map(([label, complete]) => (
                  <div
                    className={`util-setup-item ${complete ? 'complete' : ''}`}
                    key={String(label)}
                  >
                    <span className="util-setup-check">
                      {label === 'Google Business Profile' ? (
                        <Building2 size={15} />
                      ) : (
                        <Globe2 size={15} />
                      )}
                    </span>
                    <div>
                      <strong>{label}</strong>
                      <span>{complete ? 'Configurado' : 'No configurado'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="util-actions" style={{ marginTop: 12 }}>
                <button className="util-btn subtle" onClick={() => setForm({ ...selected })}>
                  <Pencil size={14} />
                  Editar
                </button>
                <button
                  className="util-btn primary"
                  onClick={() =>
                    navigate(`/utilidades/ubicaciones/${selected.id}/resumen`)
                  }
                >
                  Abrir expediente
                </button>
              </div>
            </Panel>
          </aside>
        ) : null}
      </div>

      {form ? (
        <Modal
          title={form.id ? 'Editar ubicación' : 'Nueva ubicación'}
          subtitle="Los datos se guardan en PostgreSQL y se respetan los permisos de alcance."
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="util-btn subtle" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button className="util-btn primary" form="location-form">
                Guardar ubicación
              </button>
            </>
          }
          wide
        >
          <form id="location-form" onSubmit={submit} className="util-formgrid">
            <div className="util-field">
              <label>Nombre *</label>
              <input
                required
                value={String(form.name ?? '')}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="util-field">
              <label>Referencia interna</label>
              <input
                value={String(form.reference ?? '')}
                onChange={(event) =>
                  setForm({ ...form, reference: event.target.value })
                }
                placeholder="Ej. UTIL-CCS-001"
              />
            </div>
            <div className="util-field">
              <label>Cliente</label>
              <select
                value={String(form.clientProfileId ?? '')}
                onChange={(event) =>
                  setForm({
                    ...form,
                    clientProfileId: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  })
                }
              >
                <option value="">Sin cliente asignado</option>
                {clients.map((client) => (
                  <option key={Number(client.id)} value={Number(client.id)}>
                    {text(client.company_name ?? client.display_name ?? client.email)}
                  </option>
                ))}
              </select>
            </div>
            <div className="util-field">
              <label>Estado</label>
              <select
                value={form.active === false ? 'inactive' : 'active'}
                onChange={(event) =>
                  setForm({ ...form, active: event.target.value === 'active' })
                }
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </div>
            <div className="util-field">
              <label>Ciudad</label>
              <input
                value={String(form.city ?? '')}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </div>
            <div className="util-field">
              <label>País</label>
              <select
                value={String(form.countryCode ?? 'VE')}
                onChange={(event) =>
                  setForm({ ...form, countryCode: event.target.value })
                }
              >
                {countries.map(([code, label]) => (
                  <option value={code} key={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="util-field util-wide">
              <label>Dirección</label>
              <input
                value={String(form.address ?? '')}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
              />
            </div>
            <div className="util-field">
              <label>Teléfono</label>
              <input
                value={String(form.phone ?? '')}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="util-field">
              <label>Sitio web</label>
              <input
                type="url"
                value={String(form.websiteUrl ?? '')}
                onChange={(event) =>
                  setForm({ ...form, websiteUrl: event.target.value })
                }
                placeholder="https://"
              />
            </div>
            <div className="util-field">
              <label>Palabra clave principal</label>
              <input
                value={String(form.primaryKeyword ?? '')}
                onChange={(event) =>
                  setForm({ ...form, primaryKeyword: event.target.value })
                }
              />
            </div>
            <div className="util-field">
              <label>Categoría principal</label>
              <input
                value={String(form.primaryCategory ?? '')}
                onChange={(event) =>
                  setForm({ ...form, primaryCategory: event.target.value })
                }
              />
            </div>
            <div className="util-field">
              <label>GBP Place ID</label>
              <input
                value={String(form.gbpPlaceId ?? '')}
                onChange={(event) =>
                  setForm({ ...form, gbpPlaceId: event.target.value })
                }
              />
              <small>Activa auditoría GBP y publicaciones.</small>
            </div>
            <div className="util-field">
              <label>GA4 Property ID</label>
              <input
                value={String(form.ga4PropertyId ?? '')}
                onChange={(event) =>
                  setForm({ ...form, ga4PropertyId: event.target.value })
                }
              />
              <small>Solo se usarán datos reales cuando exista un adaptador configurado.</small>
            </div>
            <div className="util-field util-wide">
              <label>GSC Property URL</label>
              <input
                value={String(form.gscPropertyUrl ?? '')}
                onChange={(event) =>
                  setForm({ ...form, gscPropertyUrl: event.target.value })
                }
              />
            </div>
            <div className="util-field util-wide">
              <label>Notas operativas</label>
              <textarea
                value={String(form.notes ?? '')}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
          </form>
        </Modal>
      ) : null}

      <Loading show={loading} />
    </>
  );
}
