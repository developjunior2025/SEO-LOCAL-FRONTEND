/* eslint-disable react-hooks/set-state-in-effect */
import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquarePlus, Plus, RefreshCw } from 'lucide-react';
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
  asArray,
  formatDate,
  text,
} from './UtilidadesCommon';

const CASE_STATUSES = ['open', 'in_progress', 'blocked', 'resolved', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function UtilidadesCasesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Row>({ priority: 'medium' });
  const [activity, setActivity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [cases, locationRows] = await Promise.all([
        utilidadesV15Api.cases({ limit: 100 }),
        utilidadesV15Api.locations({ limit: 100 }),
      ]);
      setItems(cases.items);
      setLocations(locationRows.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los casos.');
    } finally {
      setLoading(false);
    }
  }

  async function openCase(id: number) {
    setLoading(true);
    try {
      setDetail(await utilidadesV15Api.caseDetail(id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir el caso.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createCase(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const saved = await utilidadesV15Api.createCase({
        ...draft,
        locationId: Number(draft.locationId),
      });
      setCreateOpen(false);
      setDraft({ priority: 'medium' });
      setSuccess('Caso creado y registrado en la bitácora.');
      await load();
      if (saved.id) await openCase(Number(saved.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el caso.');
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    if (!detail) return;
    const item = detail.item as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.updateCase(Number(item.id), { status });
      setSuccess(`Caso actualizado a ${status.replaceAll('_', ' ')}.`);
      await openCase(Number(item.id));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el caso.');
      setLoading(false);
    }
  }

  async function addActivity(event: FormEvent) {
    event.preventDefault();
    if (!detail || !activity.trim()) return;
    const item = detail.item as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.addCaseActivity(Number(item.id), {
        activityType: 'comment',
        message: activity.trim(),
      });
      setActivity('');
      setSuccess('Comentario agregado a la bitácora.');
      await openCase(Number(item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar la actividad.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Operación y seguimiento"
        title="Casos operativos"
        subtitle="Expedientes con prioridad, responsable, vencimiento, vínculos y bitácora cronológica."
      >
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
        <button
          className="util-btn primary"
          onClick={() => {
            setDraft({ locationId: locations[0]?.id ?? '', priority: 'medium' });
            setCreateOpen(true);
          }}
        ><Plus size={14} />Nuevo caso</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />

      <div className="util-table-wrap">
        <table className="util-table">
          <thead><tr><th>Caso</th><th>Ubicación</th><th>Prioridad</th><th>Estado</th><th>Vence</th><th /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={Number(item.id)}>
                <td><b>{text(item.title)}</b><div className="util-muted">{text(item.description)}</div></td>
                <td>{text(item.locationName ?? item.locationId)}</td>
                <td><Status value={item.priority} /></td>
                <td><Status value={item.status} /></td>
                <td>{formatDate(item.dueDate)}</td>
                <td><button className="util-btn primary" onClick={() => void openCase(Number(item.id))}>Abrir expediente</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <Empty title="No hay casos" text="Crea un caso para coordinar una incidencia, acción u orden de trabajo." /> : null}
      </div>

      {createOpen ? (
        <Modal
          title="Nuevo caso operativo"
          subtitle="El caso queda vinculado a una ubicación y registra actividad desde su creación."
          onClose={() => setCreateOpen(false)}
          footer={<button className="util-btn primary" form="case-create-form">Crear caso</button>}
          wide
        >
          <form id="case-create-form" onSubmit={createCase} className="util-formgrid">
            <div className="util-field">
              <label>Ubicación</label>
              <select required value={String(draft.locationId ?? '')} onChange={(e) => setDraft({ ...draft, locationId: Number(e.target.value) })}>
                <option value="">Seleccione…</option>
                {locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>)}
              </select>
            </div>
            <div className="util-field"><label>Prioridad</label><select value={String(draft.priority ?? 'medium')} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
            <div className="util-field util-wide"><label>Título</label><input required value={String(draft.title ?? '')} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="util-field util-wide"><label>Descripción</label><textarea value={String(draft.description ?? '')} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div className="util-field"><label>Fecha límite</label><input type="date" value={String(draft.dueDate ?? '')} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></div>
            <div className="util-field"><label>ID de alerta (opcional)</label><input type="number" min="1" value={String(draft.alertId ?? '')} onChange={(e) => setDraft({ ...draft, alertId: e.target.value ? Number(e.target.value) : undefined })} /></div>
            <div className="util-field"><label>ID de acción (opcional)</label><input type="number" min="1" value={String(draft.actionId ?? '')} onChange={(e) => setDraft({ ...draft, actionId: e.target.value ? Number(e.target.value) : undefined })} /></div>
            <div className="util-field"><label>ID de orden (opcional)</label><input type="number" min="1" value={String(draft.workOrderId ?? '')} onChange={(e) => setDraft({ ...draft, workOrderId: e.target.value ? Number(e.target.value) : undefined })} /></div>
          </form>
        </Modal>
      ) : null}

      {detail ? <CaseDetail detail={detail} activity={activity} setActivity={setActivity} onAddActivity={addActivity} onStatus={updateStatus} onClose={() => setDetail(null)} /> : null}
      <Loading show={loading} />
    </>
  );
}

function CaseDetail({
  detail,
  activity,
  setActivity,
  onAddActivity,
  onStatus,
  onClose,
}: {
  detail: Row;
  activity: string;
  setActivity: (value: string) => void;
  onAddActivity: (event: FormEvent) => void;
  onStatus: (status: string) => void;
  onClose: () => void;
}) {
  const item = detail.item as Row;
  const activities = asArray(detail.activities) as Row[];
  return (
    <Modal
      title={text(item.title)}
      subtitle={`Caso #${text(item.id)} · ${text(item.locationId)}`}
      onClose={onClose}
      wide
      footer={
        <div className="util-actions">
          {CASE_STATUSES.filter((status) => status !== item.status).map((status) => (
            <button key={status} className={`util-btn ${status === 'resolved' ? 'primary' : ''}`} onClick={() => void onStatus(status)}>
              {status === 'resolved' ? <CheckCircle2 size={14} /> : null}{status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      }
    >
      <div className="util-grid2">
        <Panel title="Datos del caso">
          <table className="util-table"><tbody>
            <tr><th>Estado</th><td><Status value={item.status} /></td></tr>
            <tr><th>Prioridad</th><td><Status value={item.priority} /></td></tr>
            <tr><th>Vencimiento</th><td>{formatDate(item.dueDate)}</td></tr>
            <tr><th>Responsable</th><td>{text(item.ownerUserAccountId)}</td></tr>
            <tr><th>Alerta</th><td>{text(item.alertId)}</td></tr>
            <tr><th>Acción</th><td>{text(item.actionId)}</td></tr>
            <tr><th>Orden</th><td>{text(item.workOrderId)}</td></tr>
          </tbody></table>
        </Panel>
        <Panel title="Descripción"><p>{text(item.description, 'Sin descripción.')}</p></Panel>
      </div>
      <Panel title="Bitácora" subtitle="Comentarios, cambios de estado y actividad automática.">
        {activities.length ? (
          <div className="util-stack">
            {activities.map((row) => (
              <article className="util-card" key={Number(row.id)}>
                <div className="util-card-head"><Status value={row.activityType} /><span className="util-muted">{formatDate(row.createdAt)}</span></div>
                <p>{text(row.message)}</p>
              </article>
            ))}
          </div>
        ) : <Empty compact text="El caso todavía no tiene actividad." />}
        <form onSubmit={onAddActivity} className="util-inline-form">
          <input required placeholder="Agregar comentario a la bitácora" value={activity} onChange={(e) => setActivity(e.target.value)} />
          <button className="util-btn primary"><MessageSquarePlus size={14} />Registrar</button>
        </form>
      </Panel>
    </Modal>
  );
}
