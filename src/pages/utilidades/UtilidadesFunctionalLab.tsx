/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  FlaskConical,
  Play,
  RefreshCw,
  ShieldCheck,
  TestTube2,
  XCircle,
} from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import {
  ErrorBox,
  Loading,
  Progress,
  Status,
  SuccessBox,
  asArray,
  formatDate,
  text,
} from './UtilidadesCommon';

export default function UtilidadesFunctionalLab() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Row[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [status, setStatus] = useState<Row>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selfTest, setSelfTest] = useState<Row | null>(null);

  async function load(preferredId?: number | null) {
    try {
      const locationResponse = await utilidadesV15Api.locations({ limit: 100 });
      const rows = asArray(locationResponse.items) as Row[];
      setLocations(rows);
      const demo = rows.find((row) => String(row.reference) === 'UTIL-DEMO-001');
      const fallbackId = Number(demo?.id ?? rows[0]?.id ?? 0) || null;
      const resolved = preferredId ?? locationId ?? fallbackId;
      setLocationId(resolved);
      if (resolved) setStatus(await utilidadesV15Api.labStatus(resolved));
      else setStatus(await utilidadesV15Api.labStatus());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el laboratorio funcional.');
    }
  }

  useEffect(() => { void load(); }, []);

  const tools = asArray(status.tools) as Row[];
  const ready = Number(status.ready ?? tools.filter((tool) => Boolean(tool.ready)).length);
  const total = Number(status.total ?? tools.length);
  const coverage = total ? Math.round((ready / total) * 100) : 0;

  const selectedLocationName = useMemo(() => {
    return text(locations.find((row) => Number(row.id) === locationId)?.name, text(status.locationName, 'Ubicación'));
  }, [locations, locationId, status.locationName]);

  async function runTool(tool: Row) {
    if (!locationId) return;
    const code = String(tool.code);
    setBusy(code);
    setSuccess(null);
    setSelfTest(null);
    try {
      const response = await utilidadesV15Api.labRun(locationId, code);
      setSuccess(`${text(response.toolName, code)} ejecutada correctamente y guardada en PostgreSQL.`);
      await load(locationId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `No se pudo ejecutar ${code}.`);
    } finally {
      setBusy(null);
    }
  }

  async function runAll() {
    if (!locationId) return;
    setBusy('all');
    setSuccess(null);
    setSelfTest(null);
    try {
      const result = await utilidadesV15Api.labRunAll(locationId);
      const passed = Number(result.passed ?? 0);
      const resultTotal = Number(result.total ?? 0);
      if (result.ok) setSuccess(`Suite funcional completada: ${passed}/${resultTotal} utilidades operativas.`);
      else setError(`La suite terminó con ${Number(result.failed ?? 0)} utilidad(es) pendiente(s). Abre cada tarjeta para repetirla individualmente.`);
      await load(locationId);
      const test = await utilidadesV15Api.labSelfTest(locationId);
      setSelfTest(test);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo ejecutar la suite funcional.');
    } finally {
      setBusy(null);
    }
  }

  async function testAll() {
    if (!locationId) return;
    setBusy('test');
    setSuccess(null);
    try {
      const test = await utilidadesV15Api.labSelfTest(locationId);
      setSelfTest(test);
      if (test.ok) setSuccess(`Autoprueba aprobada: ${text(test.toolCoverage)} herramientas con datos persistentes y workspace completo.`);
      else setError(`Autoprueba incompleta. Herramientas pendientes: ${asArray(test.failedTools).join(', ') || 'revisar workspace'}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo ejecutar la autoprueba.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="util-functional-lab">
      <div className="util-lab-head">
        <div>
          <span className="util-eyebrow"><FlaskConical size={14} /> Local Lab V20</span>
          <h2>Centro de pruebas funcionales de Utilidades</h2>
          <p>
            Ejecuta cada módulo con un proveedor local persistente. No necesita claves externas para probar flujos, datos, estados y reportes; los webhooks y APIs reales siguen disponibles para producción.
          </p>
        </div>
        <div className="util-lab-actions">
          <select
            className="util-lab-select"
            value={locationId ?? ''}
            onChange={(event) => {
              const value = Number(event.target.value);
              setLocationId(value);
              setSelfTest(null);
              void load(value);
            }}
          >
            {locations.map((location) => <option key={Number(location.id)} value={Number(location.id)}>{text(location.name)}</option>)}
          </select>
          <button className="util-btn" disabled={!locationId || !!busy} onClick={() => void load(locationId)}><RefreshCw size={14} />Actualizar</button>
          <button className="util-btn primary" disabled={!locationId || !!busy} onClick={() => void runAll()}><Play size={14} />{busy === 'all' ? 'Ejecutando…' : 'Probar todas'}</button>
          <button className="util-btn red" disabled={!locationId || !!busy} onClick={() => void testAll()}><TestTube2 size={14} />Autoprueba</button>
        </div>
      </div>

      <ErrorBox message={error} onRetry={() => load(locationId)} />
      <SuccessBox message={success} />

      <div className="util-lab-summary">
        <div><strong>{selectedLocationName}</strong><span>Ubicación de validación</span></div>
        <div><strong>{ready}/{total}</strong><span>Utilidades con datos funcionales</span></div>
        <div><strong>{coverage}%</strong><span>Cobertura del laboratorio</span></div>
        <div><strong>{text(status.mode, 'local_lab')}</strong><span>Proveedor de pruebas</span></div>
      </div>
      <Progress value={coverage} label="Cobertura funcional persistida" />

      {selfTest ? (
        <div className={`util-lab-selftest ${selfTest.ok ? 'ok' : 'fail'}`}>
          {selfTest.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <div>
            <strong>{selfTest.ok ? 'Autoprueba aprobada' : 'Autoprueba con pendientes'}</strong>
            <span>Cobertura {text(selfTest.toolCoverage)} · comprobado {formatDate(selfTest.checkedAt)}</span>
          </div>
          <Status value={selfTest.ok ? 'passed' : 'warning'} />
        </div>
      ) : null}

      <div className="util-lab-grid">
        {tools.map((tool) => {
          const code = String(tool.code);
          const isReady = Boolean(tool.ready);
          return (
            <article className={`util-lab-card ${isReady ? 'ready' : 'pending'}`} key={code}>
              <div className="util-lab-card-top">
                <span className="util-lab-icon">{isReady ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}</span>
                <Status value={isReady ? 'connected' : 'not_configured'} />
              </div>
              <h3>{text(tool.name, code)}</h3>
              <p>{text(tool.description)}</p>
              <div className="util-lab-meta">
                <span><b>{text(tool.count, '0')}</b> registros/pruebas</span>
                <span>{tool.lastRun ? `Última: ${formatDate(tool.lastRun)}` : 'Sin ejecución registrada'}</span>
                {tool.note ? <span>{text(tool.note)}</span> : null}
              </div>
              <div className="util-lab-card-actions">
                <button className="util-btn primary" disabled={!!busy} onClick={() => void runTool(tool)}><Play size={13} />{busy === code ? 'Ejecutando…' : 'Probar'}</button>
                <button className="util-btn" disabled={!isReady} onClick={() => navigate(String(tool.route))}>Abrir utilidad</button>
              </div>
            </article>
          );
        })}
      </div>
      <Loading show={!!busy} label={busy === 'all' ? 'Ejecutando la suite funcional completa…' : 'Ejecutando utilidad y guardando resultados…'} />
    </section>
  );
}
