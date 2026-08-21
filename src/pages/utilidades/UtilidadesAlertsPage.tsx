/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import {
  Empty,
  ErrorBox,
  Loading,
  Modal,
  PageHead,
  Status,
  SuccessBox,
  formatDate,
  text,
} from './UtilidadesCommon';

export default function UtilidadesAlertsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [action, setAction] = useState<Row | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await utilidadesV15Api.alerts({
        search: query,
        status,
        limit: 100,
      });
      const filtered = severity
        ? response.items.filter(
            (item) => String(item.severity).toLowerCase() === severity
          )
        : response.items;
      setItems(filtered);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar las alertas.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status, severity]);

  async function acknowledge(id: number) {
    setLoading(true);
    setError(null);
    try {
      await utilidadesV15Api.ackAlert(id);
      setSuccess('Alerta reconocida.');
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo reconocer la alerta.'
      );
      setLoading(false);
    }
  }

  async function resolve(id: number) {
    setLoading(true);
    setError(null);
    try {
      await utilidadesV15Api.resolveAlert(id);
      setSuccess('Alerta resuelta correctamente.');
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo resolver la alerta.'
      );
      setLoading(false);
    }
  }

  async function createAction(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setLoading(true);
    setError(null);
    try {
      await utilidadesV15Api.createAction(action);
      setAction(null);
      setSuccess('Acción creada desde la alerta.');
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo crear la acción.'
      );
      setLoading(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Control de incidencias"
        title="Bandeja de alertas"
        subtitle="Reconoce, resuelve o convierte alertas verificables en acciones con trazabilidad."
      >
        <button className="util-btn subtle" onClick={load}>
          <RefreshCw size={15} />
          Actualizar
        </button>
      </PageHead>

      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />

      <div className="util-toolbar">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void load()}
          placeholder="Buscar por título o descripción"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="open">Abiertas</option>
          <option value="acknowledged">Reconocidas</option>
          <option value="resolved">Resueltas</option>
        </select>
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
        >
          <option value="">Todas las severidades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <button className="util-btn primary" onClick={load}>
          Buscar
        </button>
      </div>

      <div className="util-table-wrap">
        <table className="util-table">
          <thead>
            <tr>
              <th>Alerta</th>
              <th>Ubicación</th>
              <th>Severidad</th>
              <th>Categoría</th>
              <th>Creada</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={Number(item.id)}>
                <td>
                  <strong>{text(item.title)}</strong>
                  <span className="util-table-sub">{text(item.description)}</span>
                </td>
                <td>{text(item.locationName ?? item.locationId, 'Global')}</td>
                <td>
                  <Status value={item.severity} />
                </td>
                <td>{text(item.category)}</td>
                <td>{formatDate(item.createdAt)}</td>
                <td>
                  <Status value={item.status} />
                </td>
                <td>
                  <div className="util-actions">
                    {item.locationId ? (
                      <button
                        className="util-icon-btn"
                        aria-label="Abrir ubicación"
                        onClick={() =>
                          navigate(
                            `/utilidades/ubicaciones/${item.locationId}/resumen`
                          )
                        }
                      >
                        <Eye size={14} />
                      </button>
                    ) : null}
                    {item.status === 'open' ? (
                      <button
                        className="util-btn subtle"
                        onClick={() => acknowledge(Number(item.id))}
                      >
                        Reconocer
                      </button>
                    ) : null}
                    {item.status !== 'resolved' ? (
                      <button
                        className="util-btn subtle"
                        onClick={() => resolve(Number(item.id))}
                      >
                        <CheckCircle2 size={13} />
                        Resolver
                      </button>
                    ) : null}
                    <button
                      className="util-btn primary"
                      onClick={() =>
                        setAction({
                          locationId: item.locationId,
                          alertId: item.id,
                          title: item.title,
                          description: item.description,
                          priority: item.severity,
                          status: 'open',
                        })
                      }
                    >
                      <Plus size={13} />
                      Crear acción
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!items.length ? (
          <Empty
            title="No hay alertas en este filtro"
            text="Cuando una herramienta detecte un hallazgo o se registre una incidencia, aparecerá aquí."
          />
        ) : null}
      </div>

      {action ? (
        <Modal
          title="Crear acción desde alerta"
          subtitle="La acción conservará el vínculo con la alerta y la ubicación."
          onClose={() => setAction(null)}
          footer={
            <>
              <button className="util-btn subtle" onClick={() => setAction(null)}>
                Cancelar
              </button>
              <button className="util-btn primary" form="alert-action">
                Crear acción
              </button>
            </>
          }
        >
          <form
            id="alert-action"
            onSubmit={createAction}
            className="util-formgrid"
          >
            <div className="util-field util-wide">
              <label>Título *</label>
              <input
                required
                value={String(action.title ?? '')}
                onChange={(event) =>
                  setAction({ ...action, title: event.target.value })
                }
              />
            </div>
            <div className="util-field">
              <label>Prioridad</label>
              <select
                value={String(action.priority ?? 'medium')}
                onChange={(event) =>
                  setAction({ ...action, priority: event.target.value })
                }
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div className="util-field">
              <label>Fecha límite</label>
              <input
                type="date"
                value={String(action.dueDate ?? '')}
                onChange={(event) =>
                  setAction({ ...action, dueDate: event.target.value })
                }
              />
            </div>
            <div className="util-field util-wide">
              <label>Descripción</label>
              <textarea
                value={String(action.description ?? '')}
                onChange={(event) =>
                  setAction({ ...action, description: event.target.value })
                }
              />
            </div>
          </form>
        </Modal>
      ) : null}

      <Loading show={loading} />
    </>
  );
}
