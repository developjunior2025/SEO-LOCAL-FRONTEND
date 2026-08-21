/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, BriefcaseBusiness, FolderKanban, RefreshCw, Wrench } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Kpi, Loading, PageHead, Panel, Status, SuccessBox, formatDate, text } from './UtilidadesCommon';

const ACTION_TRANSITIONS: Record<string, string[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['quoted', 'resolved', 'cancelled'],
  quoted: ['in_progress', 'work_order_created', 'cancelled'],
  work_order_created: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
};

export default function UtilidadesOperationsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialTab = params.get('tab') || 'cases';
  const [tab, setTab] = useState(initialTab);
  const [alerts, setAlerts] = useState<Row[]>([]);
  const [actions, setActions] = useState<Row[]>([]);
  const [cases, setCases] = useState<Row[]>([]);
  const [orders, setOrders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [alertRows, actionRows, caseRows, orderRows] = await Promise.all([
        utilidadesV15Api.alerts({ limit: 100 }),
        utilidadesV15Api.actions({ limit: 100 }),
        utilidadesV15Api.cases({ limit: 100 }),
        utilidadesV15Api.workOrders({ limit: 100 }),
      ]);
      setAlerts(alertRows.items);
      setActions(actionRows.items);
      setCases(caseRows.items);
      setOrders(orderRows.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el Centro de Operaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const metrics = useMemo(() => ({
    cases: cases.filter((item) => !['resolved', 'cancelled'].includes(String(item.status))).length,
    alerts: alerts.filter((item) => item.status !== 'resolved').length,
    actions: actions.filter((item) => !['resolved', 'cancelled'].includes(String(item.status))).length,
    approvals: orders.filter((item) => ['evidencia_enviada', 'en_revision'].includes(String(item.status))).length,
  }), [alerts, actions, cases, orders]);

  function changeTab(value: string) {
    setTab(value);
    setParams({ tab: value }, { replace: true });
  }

  async function transitionAction(item: Row, status: string) {
    setLoading(true);
    try {
      await utilidadesV15Api.transitionAction(Number(item.id), status);
      setSuccess(`Acción ${text(item.title)} actualizada a ${status.replaceAll('_', ' ')}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado de la acción.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead eyebrow="Coordinación operativa" title="Centro de Operaciones" subtitle="Casos, alertas, acciones y entregas pendientes en una sola cola de trabajo.">
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />
      <div className="util-kpis">
        <Kpi label="Casos activos" value={metrics.cases} icon={<FolderKanban size={17} />} tone={metrics.cases ? 'warning' : 'success'} />
        <Kpi label="Alertas abiertas" value={metrics.alerts} icon={<AlertTriangle size={17} />} tone={metrics.alerts ? 'danger' : 'success'} />
        <Kpi label="Acciones abiertas" value={metrics.actions} icon={<Wrench size={17} />} />
        <Kpi label="Entregas por revisar" value={metrics.approvals} icon={<BriefcaseBusiness size={17} />} tone={metrics.approvals ? 'warning' : 'success'} />
      </div>
      <div className="util-tabs">
        {[['cases', 'Casos'], ['alerts', 'Alertas'], ['actions', 'Acciones'], ['approvals', 'Aprobaciones']].map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => changeTab(value)}>{label}</button>)}
      </div>

      {tab === 'cases' ? <Panel title="Casos operativos" subtitle="Expedientes con responsable, prioridad, vencimiento y bitácora."><Table headers={['Caso', 'Ubicación', 'Prioridad', 'Estado', 'Vence', '']} rows={cases.map((item) => [<><b>{text(item.title)}</b><div className="util-muted">{text(item.description)}</div></>, text(item.locationName ?? item.locationId), <Status value={item.priority} />, <Status value={item.status} />, formatDate(item.dueDate), <button className="util-btn primary" onClick={() => navigate('/utilidades/casos')}>Gestionar</button>])} empty="No hay casos operativos." /></Panel> : null}
      {tab === 'alerts' ? <Panel title="Alertas" subtitle="Incidencias detectadas por informes o registradas manualmente."><Table headers={['Alerta', 'Ubicación', 'Severidad', 'Estado', 'Creada', '']} rows={alerts.map((item) => [<><b>{text(item.title)}</b><div className="util-muted">{text(item.description)}</div></>, text(item.locationName ?? item.locationId), <Status value={item.severity} />, <Status value={item.status} />, formatDate(item.createdAt), <button className="util-btn" onClick={() => navigate('/utilidades/alertas')}>Abrir</button>])} empty="No hay alertas." /></Panel> : null}
      {tab === 'actions' ? <Panel title="Acciones" subtitle="La máquina de estados exige cotización u orden antes de avanzar a sus estados relacionados."><div className="util-table-wrap"><table className="util-table"><thead><tr><th>Acción</th><th>Ubicación</th><th>Prioridad</th><th>Estado</th><th>Vence</th><th>Siguiente paso</th></tr></thead><tbody>{actions.map((item) => <tr key={Number(item.id)}><td><b>{text(item.title)}</b><div className="util-muted">{text(item.resolutionMode)}</div></td><td>{text(item.locationName ?? item.locationId)}</td><td><Status value={item.priority} /></td><td><Status value={item.status} /></td><td>{formatDate(item.dueDate)}</td><td><div className="util-actions">{(ACTION_TRANSITIONS[String(item.status)] ?? []).map((status) => <button key={status} className="util-btn" onClick={() => void transitionAction(item, status)}>{status.replaceAll('_', ' ')}</button>)}</div></td></tr>)}</tbody></table>{!actions.length ? <Empty text="No hay acciones." /> : null}</div></Panel> : null}
      {tab === 'approvals' ? <Panel title="Entregas y aprobaciones" subtitle="Órdenes con evidencia enviada o en revisión."><Table headers={['Orden', 'Ubicación', 'Agencia', 'Estado', 'Valor', '']} rows={orders.filter((item) => ['evidencia_enviada', 'en_revision'].includes(String(item.status))).map((item) => [<b>{text(item.title)}</b>, text(item.locationName ?? item.locationId), text(item.agencyName ?? item.agencyProfileId), <Status value={item.status} />, `${text(item.currencyCode)} ${text(item.amount)}`, <button className="util-btn primary" onClick={() => navigate(`/utilidades/ordenes-trabajo?open=${Number(item.id)}`)}>Revisar</button>])} empty="No hay entregas pendientes de aprobación." /></Panel> : null}
      <Loading show={loading} />
    </>
  );
}

function Table({ headers, rows, empty }: { headers: string[]; rows: Array<Array<ReactNode>>; empty: string }) {
  return <div className="util-table-wrap"><table className="util-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length ? <Empty text={empty} /> : null}</div>;
}
