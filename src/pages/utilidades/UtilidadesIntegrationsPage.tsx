/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cable, CloudDownload, DatabaseZap, Plus, RefreshCw, Upload } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import {
  DataView,
  Empty,
  ErrorBox,
  Kpi,
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

const PROVIDERS = [
  ['gbp', 'Google Business Profile'],
  ['ga4', 'Google Analytics 4'],
  ['gsc', 'Google Search Console'],
  ['email', 'Correo transaccional'],
  ['sms', 'SMS'],
] as const;

export default function UtilidadesIntegrationsPage() {
  const [searchParams] = useSearchParams();
  const requestedLocationId = Number(searchParams.get('locationId') || 0) || undefined;
  const [configs, setConfigs] = useState<Row[]>([]);
  const [snapshots, setSnapshots] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [readiness, setReadiness] = useState<Row>({});
  const [configDraft, setConfigDraft] = useState<Row | null>(null);
  const [snapshotDraft, setSnapshotDraft] = useState<Row | null>(null);
  const [payloadText, setPayloadText] = useState('{\n  "sessions": 0,\n  "conversions": 0\n}');
  const [settingsText, setSettingsText] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [integrationRows, snapshotRows, locationRows, status] = await Promise.all([
        utilidadesV15Api.integrations({ limit: 100, locationId: requestedLocationId }),
        utilidadesV15Api.providerSnapshots({ limit: 100, locationId: requestedLocationId }),
        utilidadesV15Api.locations({ limit: 100 }),
        utilidadesV15Api.readiness(),
      ]);
      setConfigs(integrationRows.items);
      setSnapshots(snapshotRows.items);
      setLocations(locationRows.items);
      setReadiness(status);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las integraciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const providerState = useMemo(() => asArray(readiness.providers) as Row[], [readiness]);

  async function saveConfig(event: FormEvent) {
    event.preventDefault();
    if (!configDraft) return;
    setLoading(true);
    try {
      let settings: Record<string, unknown> = {};
      try { settings = settingsText.trim() ? JSON.parse(settingsText) as Record<string, unknown> : {}; }
      catch { throw new Error('La configuración avanzada debe ser JSON válido.'); }
      await utilidadesV15Api.upsertIntegration({
        locationId: Number(configDraft.locationId),
        provider: configDraft.provider,
        mode: configDraft.mode,
        accountReference: configDraft.accountReference || undefined,
        settings,
      });
      setConfigDraft(null);
      setSuccess('Configuración guardada. El sistema no simula una conexión externa: manual y webhook se identifican por separado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la integración.');
      setLoading(false);
    }
  }

  async function sync(config: Row) {
    setLoading(true);
    try {
      await utilidadesV15Api.syncIntegration(Number(config.id));
      setSuccess(`${providerName(config.provider)} sincronizado mediante el webhook configurado en el backend.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo sincronizar la integración.');
      setLoading(false);
    }
  }

  async function importSnapshot(event: FormEvent) {
    event.preventDefault();
    if (!snapshotDraft) return;
    setLoading(true);
    try {
      let payload: Record<string, unknown>;
      try { payload = JSON.parse(payloadText) as Record<string, unknown>; }
      catch { throw new Error('Los indicadores importados deben ser un objeto JSON válido.'); }
      await utilidadesV15Api.importProviderSnapshot({
        locationId: Number(snapshotDraft.locationId),
        provider: snapshotDraft.provider,
        sourceName: snapshotDraft.sourceName || 'importación manual',
        periodStart: snapshotDraft.periodStart,
        periodEnd: snapshotDraft.periodEnd,
        payload,
      });
      setSnapshotDraft(null);
      setSuccess('Snapshot importado y KPI conocidos actualizados en PostgreSQL.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo importar el snapshot.');
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Datos y proveedores"
        title="Integraciones"
        subtitle={requestedLocationId ? 'Fuentes y datos del expediente seleccionado, con historial demostrativo verificable.' : 'Configuración por ubicación, importación manual verificable y adaptadores webhook.'}
      >
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
        <button
          className="util-btn"
          onClick={() => {
            setSnapshotDraft({
              locationId: requestedLocationId ?? locations[0]?.id ?? '',
              provider: 'ga4',
              sourceName: 'importación manual',
              periodStart: new Date().toISOString().slice(0, 10),
              periodEnd: new Date().toISOString().slice(0, 10),
            });
            setPayloadText('{\n  "sessions": 0,\n  "conversions": 0\n}');
          }}
        ><Upload size={14} />Importar datos</button>
        <button
          className="util-btn primary"
          onClick={() => {
            setConfigDraft({ locationId: requestedLocationId ?? locations[0]?.id ?? '', provider: 'gbp', mode: 'manual' });
            setSettingsText('{}');
          }}
        ><Plus size={14} />Configurar</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />

      <div className="util-kpis">
        {providerState.map((provider) => (
          <Kpi
            key={String(provider.provider)}
            label={providerName(provider.provider)}
            value={`${text(provider.connectedLocations, '0')}/${text(provider.totalLocations, '0')}`}
            helper={`${text(provider.configuredLocations, '0')} configuradas`}
            icon={<Cable size={17} />}
            tone={Number(provider.connectedLocations) > 0 ? 'success' : Number(provider.configuredLocations) > 0 ? 'warning' : 'neutral'}
          />
        ))}
      </div>

      <div className="util-notice">
        <b>Alcance real:</b> modo manual importa datos comprobables; modo webhook llama una URL definida en variables de entorno. Las API oficiales de Google y los proveedores de mensajería requieren credenciales propias.
      </div>

      <Panel title="Configuraciones por ubicación" subtitle="Estado, modo de operación, cuenta y última sincronización.">
        <div className="util-table-wrap">
          <table className="util-table">
            <thead><tr><th>Ubicación</th><th>Proveedor</th><th>Modo</th><th>Estado</th><th>Cuenta</th><th>Última sincronización</th><th /></tr></thead>
            <tbody>
              {configs.map((config) => (
                <tr key={Number(config.id)}>
                  <td>{text(config.locationName ?? config.locationId)}</td>
                  <td><b>{providerName(config.provider)}</b><div className="util-muted">{text(config.lastError, '')}</div></td>
                  <td><Status value={config.mode} /></td>
                  <td><Status value={config.status} /></td>
                  <td>{text(config.accountReference)}</td>
                  <td>{formatDate(config.lastSyncAt)}</td>
                  <td className="util-actions">
                    <button className="util-btn" onClick={() => { setConfigDraft({ ...config }); setSettingsText(JSON.stringify(config.settings ?? {}, null, 2)); }}>Editar</button>
                    {config.mode === 'webhook' ? <button className="util-btn primary" onClick={() => void sync(config)}><CloudDownload size={13} />Sincronizar</button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!configs.length ? <Empty title="Sin integraciones" text="Configura una ubicación en modo manual, desactivado o webhook." /> : null}
        </div>
      </Panel>

      <Panel title="Snapshots importados" subtitle="Histórico de datos externos almacenado en PostgreSQL.">
        <div className="util-table-wrap">
          <table className="util-table">
            <thead><tr><th>Periodo</th><th>Ubicación</th><th>Proveedor</th><th>Fuente</th><th>Indicadores</th></tr></thead>
            <tbody>
              {snapshots.map((snapshot) => (
                <tr key={Number(snapshot.id)}>
                  <td>{formatDate(snapshot.periodStart)} – {formatDate(snapshot.periodEnd)}</td>
                  <td>{text(snapshot.locationName ?? snapshot.locationId)}</td>
                  <td><Status value={snapshot.provider} /></td>
                  <td>{text(snapshot.sourceName)}</td>
                  <td><DataView value={snapshot.payload} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!snapshots.length ? <Empty title="Sin snapshots" text="Importa datos de GA4, GSC, GBP u otra fuente para alimentar los KPI." /> : null}
        </div>
      </Panel>

      {configDraft ? (
        <Modal title="Configurar integración" subtitle="La configuración se aplica solo a la ubicación seleccionada." onClose={() => setConfigDraft(null)} footer={<button className="util-btn primary" form="integration-form">Guardar</button>} wide>
          <form id="integration-form" className="util-formgrid" onSubmit={saveConfig}>
            <div className="util-field"><label>Ubicación</label><select required value={String(configDraft.locationId ?? '')} onChange={(e) => setConfigDraft({ ...configDraft, locationId: Number(e.target.value) })}>{locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>)}</select></div>
            <div className="util-field"><label>Proveedor</label><select value={String(configDraft.provider ?? 'gbp')} onChange={(e) => setConfigDraft({ ...configDraft, provider: e.target.value })}>{PROVIDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="util-field"><label>Modo</label><select value={String(configDraft.mode ?? 'manual')} onChange={(e) => setConfigDraft({ ...configDraft, mode: e.target.value })}><option value="disabled">Desactivado</option><option value="manual">Manual</option><option value="webhook">Webhook</option></select></div>
            <div className="util-field"><label>Cuenta o referencia</label><input value={String(configDraft.accountReference ?? '')} onChange={(e) => setConfigDraft({ ...configDraft, accountReference: e.target.value })} placeholder="ID de propiedad, cuenta o remitente" /></div>
            <div className="util-field util-wide"><label>Configuración JSON</label><textarea rows={8} value={settingsText} onChange={(e) => setSettingsText(e.target.value)} /></div>
          </form>
        </Modal>
      ) : null}

      {snapshotDraft ? (
        <Modal title="Importar snapshot" subtitle="Carga indicadores reales exportados desde un proveedor o sistema externo." onClose={() => setSnapshotDraft(null)} footer={<button className="util-btn primary" form="snapshot-form"><DatabaseZap size={14} />Importar</button>} wide>
          <form id="snapshot-form" className="util-formgrid" onSubmit={importSnapshot}>
            <div className="util-field"><label>Ubicación</label><select required value={String(snapshotDraft.locationId ?? '')} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, locationId: Number(e.target.value) })}>{locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>)}</select></div>
            <div className="util-field"><label>Proveedor</label><select value={String(snapshotDraft.provider ?? 'ga4')} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, provider: e.target.value })}>{PROVIDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="util-field"><label>Inicio</label><input required type="date" value={String(snapshotDraft.periodStart ?? '')} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, periodStart: e.target.value })} /></div>
            <div className="util-field"><label>Fin</label><input required type="date" value={String(snapshotDraft.periodEnd ?? '')} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, periodEnd: e.target.value })} /></div>
            <div className="util-field util-wide"><label>Nombre de fuente</label><input value={String(snapshotDraft.sourceName ?? '')} onChange={(e) => setSnapshotDraft({ ...snapshotDraft, sourceName: e.target.value })} /></div>
            <div className="util-field util-wide"><label>Indicadores JSON</label><textarea rows={12} required value={payloadText} onChange={(e) => setPayloadText(e.target.value)} /><small>Claves reconocidas: sessions, conversions, clicks, impressions, average_position, rating, live_citations y audit_score.</small></div>
          </form>
        </Modal>
      ) : null}
      <Loading show={loading} />
    </>
  );
}

function providerName(value: unknown) {
  const provider = String(value ?? '');
  return PROVIDERS.find(([key]) => key === provider)?.[1] ?? provider.toUpperCase();
}
