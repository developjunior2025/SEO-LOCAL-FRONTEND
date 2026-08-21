/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Play, Plus, RefreshCw, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import {
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHead,
  Panel,
  Progress,
  Status,
  SuccessBox,
  asArray,
  formatDate,
  text,
} from './UtilidadesCommon';

export default function UtilidadesCampaignsPage() {
  const route = useLocation();
  const isReviews = route.pathname.includes('resenas');
  const [items, setItems] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<Row>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [campaignRows, locationRows] = await Promise.all([
        isReviews ? utilidadesV15Api.reviewCampaigns({ limit: 100 }) : utilidadesV15Api.citationCampaigns({ limit: 100 }),
        utilidadesV15Api.locations({ limit: 100 }),
      ]);
      setItems(campaignRows.items);
      setLocations(locationRows.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las campañas.');
    } finally {
      setLoading(false);
    }
  }

  async function openCampaign(id: number) {
    setLoading(true);
    try {
      setDetail(isReviews ? await utilidadesV15Api.reviewCampaign(id) : await utilidadesV15Api.citationCampaign(id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir la campaña.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setDetail(null); void load(); }, [isReviews]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = { ...draft, locationId: Number(draft.locationId) };
      const saved = isReviews
        ? await utilidadesV15Api.createReviewCampaign(payload)
        : await utilidadesV15Api.createCitationCampaign({ ...payload, directoryCount: Number(draft.directoryCount ?? 0) });
      setCreateOpen(false);
      setDraft({});
      setSuccess(`Campaña de ${isReviews ? 'reseñas' : 'citaciones'} creada.`);
      await load();
      if (saved.id) await openCampaign(Number(saved.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la campaña.');
      setLoading(false);
    }
  }

  async function addItem(event: FormEvent) {
    event.preventDefault();
    if (!detail) return;
    const campaign = detail.campaign as Row;
    setLoading(true);
    try {
      if (isReviews) {
        await utilidadesV15Api.addReviewRecipient(Number(campaign.id), draft);
      } else {
        await utilidadesV15Api.addCitationItem(Number(campaign.id), { ...draft, status: draft.status ?? 'pending' });
      }
      setDraft({});
      setAddOpen(false);
      setSuccess(isReviews ? 'Destinatario agregado.' : 'Directorio agregado a la campaña.');
      await openCampaign(Number(campaign.id));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar el registro.');
      setLoading(false);
    }
  }

  async function execute(mode: 'manual' | 'webhook') {
    if (!detail || !isReviews) return;
    const campaign = detail.campaign as Row;
    setLoading(true);
    try {
      setDetail(await utilidadesV15Api.executeReviewCampaign(Number(campaign.id), mode));
      setSuccess(mode === 'manual'
        ? 'Campaña preparada para gestión manual. Los destinatarios quedaron listos para procesar.'
        : 'Campaña enviada al adaptador webhook configurado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo ejecutar la campaña.');
      setLoading(false);
    }
  }

  async function updateRecipient(recipient: Row, status: string) {
    if (!detail || !isReviews) return;
    const campaign = detail.campaign as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.updateReviewRecipient(Number(campaign.id), Number(recipient.id), { status });
      setDetail(await utilidadesV15Api.reviewCampaign(Number(campaign.id)));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el destinatario.');
      setLoading(false);
    }
  }

  async function updateCitation(item: Row, status: string) {
    if (!detail || isReviews) return;
    const campaign = detail.campaign as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.updateCitationItem(Number(campaign.id), Number(item.id), {
        directoryName: item.directoryName,
        directoryUrl: item.directoryUrl || undefined,
        listingUrl: item.listingUrl || undefined,
        evidenceUrl: item.evidenceUrl || undefined,
        notes: item.notes || undefined,
        status,
      });
      setDetail(await utilidadesV15Api.citationCampaign(Number(campaign.id)));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el directorio.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Promoción y crecimiento"
        title={isReviews ? 'Campañas de Reseñas' : 'Campañas de Citaciones'}
        subtitle={isReviews
          ? 'Destinatarios, plantillas, canales, preparación manual y envío mediante adaptador webhook.'
          : 'NAP objetivo, directorios individuales, URL pública, evidencia y verificación del alta.'}
      >
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
        <button className="util-btn primary" onClick={() => { setDraft({ locationId: locations[0]?.id ?? '', sendChannel: isReviews ? 'email' : undefined, directoryCount: 0 }); setCreateOpen(true); }}><Plus size={14} />Nueva campaña</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />

      <div className="util-table-wrap">
        <table className="util-table">
          <thead><tr><th>Campaña</th><th>Ubicación</th><th>Estado</th><th>Progreso</th><th>Programación</th><th /></tr></thead>
          <tbody>
            {items.map((item) => {
              const completed = Number(isReviews ? item.reviewCount : item.completedCount) || 0;
              const total = Number(isReviews ? item.sentCount : item.directoryCount) || 0;
              return (
                <tr key={Number(item.id)}>
                  <td><b>{text(item.name)}</b><div className="util-muted">{isReviews ? text(item.sendChannel) : `${text(item.napName)} · ${text(item.napPhone)}`}</div></td>
                  <td>{text(item.locationName ?? item.locationId)}</td>
                  <td><Status value={item.status} /></td>
                  <td style={{ minWidth: 170 }}><Progress value={completed} max={Math.max(total, 1)} label={`${completed}/${total}`} /></td>
                  <td>{formatDate(item.scheduledAt)}</td>
                  <td><button className="util-btn primary" onClick={() => void openCampaign(Number(item.id))}>Gestionar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!items.length ? <Empty title="Sin campañas" text={`Crea una campaña de ${isReviews ? 'reseñas' : 'citaciones'} vinculada a una ubicación.`} /> : null}
      </div>

      {createOpen ? (
        <Modal title={`Nueva campaña de ${isReviews ? 'reseñas' : 'citaciones'}`} onClose={() => setCreateOpen(false)} footer={<button className="util-btn primary" form="campaign-create-form">Crear campaña</button>} wide>
          <form id="campaign-create-form" className="util-formgrid" onSubmit={create}>
            <div className="util-field"><label>Ubicación</label><select required value={String(draft.locationId ?? '')} onChange={(e) => setDraft({ ...draft, locationId: Number(e.target.value) })}>{locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>)}</select></div>
            <div className="util-field"><label>Nombre</label><input required value={String(draft.name ?? '')} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            {isReviews ? <>
              <div className="util-field"><label>Canal</label><select value={String(draft.sendChannel ?? 'email')} onChange={(e) => setDraft({ ...draft, sendChannel: e.target.value })}><option value="email">Email</option><option value="sms">SMS</option><option value="email_sms">Email + SMS</option><option value="manual">Manual</option></select></div>
              <div className="util-field"><label>Programar</label><input type="datetime-local" value={String(draft.scheduledAt ?? '')} onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })} /></div>
              <div className="util-field util-wide"><label>Asunto de plantilla</label><input value={String(draft.templateSubject ?? '')} onChange={(e) => setDraft({ ...draft, templateSubject: e.target.value })} /></div>
              <div className="util-field util-wide"><label>Mensaje</label><textarea required value={String(draft.templateBody ?? '')} onChange={(e) => setDraft({ ...draft, templateBody: e.target.value })} /></div>
            </> : <>
              <div className="util-field"><label>Nombre NAP</label><input required value={String(draft.napName ?? '')} onChange={(e) => setDraft({ ...draft, napName: e.target.value })} /></div>
              <div className="util-field"><label>Teléfono NAP</label><input required value={String(draft.napPhone ?? '')} onChange={(e) => setDraft({ ...draft, napPhone: e.target.value })} /></div>
              <div className="util-field util-wide"><label>Dirección NAP</label><input required value={String(draft.napAddress ?? '')} onChange={(e) => setDraft({ ...draft, napAddress: e.target.value })} /></div>
              <div className="util-field"><label>Meta de directorios</label><input type="number" min="0" value={String(draft.directoryCount ?? 0)} onChange={(e) => setDraft({ ...draft, directoryCount: Number(e.target.value) })} /></div>
            </>}
          </form>
        </Modal>
      ) : null}

      {detail ? (
        <CampaignDetail
          isReviews={isReviews}
          detail={detail}
          onClose={() => setDetail(null)}
          onAdd={() => { setDraft(isReviews ? { channel: 'email' } : { status: 'pending' }); setAddOpen(true); }}
          onExecute={execute}
          onRecipient={updateRecipient}
          onCitation={updateCitation}
        />
      ) : null}

      {addOpen ? (
        <Modal title={isReviews ? 'Agregar destinatario' : 'Agregar directorio'} onClose={() => setAddOpen(false)} footer={<button className="util-btn primary" form="campaign-item-form">Agregar</button>} wide>
          <form id="campaign-item-form" className="util-formgrid" onSubmit={addItem}>
            {isReviews ? <>
              <div className="util-field"><label>Nombre</label><input required value={String(draft.name ?? '')} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="util-field"><label>Canal</label><select value={String(draft.channel ?? 'email')} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}><option value="email">Email</option><option value="sms">SMS</option><option value="email_sms">Email + SMS</option><option value="manual">Manual</option></select></div>
              <div className="util-field"><label>Correo</label><input type="email" value={String(draft.email ?? '')} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
              <div className="util-field"><label>Teléfono</label><input value={String(draft.phone ?? '')} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
            </> : <>
              <div className="util-field util-wide"><label>Directorio</label><input required value={String(draft.directoryName ?? '')} onChange={(e) => setDraft({ ...draft, directoryName: e.target.value })} /></div>
              <div className="util-field"><label>URL del directorio</label><input type="url" value={String(draft.directoryUrl ?? '')} onChange={(e) => setDraft({ ...draft, directoryUrl: e.target.value })} /></div>
              <div className="util-field"><label>Estado</label><select value={String(draft.status ?? 'pending')} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="pending">Pendiente</option><option value="submitted">Enviado</option><option value="live">Publicado</option><option value="failed">Fallido</option><option value="skipped">Omitido</option></select></div>
              <div className="util-field"><label>URL de ficha</label><input type="url" value={String(draft.listingUrl ?? '')} onChange={(e) => setDraft({ ...draft, listingUrl: e.target.value })} /></div>
              <div className="util-field"><label>Evidencia</label><input type="url" value={String(draft.evidenceUrl ?? '')} onChange={(e) => setDraft({ ...draft, evidenceUrl: e.target.value })} /></div>
              <div className="util-field util-wide"><label>Notas</label><textarea value={String(draft.notes ?? '')} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
            </>}
          </form>
        </Modal>
      ) : null}
      <Loading show={loading} />
    </>
  );
}

function CampaignDetail({
  isReviews,
  detail,
  onClose,
  onAdd,
  onExecute,
  onRecipient,
  onCitation,
}: {
  isReviews: boolean;
  detail: Row;
  onClose: () => void;
  onAdd: () => void;
  onExecute: (mode: 'manual' | 'webhook') => void;
  onRecipient: (item: Row, status: string) => void;
  onCitation: (item: Row, status: string) => void;
}) {
  const campaign = detail.campaign as Row;
  const rows = asArray(isReviews ? detail.recipients : detail.items) as Row[];
  return (
    <Modal
      title={text(campaign.name)}
      subtitle={`${isReviews ? 'Campaña de reseñas' : 'Campaña de citaciones'} · ${text(campaign.status)}`}
      onClose={onClose}
      wide
      footer={<>
        <button className="util-btn" onClick={onAdd}><Plus size={14} />{isReviews ? 'Destinatario' : 'Directorio'}</button>
        {isReviews ? <><button className="util-btn" onClick={() => void onExecute('manual')}><Play size={14} />Preparar manual</button><button className="util-btn primary" onClick={() => void onExecute('webhook')}><Send size={14} />Enviar por webhook</button></> : null}
      </>}
    >
      <div className="util-grid2">
        <Panel title="Configuración">
          <table className="util-table"><tbody>
            <tr><th>Ubicación</th><td>{text(campaign.locationId)}</td></tr>
            <tr><th>Estado</th><td><Status value={campaign.status} /></td></tr>
            {isReviews ? <><tr><th>Canal</th><td>{text(campaign.sendChannel)}</td></tr><tr><th>Asunto</th><td>{text(campaign.templateSubject)}</td></tr></> : <><tr><th>NAP</th><td>{text(campaign.napName)} · {text(campaign.napPhone)}</td></tr><tr><th>Dirección</th><td>{text(campaign.napAddress)}</td></tr></>}
          </tbody></table>
        </Panel>
        <Panel title="Resultados">
          <Progress
            value={Number(isReviews ? campaign.reviewCount : campaign.completedCount) || 0}
            max={Math.max(Number(isReviews ? campaign.sentCount : campaign.directoryCount) || 0, 1)}
            label={isReviews ? 'Respuestas / envíos' : 'Directorios publicados'}
          />
        </Panel>
      </div>
      <Panel title={isReviews ? 'Destinatarios' : 'Directorios'}>
        <div className="util-table-wrap">
          <table className="util-table">
            <thead><tr>{isReviews ? <><th>Persona</th><th>Contacto</th><th>Canal</th></> : <><th>Directorio</th><th>Ficha</th><th>Evidencia</th></>}<th>Estado</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={Number(row.id)}>
                  {isReviews ? <><td><b>{text(row.name)}</b></td><td>{text(row.email || row.phone)}</td><td>{text(row.channel)}</td></> : <><td><b>{text(row.directoryName)}</b><div className="util-muted">{text(row.directoryUrl)}</div></td><td>{row.listingUrl ? <a href={String(row.listingUrl)} target="_blank" rel="noreferrer">Abrir ficha</a> : '—'}</td><td>{row.evidenceUrl ? <a href={String(row.evidenceUrl)} target="_blank" rel="noreferrer">Ver evidencia</a> : '—'}</td></>}
                  <td><Status value={row.status} /></td>
                  <td>
                    {isReviews ? <select value={String(row.status)} onChange={(e) => void onRecipient(row, e.target.value)}><option value="pending">Pendiente</option><option value="prepared">Preparado</option><option value="sent">Enviado</option><option value="delivered">Entregado</option><option value="responded">Respondió</option><option value="failed">Fallido</option><option value="skipped">Omitido</option></select> : <select value={String(row.status)} onChange={(e) => void onCitation(row, e.target.value)}><option value="pending">Pendiente</option><option value="submitted">Enviado</option><option value="live">Publicado</option><option value="failed">Fallido</option><option value="skipped">Omitido</option></select>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? <Empty title={isReviews ? 'Sin destinatarios' : 'Sin directorios'} text="Agrega registros para comenzar el flujo operativo." /> : null}
        </div>
      </Panel>
      {isReviews && Number(campaign.reviewCount) > 0 ? <div className="util-success"><CheckCircle2 size={17} />La campaña tiene respuestas registradas y sus contadores se calculan desde los destinatarios.</div> : null}
    </Modal>
  );
}
