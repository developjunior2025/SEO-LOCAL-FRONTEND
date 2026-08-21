/* eslint-disable react-hooks/set-state-in-effect */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
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
  text,
} from './UtilidadesCommon';

export default function UtilidadesWhiteLabelPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [profiles, clientResponse] = await Promise.all([
        utilidadesV15Api.whiteLabels(),
        utilidadesV15Api.clients({ limit: 100 }),
      ]);
      setItems(profiles.items);
      setClients(clientResponse.items);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar Marca Blanca.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const clientNames = useMemo(
    () => new Map(clients.map((client) => [Number(client.id), text(client.company_name ?? client.display_name ?? client.email)])),
    [clients],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setLoading(true);
    setSuccess(null);
    try {
      await utilidadesV15Api.upsertWhiteLabel(form);
      setForm(null);
      setSuccess('La identidad de marca quedó guardada para el cliente.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el perfil.');
      setLoading(false);
    }
  }

  function createProfile() {
    setForm({
      clientId: clients[0]?.id ?? '',
      brandName: '',
      primaryColor: '#D32323',
      logoUrl: '',
      faviconUrl: '',
      domain: '',
    });
  }

  return (
    <>
      <PageHead
        eyebrow="Presentación al cliente"
        title="Marca Blanca"
        subtitle="Define la identidad visual que se usará en entregables y portales del cliente. No se muestran imágenes vacías ni logos inventados."
      >
        <button className="util-btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} /> Actualizar
        </button>
        <button className="util-btn primary" onClick={createProfile} disabled={!clients.length}>
          <Plus size={14} /> Configurar marca
        </button>
      </PageHead>

      <ErrorBox message={error} onRetry={() => void load()} />
      <SuccessBox message={success} />

      <div className="util-kpis">
        <Kpi label="Perfiles configurados" value={items.length} icon={<Palette size={18} />} />
        <Kpi
          label="Clientes disponibles"
          value={clients.length}
          icon={<ShieldCheck size={18} />}
        />
        <Kpi
          label="Dominios definidos"
          value={items.filter((item) => Boolean(item.domain)).length}
          icon={<Globe2 size={18} />}
        />
        <Kpi
          label="Logos definidos"
          value={items.filter((item) => Boolean(item.logoUrl)).length}
          icon={<ImageIcon size={18} />}
        />
      </div>

      {!clients.length ? (
        <Panel title="No hay clientes disponibles">
          <Empty
            title="Sin clientes dentro del alcance"
            text="Marca Blanca solo puede configurarse para clientes reales visibles por el usuario Utilidades."
          />
        </Panel>
      ) : null}

      <Panel title="Identidades configuradas" subtitle="Cada cliente mantiene un único perfil actualizable.">
        {items.length ? (
          <div className="util-grid2">
            {items.map((item) => (
              <article className="util-card util-brand-preview" key={Number(item.id)}>
                <div className="util-brand-preview-head">
                  <div
                    className="util-brand-mark"
                    style={{ background: String(item.primaryColor ?? '#D32323') }}
                  >
                    {String(item.brandName ?? 'M').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <strong>{text(item.brandName)}</strong>
                    <span>{clientNames.get(Number(item.clientId)) ?? `Cliente ${text(item.clientId)}`}</span>
                  </div>
                  <Status value={item.active ? 'Activo' : 'Inactivo'} />
                </div>

                <div className="util-preview-grid">
                  <div className="util-preview-metric">
                    <span>Color principal</span>
                    <strong>
                      <i className="util-color-swatch" style={{ background: String(item.primaryColor ?? '#D32323') }} />
                      {text(item.primaryColor)}
                    </strong>
                  </div>
                  <div className="util-preview-metric">
                    <span>Dominio</span>
                    <strong>{text(item.domain, 'No configurado')}</strong>
                  </div>
                </div>

                <div className="util-actions">
                  {item.logoUrl ? (
                    <a className="util-btn" href={String(item.logoUrl)} target="_blank" rel="noreferrer">
                      <ExternalLink size={13} /> Ver logo
                    </a>
                  ) : (
                    <span className="util-pill">Logo no configurado</span>
                  )}
                  <button className="util-btn primary" onClick={() => setForm({ ...item })}>
                    <Pencil size={13} /> Editar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No hay perfiles de Marca Blanca"
            text="Configura el primero utilizando un cliente real del proyecto."
            action={clients.length ? <button className="util-btn primary" onClick={createProfile}><Plus size={14} /> Configurar</button> : undefined}
          />
        )}
      </Panel>

      <Panel title="Uso de recursos externos">
        <div className="util-notice">
          <strong>URLs verificables.</strong>
          <span>El sistema guarda enlaces de logo y favicon; no genera imágenes vacías. Una URL inexistente queda identificada como no configurada.</span>
        </div>
      </Panel>

      {form ? (
        <Modal
          title="Perfil de Marca Blanca"
          subtitle="Asocia una identidad a un cliente real."
          onClose={() => setForm(null)}
          footer={
            <>
              <button className="util-btn" onClick={() => setForm(null)}>Cancelar</button>
              <button className="util-btn primary" form="white-label-form" disabled={loading}>Guardar perfil</button>
            </>
          }
          wide
        >
          <form id="white-label-form" onSubmit={submit} className="util-formgrid">
            <div className="util-field">
              <label>Cliente</label>
              <select
                required
                value={String(form.clientId ?? '')}
                onChange={(event) => setForm({ ...form, clientId: Number(event.target.value) })}
              >
                <option value="" disabled>Selecciona un cliente</option>
                {clients.map((client) => (
                  <option key={Number(client.id)} value={Number(client.id)}>
                    {text(client.company_name ?? client.display_name ?? client.email)}
                  </option>
                ))}
              </select>
            </div>
            <div className="util-field">
              <label>Nombre de marca</label>
              <input required value={String(form.brandName ?? '')} onChange={(event) => setForm({ ...form, brandName: event.target.value })} />
            </div>
            <div className="util-field">
              <label>Color principal</label>
              <div className="util-toolbar" style={{ margin: 0 }}>
                <input type="color" value={String(form.primaryColor ?? '#D32323')} onChange={(event) => setForm({ ...form, primaryColor: event.target.value })} />
                <input value={String(form.primaryColor ?? '#D32323')} onChange={(event) => setForm({ ...form, primaryColor: event.target.value })} />
              </div>
            </div>
            <div className="util-field">
              <label>Dominio</label>
              <input value={String(form.domain ?? '')} onChange={(event) => setForm({ ...form, domain: event.target.value })} placeholder="panel.cliente.com" />
            </div>
            <div className="util-field util-wide">
              <label>URL del logo</label>
              <input type="url" value={String(form.logoUrl ?? '')} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} placeholder="https://.../logo.svg" />
            </div>
            <div className="util-field util-wide">
              <label>URL del favicon</label>
              <input type="url" value={String(form.faviconUrl ?? '')} onChange={(event) => setForm({ ...form, faviconUrl: event.target.value })} placeholder="https://.../favicon.ico" />
            </div>
          </form>
        </Modal>
      ) : null}

      <Loading show={loading} />
    </>
  );
}
