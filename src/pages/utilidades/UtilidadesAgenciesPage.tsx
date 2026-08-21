/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Loading, Modal, PageHead, Panel, Status, asArray, text } from './UtilidadesCommon';

export default function UtilidadesAgenciesPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.agencies({ search: query, limit: 50 });
      setItems(result.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando agencias.');
    } finally { setLoading(false); }
  }

  async function open(id: number) {
    setLoading(true);
    try { setDetail(await utilidadesV15Api.agencyDetail(id)); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo abrir la agencia.'); }
    finally { setLoading(false); }
  }

  // Carga controlada: el buscador se ejecuta con el botón/Enter, no en cada pulsación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { void load(); }, []);
  const agency = (detail?.agency ?? {}) as Row;
  const services = asArray(agency.services) as Row[];
  const orders = asArray(detail?.workOrders) as Row[];

  return <>
    <PageHead title="Agencias" subtitle="Servicios, reputación, capacidad y órdenes reales del Marketplace."><button className="util-btn" onClick={load}><RefreshCw size={14}/>Actualizar</button></PageHead>
    <ErrorBox message={error}/>
    <div className="util-toolbar"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void load()} placeholder="Nombre o especialidad"/><button className="util-btn primary" onClick={load}>Buscar</button></div>
    <div className="util-table-wrap"><table className="util-table"><thead><tr><th>Agencia</th><th>Especialidad</th><th>Rating</th><th>Servicios</th><th>Capacidad mensual</th><th>Precio inicial</th><th>Estado</th><th/></tr></thead><tbody>{items.map((item) => <tr key={Number(item.id)}><td><b>{text(item.name)}</b><div className="util-muted">{text(item.city)}</div></td><td>{text(item.speciality)}</td><td>★ {text(item.rating)} ({text(item.reviews_count)})</td><td>{text(item.service_count)}</td><td>{text(item.monthly_capacity)}</td><td>USD {text(item.starting_price)}</td><td><Status value={item.status}/></td><td><button className="util-btn" onClick={() => void open(Number(item.id))}><Eye size={13}/>Abrir</button></td></tr>)}</tbody></table>{!items.length && <Empty/>}</div>
    {detail && <Modal title={text(agency.name)} onClose={() => setDetail(null)}>
      <div className="util-grid2"><Panel title="Perfil"><table className="util-table"><tbody><tr><th>Especialidad</th><td>{text(agency.speciality)}</td></tr><tr><th>Ciudad</th><td>{text(agency.city)}</td></tr><tr><th>Rating</th><td>★ {text(agency.rating)} ({text(agency.reviews_count)})</td></tr><tr><th>Respuesta</th><td>{text(agency.response_time_hours)} horas</td></tr></tbody></table></Panel><Panel title="Carga"><div className="util-kpis compact"><div className="util-kpi"><strong>{services.length}</strong><span>Servicios</span></div><div className="util-kpi"><strong>{orders.length}</strong><span>Órdenes visibles</span></div></div></Panel></div>
      <Panel title="Servicios activos">{services.length ? <table className="util-table"><thead><tr><th>Servicio</th><th>Precio</th><th>Entrega</th><th>Capacidad</th><th>Estado</th></tr></thead><tbody>{services.map((service) => <tr key={Number(service.agencyServiceId)}><td>{text(service.serviceName)}</td><td>{text(service.currencyCode)} {text(service.price)}</td><td>{text(service.deliveryDays)} días</td><td>{text(service.capacityMonthly)}</td><td><Status value={service.status}/></td></tr>)}</tbody></table> : <Empty/>}</Panel>
      <Panel title="Órdenes recientes">{orders.length ? <table className="util-table"><thead><tr><th>Orden</th><th>Ubicación</th><th>Estado</th><th>Valor</th></tr></thead><tbody>{orders.map((order) => <tr key={Number(order.id)}><td>{text(order.title)}</td><td>{text(order.locationName)}</td><td><Status value={order.status}/></td><td>{text(order.currencyCode)} {text(order.amount)}</td></tr>)}</tbody></table> : <Empty/>}</Panel>
    </Modal>}
    <Loading show={loading}/>
  </>;
}
