/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Loading, Modal, PageHead, Panel, Status, asArray, text } from './UtilidadesCommon';

export default function UtilidadesClientsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.clients({ search: query, limit: 50 });
      setItems(result.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando clientes.');
    } finally {
      setLoading(false);
    }
  }

  async function open(id: number) {
    setLoading(true);
    try {
      setDetail(await utilidadesV15Api.clientDetail(id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir el cliente.');
    } finally {
      setLoading(false);
    }
  }

  // Carga controlada: el buscador se ejecuta con el botón/Enter, no en cada pulsación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { void load(); }, []);

  const client = (detail?.client ?? {}) as Row;
  const locations = asArray(detail?.locations) as Row[];
  const alerts = asArray(detail?.alerts) as Row[];
  const workOrders = asArray(detail?.workOrders) as Row[];

  return <>
    <PageHead title="Clientes" subtitle="Perfiles reales, ubicaciones, alertas y órdenes asociadas.">
      <button className="util-btn" onClick={load}><RefreshCw size={14}/>Actualizar</button>
    </PageHead>
    <ErrorBox message={error}/>
    <div className="util-toolbar">
      <Search size={15}/>
      <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void load()} placeholder="Buscar cliente"/>
      <button className="util-btn primary" onClick={load}>Buscar</button>
    </div>
    <div className="util-table-wrap">
      <table className="util-table">
        <thead><tr><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Ciudad</th><th>Ubicaciones</th><th>Estado</th><th/></tr></thead>
        <tbody>{items.map((item) => <tr key={Number(item.id)}>
          <td><b>{text(item.company_name ?? item.display_name)}</b></td>
          <td>{text(item.email)}</td><td>{text(item.phone)}</td><td>{text(item.city)}</td>
          <td>{text(item.location_count)}</td><td><Status value={item.active ? 'Activo' : 'Inactivo'}/></td>
          <td><button className="util-btn" onClick={() => void open(Number(item.id))}><Eye size={13}/>Abrir</button></td>
        </tr>)}</tbody>
      </table>
      {!items.length && <Empty/>}
    </div>
    {detail && <Modal title={text(client.company_name ?? client.display_name)} onClose={() => setDetail(null)}>
      <div className="util-grid2">
        <Panel title="Perfil"><table className="util-table"><tbody>
          <tr><th>Correo</th><td>{text(client.email)}</td></tr><tr><th>Teléfono</th><td>{text(client.phone)}</td></tr>
          <tr><th>Ciudad</th><td>{text(client.city)}</td></tr><tr><th>País</th><td>{text(client.country_code)}</td></tr>
        </tbody></table></Panel>
        <Panel title="Resumen"><div className="util-kpis compact"><div className="util-kpi"><strong>{locations.length}</strong><span>Ubicaciones</span></div><div className="util-kpi"><strong>{alerts.length}</strong><span>Alertas</span></div><div className="util-kpi"><strong>{workOrders.length}</strong><span>Órdenes</span></div></div></Panel>
      </div>
      <Panel title="Ubicaciones">{locations.length ? <table className="util-table"><thead><tr><th>Nombre</th><th>Ciudad</th><th>Estado</th></tr></thead><tbody>{locations.map((location) => <tr key={Number(location.id)}><td>{text(location.name)}</td><td>{text(location.city)}</td><td><Status value={location.active ? 'Activa' : 'Inactiva'}/></td></tr>)}</tbody></table> : <Empty/>}</Panel>
      <Panel title="Actividad reciente">{[...alerts, ...workOrders].length ? <table className="util-table"><thead><tr><th>Elemento</th><th>Estado</th></tr></thead><tbody>{alerts.slice(0,5).map((alert) => <tr key={`a-${alert.id}`}><td>{text(alert.title)}</td><td><Status value={alert.status}/></td></tr>)}{workOrders.slice(0,5).map((order) => <tr key={`w-${order.id}`}><td>{text(order.title)}</td><td><Status value={order.status}/></td></tr>)}</tbody></table> : <Empty/>}</Panel>
    </Modal>}
    <Loading show={loading}/>
  </>;
}
