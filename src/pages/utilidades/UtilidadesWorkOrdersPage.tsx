/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { DataView, Empty, ErrorBox, Loading, Modal, PageHead, Panel, Status, SuccessBox, asArray, text } from './UtilidadesCommon';

const NEXT_STATUS: Record<string, string | undefined> = {
  borrador: 'pendiente_aprobacion',
  pendiente_aprobacion: 'activa',
  activa: 'evidencia_enviada',
  evidencia_enviada: 'en_revision',
  aprobada: 'completada',
};

export default function UtilidadesWorkOrdersPage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row>({});

  async function refreshList() {
    const result = await utilidadesV15Api.workOrders({ limit: 100 });
    setItems(result.items);
  }

  async function openOrder(id: number) {
    setLoading(true);
    try {
      setDetail(await utilidadesV15Api.workOrder(id));
      setParams({ open: String(id) });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir la orden.');
    } finally {
      setLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      await refreshList();
      const open = Number(params.get('open'));
      if (open) await openOrder(open);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function transition(status: string) {
    if (!detail) return;
    const order = detail.order as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.transitionWorkOrder(Number(order.id), status);
      setSuccess(`Orden actualizada a ${status.replaceAll('_', ' ')}.`);
      await openOrder(Number(order.id));
      await refreshList();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transición no permitida.');
      setLoading(false);
    }
  }

  async function submitMilestone(event: FormEvent) {
    event.preventDefault();
    if (!detail) return;
    const order = detail.order as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.addMilestone(Number(order.id), draft);
      setModal(null);
      setDraft({});
      setSuccess('Hito agregado.');
      await openOrder(Number(order.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar el hito.');
      setLoading(false);
    }
  }

  async function submitEvidence(event: FormEvent) {
    event.preventDefault();
    if (!detail) return;
    const order = detail.order as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.addEvidence(Number(order.id), draft);
      setModal(null);
      setDraft({});
      setSuccess('Evidencia registrada.');
      await openOrder(Number(order.id));
      await refreshList();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar la evidencia.');
      setLoading(false);
    }
  }

  async function completeMilestone(milestoneId: number) {
    if (!detail) return;
    const order = detail.order as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.completeMilestone(Number(order.id), milestoneId);
      setSuccess('Hito completado.');
      await openOrder(Number(order.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar el hito.');
      setLoading(false);
    }
  }

  async function approve(decision: string) {
    if (!detail) return;
    const order = detail.order as Row;
    setLoading(true);
    try {
      await utilidadesV15Api.approveWorkOrder(Number(order.id), {
        decision,
        comments: String(draft.comments ?? ''),
        kpiAfter: draft.kpiValue ? { metric: String(draft.kpiMetric ?? 'resultado'), value: Number(draft.kpiValue) } : undefined,
      });
      setModal(null);
      setDraft({});
      setSuccess(decision === 'approved' ? 'Entrega aprobada.' : 'Cambios solicitados.');
      await openOrder(Number(order.id));
      await refreshList();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la aprobación.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead title="Órdenes de Trabajo" subtitle="Alcance, hitos, evidencia, revisión controlada y KPI antes/después."><button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button></PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />
      <div className="util-table-wrap"><table className="util-table"><thead><tr><th>Orden</th><th>Ubicación</th><th>Prioridad</th><th>Estado</th><th>Agencia</th><th>Valor</th><th /></tr></thead><tbody>{items.map((item) => <tr key={Number(item.id)}><td><b>{text(item.title)}</b><div className="util-muted">{text(item.serviceName)}</div></td><td>{text(item.locationName ?? item.locationId)}</td><td><Status value={item.priority} /></td><td><Status value={item.status} /></td><td>{text(item.agencyName ?? item.agencyProfileId)}</td><td>{text(item.currencyCode)} {text(item.amount)}</td><td><button className="util-btn primary" onClick={() => void openOrder(Number(item.id))}>Abrir expediente</button></td></tr>)}</tbody></table>{!items.length ? <Empty /> : null}</div>

      {detail ? <OrderModal detail={detail} onClose={() => { setDetail(null); setParams({}); }} onTransition={transition} onNew={(kind) => { setDraft({}); setModal(kind); }} onComplete={completeMilestone} /> : null}
      {modal === 'milestone' ? <Modal title="Añadir hito" onClose={() => setModal(null)} footer={<button className="util-btn primary" form="milestone-form">Guardar</button>}><form id="milestone-form" onSubmit={submitMilestone} className="util-formgrid"><div className="util-field util-wide"><label>Nombre</label><input required value={String(draft.name ?? '')} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div><div className="util-field util-wide"><label>Descripción</label><textarea value={String(draft.description ?? '')} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div><div className="util-field"><label>Fecha límite</label><input type="date" value={String(draft.dueDate ?? '')} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></div></form></Modal> : null}
      {modal === 'evidence' ? <Modal title="Añadir evidencia" onClose={() => setModal(null)} footer={<button className="util-btn primary" form="evidence-form">Guardar evidencia</button>}><form id="evidence-form" onSubmit={submitEvidence} className="util-formgrid"><div className="util-field util-wide"><label>Título</label><input required value={String(draft.title ?? '')} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div className="util-field"><label>Hito relacionado</label><input type="number" min="1" value={String(draft.milestoneId ?? '')} onChange={(event) => setDraft({ ...draft, milestoneId: event.target.value ? Number(event.target.value) : undefined })} /></div><div className="util-field util-wide"><label>URL del archivo o evidencia</label><input type="url" value={String(draft.fileUrl ?? '')} onChange={(event) => setDraft({ ...draft, fileUrl: event.target.value })} /></div><div className="util-field util-wide"><label>Descripción</label><textarea value={String(draft.description ?? '')} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div></form></Modal> : null}
      {modal === 'approval' ? <Modal title="Revisión y aprobación" subtitle="La aprobación exige evidencia y todos los hitos completados." onClose={() => setModal(null)} footer={<><button className="util-btn danger" onClick={() => void approve('changes_requested')}>Solicitar cambios</button><button className="util-btn primary" onClick={() => void approve('approved')}>Aprobar</button></>}><div className="util-formgrid"><div className="util-field util-wide"><label>Comentarios</label><textarea value={String(draft.comments ?? '')} onChange={(event) => setDraft({ ...draft, comments: event.target.value })} /></div><div className="util-field"><label>KPI posterior</label><input placeholder="Ej. audit_score" value={String(draft.kpiMetric ?? '')} onChange={(event) => setDraft({ ...draft, kpiMetric: event.target.value })} /></div><div className="util-field"><label>Valor</label><input type="number" value={String(draft.kpiValue ?? '')} onChange={(event) => setDraft({ ...draft, kpiValue: event.target.value })} /></div></div></Modal> : null}
      <Loading show={loading} />
    </>
  );
}

function OrderModal({ detail, onClose, onTransition, onNew, onComplete }: { detail: Row; onClose: () => void; onTransition: (status: string) => void; onNew: (kind: string) => void; onComplete: (id: number) => void }) {
  const order = detail.order as Row;
  const milestones = asArray(detail.milestones) as Row[];
  const evidence = asArray(detail.evidence) as Row[];
  const approvals = asArray(detail.approvals) as Row[];
  const service = detail.service as Row | null;
  const agency = detail.agency as Row | null;
  const status = String(order.status);
  return <Modal title={`${text(order.title)} · ${text(order.status)}`} onClose={onClose} wide footer={<><button className="util-btn" onClick={() => onNew('milestone')}><Plus size={13} />Hito</button><button className="util-btn" onClick={() => onNew('evidence')}><Plus size={13} />Evidencia</button>{status === 'en_revision' ? <button className="util-btn primary" onClick={() => onNew('approval')}>Revisar entrega</button> : null}{NEXT_STATUS[status] ? <button className="util-btn primary" onClick={() => onTransition(NEXT_STATUS[status] as string)}>Avanzar a {NEXT_STATUS[status]?.replaceAll('_', ' ')}</button> : null}</>}><div className="util-grid2"><Panel title="Resumen"><table className="util-table"><tbody><tr><th>Servicio</th><td>{text(service?.name)}</td></tr><tr><th>Agencia</th><td>{text(agency?.name)}</td></tr><tr><th>Valor</th><td>{text(order.currencyCode)} {text(order.amount)}</td></tr><tr><th>Prioridad</th><td><Status value={order.priority} /></td></tr><tr><th>Alcance</th><td>{text(order.scope)}</td></tr></tbody></table></Panel><Panel title="KPI"><div className="util-grid2"><div><div className="util-muted">Antes</div><DataView value={order.kpiBefore} /></div><div><div className="util-muted">Después</div><DataView value={order.kpiAfter} /></div></div></Panel></div><Panel title="Hitos">{milestones.length ? <table className="util-table"><thead><tr><th>#</th><th>Hito</th><th>Estado</th><th /></tr></thead><tbody>{milestones.map((milestone) => <tr key={Number(milestone.id)}><td>{text(milestone.sequence)}</td><td>{text(milestone.name)}</td><td><Status value={milestone.status} /></td><td>{milestone.status !== 'completed' ? <button className="util-btn" onClick={() => void onComplete(Number(milestone.id))}>Completar</button> : null}</td></tr>)}</tbody></table> : <Empty />}</Panel><div className="util-grid2"><Panel title="Evidencias">{evidence.length ? evidence.map((row) => <div className="util-card" key={Number(row.id)}><b>{text(row.title)}</b><p>{text(row.description)}</p>{row.fileUrl ? <a className="util-link" href={String(row.fileUrl)} target="_blank" rel="noreferrer">Abrir evidencia</a> : null}</div>) : <Empty />}</Panel><Panel title="Aprobaciones">{approvals.length ? approvals.map((row) => <div className="util-card" key={Number(row.id)}><Status value={row.decision} /><p>{text(row.comments)}</p></div>) : <Empty />}</Panel></div></Modal>;
}
