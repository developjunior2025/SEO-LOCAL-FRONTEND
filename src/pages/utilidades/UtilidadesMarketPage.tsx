/* eslint-disable react-hooks/set-state-in-effect */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Coins, Plus, RefreshCw } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { Empty, ErrorBox, Kpi, Loading, Modal, PageHead, Panel, Status, SuccessBox, asArray, formatDate, formatMoney, text } from './UtilidadesCommon';

export default function UtilidadesMarketPage() {
  const [summary, setSummary] = useState<Row>({});
  const [services, setServices] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [catalog, market, locationRows] = await Promise.all([
        utilidadesV15Api.market(),
        utilidadesV15Api.marketSummary(),
        utilidadesV15Api.locations({ limit: 100 }),
      ]);
      setServices(asArray(catalog.items) as Row[]);
      setSummary(market);
      setLocations(locationRows.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el Mercado de Servicios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const balances = useMemo(() => Object.entries((summary.creditBalances as Record<string, number> | undefined) ?? {}), [summary]);
  const movements = asArray(summary.recentCreditMovements) as Row[];

  async function addMovement(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setLoading(true);
    try {
      const result = await utilidadesV15Api.addCreditMovement({
        locationId: Number(draft.locationId),
        amount: Number(draft.amount),
        currencyCode: String(draft.currencyCode || 'USD').toUpperCase(),
        type: draft.type,
        description: draft.description || undefined,
        reference: draft.reference || undefined,
      });
      setDraft(null);
      setSuccess(`Movimiento registrado. Nuevo saldo: ${text(result.balance)}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar el movimiento.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead eyebrow="Servicios y créditos" title="Mercado de Servicios" subtitle="Catálogo FUR-S, agencias, capacidad, cotizaciones y billeteras separadas por moneda.">
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
        <button className="util-btn primary" onClick={() => setDraft({ locationId: locations[0]?.id ?? '', amount: 0, currencyCode: 'USD', type: 'credit' })}><Plus size={14} />Movimiento de crédito</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />

      <div className="util-kpis">
        {balances.length ? balances.map(([currency, value]) => <Kpi key={currency} label={`Saldo ${currency}`} value={formatMoney(value, currency)} icon={<Coins size={17} />} tone={value >= 0 ? 'success' : 'danger'} />) : <Kpi label="Créditos" value="No configurados" helper="Registra un movimiento para activar la billetera" />}
        <Kpi label="Ubicaciones" value={text(summary.locations)} />
        <Kpi label="Alertas abiertas" value={text(summary.openAlerts)} />
        <Kpi label="Acciones abiertas" value={text(summary.openActions)} />
        <Kpi label="Órdenes activas" value={text(summary.activeWorkOrders)} />
      </div>
      <div className="util-notice">Cada cotización se valida y debita en su moneda exacta. No se suman USD, EUR u otras monedas en un mismo saldo.</div>

      <Panel title="Catálogo activo" subtitle="Servicios publicados por agencias activas y con oferta disponible.">
        <div className="util-table-wrap"><table className="util-table"><thead><tr><th>Servicio FUR-S</th><th>Agencia</th><th>Rating</th><th>Alcance</th><th>Precio</th><th>Entrega</th><th>Capacidad</th><th>Estado</th></tr></thead><tbody>{services.map((service) => <tr key={String(service.agency_service_id)}><td><b>{text(service.name)}</b><div className="util-muted">{text(service.code)} · {text(service.sla_summary)}</div></td><td>{text(service.agency_name)}</td><td>★ {text(service.rating)}</td><td style={{ maxWidth: 280 }}>{text(service.scope)}</td><td>{formatMoney(service.price, String(service.currency_code || 'USD'))}</td><td>{text(service.agency_delivery_days)} días</td><td>{text(service.capacity_monthly)}</td><td><Status value={service.agency_status} /></td></tr>)}</tbody></table>{!services.length ? <Empty text="No hay combinaciones activas de servicios y agencias." /> : null}</div>
      </Panel>

      <Panel title="Libro de créditos" subtitle="Movimientos auditables por ubicación y moneda.">
        <div className="util-table-wrap"><table className="util-table"><thead><tr><th>Fecha</th><th>Ubicación</th><th>Tipo</th><th>Descripción</th><th>Referencia</th><th>Importe</th></tr></thead><tbody>{movements.map((movement) => <tr key={Number(movement.id)}><td>{formatDate(movement.createdAt)}</td><td>{text(movement.locationName ?? movement.locationId)}</td><td><Status value={movement.type} /></td><td>{text(movement.description)}</td><td>{text(movement.reference)}</td><td>{formatMoney(movement.amount, String(movement.currencyCode || 'USD'))}</td></tr>)}</tbody></table>{!movements.length ? <Empty title="Sin movimientos" text="La billetera todavía no tiene créditos, débitos, ajustes o reembolsos." /> : null}</div>
      </Panel>

      <div className="util-notice">Las cotizaciones se crean desde una acción para mantener el flujo hallazgo → acción → servicio → agencia → Orden de Trabajo.</div>

      {draft ? <Modal title="Registrar movimiento" subtitle="El movimiento se almacena en el libro contable y actualiza el saldo de la moneda seleccionada." onClose={() => setDraft(null)} footer={<button className="util-btn primary" form="credit-form">Registrar</button>} wide><form id="credit-form" onSubmit={addMovement} className="util-formgrid"><div className="util-field"><label>Ubicación</label><select required value={String(draft.locationId ?? '')} onChange={(e) => setDraft({ ...draft, locationId: Number(e.target.value) })}>{locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>)}</select></div><div className="util-field"><label>Tipo</label><select value={String(draft.type ?? 'credit')} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="credit">Crédito</option><option value="debit">Débito</option><option value="adjustment">Ajuste</option><option value="refund">Reembolso</option></select></div><div className="util-field"><label>Importe</label><input required type="number" step="0.01" value={String(draft.amount ?? 0)} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></div><div className="util-field"><label>Moneda ISO</label><input required maxLength={3} value={String(draft.currencyCode ?? 'USD')} onChange={(e) => setDraft({ ...draft, currencyCode: e.target.value.toUpperCase() })} /></div><div className="util-field util-wide"><label>Descripción</label><input value={String(draft.description ?? '')} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div><div className="util-field util-wide"><label>Referencia</label><input value={String(draft.reference ?? '')} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} /></div></form></Modal> : null}
      <Loading show={loading} />
    </>
  );
}
