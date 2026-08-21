/* eslint-disable react-hooks/set-state-in-effect */
import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, Plus, RefreshCw, Send } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Loading, Modal, PageHead, Status, SuccessBox, formatDate, text } from './UtilidadesCommon';

export default function UtilidadesGbpPostsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [integrations, setIntegrations] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row | null>(null);
  const [statusDraft, setStatusDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [posts, locationRows, integrationRows] = await Promise.all([
        utilidadesV15Api.gbpPosts({ limit: 100 }),
        utilidadesV15Api.locations({ limit: 100 }),
        utilidadesV15Api.integrations({ limit: 100 }),
      ]);
      setItems(posts.items);
      setLocations(locationRows.items);
      setIntegrations(integrationRows.items.filter((row) => row.provider === 'gbp'));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las publicaciones GBP.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function modeFor(locationId: unknown) {
    return integrations.find((row) => Number(row.locationId) === Number(locationId));
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setLoading(true);
    try {
      await utilidadesV15Api.createGbpPost({
        ...draft,
        locationId: Number(draft.locationId),
        scheduledAt: draft.scheduledAt || undefined,
        ctaUrl: draft.ctaUrl || undefined,
      });
      setDraft(null);
      setSuccess('Borrador creado. El estado publicado solo se habilita con una referencia real o un webhook conectado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la publicación.');
      setLoading(false);
    }
  }

  async function update(event: FormEvent) {
    event.preventDefault();
    if (!statusDraft) return;
    setLoading(true);
    try {
      await utilidadesV15Api.updateGbpPost(Number(statusDraft.id), {
        status: statusDraft.nextStatus,
        scheduledAt: statusDraft.scheduledAt || undefined,
        externalReference: statusDraft.externalReference || undefined,
        lastError: statusDraft.lastError || undefined,
      });
      setStatusDraft(null);
      setSuccess('Estado GBP actualizado y auditado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la publicación.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Google Business Profile"
        title="Publicaciones GBP"
        subtitle="Borradores, programación, publicación manual verificable y envío mediante adaptador webhook."
      >
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
        <button className="util-btn primary" onClick={() => setDraft({ locationId: locations[0]?.id ?? '', title: '', content: '', ctaLabel: 'Más información' })}><Plus size={14} />Nueva publicación</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />
      <div className="util-notice">
        Una publicación solo queda en <b>published</b> cuando se registra una URL/referencia real en modo manual o el webhook GBP devuelve una referencia externa. No se simula una publicación en Google.
      </div>
      <div className="util-table-wrap">
        <table className="util-table">
          <thead><tr><th>Publicación</th><th>Ubicación</th><th>Modo</th><th>Estado</th><th>Programada / publicada</th><th>Referencia</th><th /></tr></thead>
          <tbody>
            {items.map((item) => {
              const integration = modeFor(item.locationId);
              return (
                <tr key={Number(item.id)}>
                  <td><b>{text(item.title)}</b><div className="util-muted">{text(item.content)}</div></td>
                  <td>{text(item.locationName ?? item.locationId)}</td>
                  <td><Status value={item.providerMode ?? integration?.mode ?? 'manual'} /></td>
                  <td><Status value={item.status} /></td>
                  <td>{formatDate(item.publishedAt || item.scheduledAt)}</td>
                  <td>{item.externalReference ? <a href={String(item.externalReference)} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Abrir</a> : text(item.lastError)}</td>
                  <td><button className="util-btn primary" onClick={() => setStatusDraft({ ...item, nextStatus: item.status, integrationMode: integration?.mode ?? 'manual' })}><Send size={13} />Gestionar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length ? <Empty title="Sin publicaciones" text="Crea un borrador para una ubicación con Place ID configurado." /> : null}
      </div>

      {draft ? (
        <Modal title="Nueva publicación GBP" subtitle="El contenido se almacena en PostgreSQL y conserva su trazabilidad." onClose={() => setDraft(null)} footer={<button className="util-btn primary" form="gbp-create-form">Guardar</button>} wide>
          <form id="gbp-create-form" className="util-formgrid" onSubmit={create}>
            <div className="util-field util-wide"><label>Ubicación</label><select required value={String(draft.locationId ?? '')} onChange={(e) => setDraft({ ...draft, locationId: Number(e.target.value) })}><option value="">Seleccione…</option>{locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)} {location.gbpPlaceId ? '' : '· falta Place ID'}</option>)}</select></div>
            <div className="util-field util-wide"><label>Título</label><input required value={String(draft.title ?? '')} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="util-field util-wide"><label>Contenido</label><textarea required rows={6} value={String(draft.content ?? '')} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></div>
            <div className="util-field"><label>CTA</label><input value={String(draft.ctaLabel ?? '')} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} /></div>
            <div className="util-field"><label>URL CTA</label><input type="url" value={String(draft.ctaUrl ?? '')} onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })} /></div>
            <div className="util-field"><label>Programación</label><input type="datetime-local" value={String(draft.scheduledAt ?? '')} onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })} /></div>
          </form>
        </Modal>
      ) : null}

      {statusDraft ? (
        <Modal title="Gestionar publicación" subtitle={`Modo de proveedor: ${text(statusDraft.integrationMode)}`} onClose={() => setStatusDraft(null)} footer={<button className="util-btn primary" form="gbp-status-form">Aplicar</button>} wide>
          <form id="gbp-status-form" className="util-formgrid" onSubmit={update}>
            <div className="util-field"><label>Nuevo estado</label><select value={String(statusDraft.nextStatus ?? 'draft')} onChange={(e) => setStatusDraft({ ...statusDraft, nextStatus: e.target.value })}><option value="draft">Borrador</option><option value="scheduled">Programada</option><option value="published">Publicada</option><option value="failed">Fallida</option><option value="cancelled">Cancelada</option></select></div>
            {statusDraft.nextStatus === 'scheduled' ? <div className="util-field"><label>Fecha obligatoria</label><input required type="datetime-local" value={String(statusDraft.scheduledAt ?? '')} onChange={(e) => setStatusDraft({ ...statusDraft, scheduledAt: e.target.value })} /></div> : null}
            {statusDraft.nextStatus === 'published' && statusDraft.integrationMode !== 'webhook' ? <div className="util-field util-wide"><label>URL o referencia de la publicación real</label><input required type="url" value={String(statusDraft.externalReference ?? '')} onChange={(e) => setStatusDraft({ ...statusDraft, externalReference: e.target.value })} /></div> : null}
            {statusDraft.nextStatus === 'published' && statusDraft.integrationMode === 'webhook' ? <div className="util-notice util-wide">Al guardar, el backend enviará la publicación al webhook GBP configurado y solo marcará publicada si recibe una respuesta correcta.</div> : null}
            {statusDraft.nextStatus === 'failed' ? <div className="util-field util-wide"><label>Motivo del fallo</label><textarea required value={String(statusDraft.lastError ?? '')} onChange={(e) => setStatusDraft({ ...statusDraft, lastError: e.target.value })} /></div> : null}
          </form>
        </Modal>
      ) : null}
      <Loading show={loading} />
    </>
  );
}
