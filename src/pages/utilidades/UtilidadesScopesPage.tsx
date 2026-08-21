/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Shield, Trash2 } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { useAppState } from '@/state/useAppState';
import { Empty, ErrorBox, Loading, Modal, PageHead, Status, SuccessBox, asArray, text } from './UtilidadesCommon';

const PERMISSIONS = [
  'utilidades.read',
  'utilidades.manage',
  'utilidades.locations.read',
  'utilidades.locations.manage',
  'utilidades.alerts.read',
  'utilidades.alerts.manage',
  'utilidades.actions.manage',
  'utilidades.cases.read',
  'utilidades.cases.manage',
  'utilidades.campaigns.read',
  'utilidades.campaigns.manage',
  'utilidades.integrations.read',
  'utilidades.integrations.manage',
  'utilidades.work_orders.read',
  'utilidades.work_orders.manage',
  'utilidades.audit.read',
] as const;

export default function UtilidadesScopesPage() {
  const { user } = useAppState();
  const [items, setItems] = useState<Row[]>([]);
  const [options, setOptions] = useState<Row>({});
  const [draft, setDraft] = useState<Row | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['utilidades.read']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isSuperadmin = user?.roleCode === 'superadmin';

  async function load() {
    if (!isSuperadmin) { setLoading(false); return; }
    setLoading(true);
    try {
      const [scopeRows, optionRows] = await Promise.all([utilidadesV15Api.scopes(), utilidadesV15Api.scopeOptions()]);
      setItems(scopeRows.items);
      setOptions(optionRows);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los alcances.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [isSuperadmin]);

  const users = useMemo(() => asArray(options.users) as Row[], [options]);
  const locations = useMemo(() => asArray(options.locations) as Row[], [options]);
  const clients = useMemo(() => asArray(options.clients) as Row[], [options]);
  const agencies = useMemo(() => asArray(options.agencies) as Row[], [options]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const targetType = String(draft.targetType ?? 'location');
    const targetId = Number(draft.targetId);
    setLoading(true);
    try {
      await utilidadesV15Api.createScope({
        userAccountId: Number(draft.userAccountId),
        locationId: targetType === 'location' ? targetId : undefined,
        clientProfileId: targetType === 'client' ? targetId : undefined,
        agencyProfileId: targetType === 'agency' ? targetId : undefined,
        permissions: selectedPermissions,
      });
      setDraft(null);
      setSuccess('Alcance guardado. Los permisos se aplican solamente al objetivo seleccionado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el alcance.');
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('¿Eliminar este alcance?')) return;
    setLoading(true);
    try {
      await utilidadesV15Api.deleteScope(id);
      setSuccess('Alcance eliminado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el alcance.');
      setLoading(false);
    }
  }

  if (!isSuperadmin) {
    return (
      <>
        <PageHead eyebrow="Seguridad" title="Alcances y permisos" subtitle="Esta sección está reservada para Superadmin." />
        <div className="util-notice"><Shield size={16} /> Tu rol actual puede usar los módulos autorizados, pero no administrar el alcance de otros usuarios.</div>
      </>
    );
  }

  return (
    <>
      <PageHead eyebrow="Seguridad multiusuario" title="Alcances y permisos" subtitle="Control por ubicación, cliente o agencia, con permisos de lectura y administración.">
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
        <button className="util-btn primary" onClick={() => { setDraft({ userAccountId: users[0]?.id ?? '', targetType: 'location', targetId: locations[0]?.id ?? '' }); setSelectedPermissions(['utilidades.read']); }}><Plus size={14} />Nuevo alcance</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <SuccessBox message={success} />
      <div className="util-table-wrap">
        <table className="util-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Objetivo</th><th>Permisos</th><th /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={Number(item.id)}>
                <td><b>{text(item.email)}</b><div className="util-muted">{text(item.display_name)}</div></td>
                <td><Status value="scope" /></td>
                <td>{text(item.location_name || item.client_name || item.agency_name)}</td>
                <td>{(asArray(item.permissions) as string[]).length ? (asArray(item.permissions) as string[]).join(' · ') : 'Acceso completo dentro del objetivo'}</td>
                <td><button className="util-btn danger" onClick={() => void remove(Number(item.id))}><Trash2 size={13} />Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <Empty title="Sin alcances" text="Los usuarios Utilidades necesitan al menos un alcance, salvo Superadmin." /> : null}
      </div>

      {draft ? (
        <Modal title="Configurar alcance" subtitle="Selecciona exactamente un objetivo y los permisos correspondientes." onClose={() => setDraft(null)} footer={<button className="util-btn primary" form="scope-form">Guardar</button>} wide>
          <form id="scope-form" className="util-formgrid" onSubmit={save}>
            <div className="util-field util-wide"><label>Usuario</label><select required value={String(draft.userAccountId ?? '')} onChange={(e) => setDraft({ ...draft, userAccountId: Number(e.target.value) })}>{users.map((row) => <option key={Number(row.id)} value={Number(row.id)}>{text(row.email)} · {text(row.role_code)}</option>)}</select></div>
            <div className="util-field"><label>Tipo de objetivo</label><select value={String(draft.targetType ?? 'location')} onChange={(e) => { const type = e.target.value; const list = type === 'client' ? clients : type === 'agency' ? agencies : locations; setDraft({ ...draft, targetType: type, targetId: list[0]?.id ?? '' }); }}><option value="location">Ubicación</option><option value="client">Cliente</option><option value="agency">Agencia</option></select></div>
            <div className="util-field"><label>Objetivo</label><select required value={String(draft.targetId ?? '')} onChange={(e) => setDraft({ ...draft, targetId: Number(e.target.value) })}>{(draft.targetType === 'client' ? clients : draft.targetType === 'agency' ? agencies : locations).map((row) => <option key={Number(row.id)} value={Number(row.id)}>{text(row.name ?? row.company_name)}</option>)}</select></div>
            <div className="util-field util-wide"><label>Permisos</label><div className="util-check-grid">{PERMISSIONS.map((permission) => <label key={permission} className="util-check"><input type="checkbox" checked={selectedPermissions.includes(permission)} onChange={(e) => setSelectedPermissions(e.target.checked ? [...selectedPermissions, permission] : selectedPermissions.filter((value) => value !== permission))} /><span>{permission}</span></label>)}</div></div>
          </form>
        </Modal>
      ) : null}
      <Loading show={loading} />
    </>
  );
}
