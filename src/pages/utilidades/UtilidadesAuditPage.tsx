/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { FormEvent, useEffect, useState } from 'react';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { utilidadesV15Api, type Row } from '@/services/utilidadesApi';
import { DataView, Empty, ErrorBox, Loading, Modal, PageHead, Status, formatDate, text } from './UtilidadesCommon';

export default function UtilidadesAuditPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(query = search) {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.audit({ limit: 100, search: query });
      setItems(result.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la auditoría.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(''); }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load(search);
  }

  return (
    <>
      <PageHead eyebrow="Trazabilidad" title="Auditoría de Utilidades" subtitle="Registro de cambios, transiciones, importaciones, aprobaciones y operaciones sensibles.">
        <button className="util-btn" onClick={() => void load()}><RefreshCw size={14} />Actualizar</button>
      </PageHead>
      <ErrorBox message={error} onRetry={load} />
      <form className="util-toolbar" onSubmit={submit}>
        <div className="util-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar acción o entidad" /></div>
        <button className="util-btn primary">Buscar</button>
      </form>
      <div className="util-table-wrap">
        <table className="util-table">
          <thead><tr><th>Fecha</th><th>Acción</th><th>Entidad</th><th>Registro</th><th>Actor</th><th /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={Number(item.id)}>
                <td>{formatDate(item.createdAt)}</td>
                <td><Status value={item.action} /></td>
                <td>{text(item.entityName)}</td>
                <td>{text(item.entityId)}</td>
                <td>{text(item.actorUserAccountId)}</td>
                <td><button className="util-btn" onClick={() => setSelected(item)}><ShieldCheck size={13} />Ver evidencia</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <Empty title="Sin eventos" text="Todavía no hay operaciones de Utilidades que coincidan con el filtro." /> : null}
      </div>
      {selected ? (
        <Modal title="Detalle de auditoría" subtitle={`${text(selected.action)} · ${formatDate(selected.createdAt)}`} onClose={() => setSelected(null)} wide>
          <DataView value={{
            entidad: selected.entityName,
            registro: selected.entityId,
            actor: selected.actorUserAccountId,
            ip: selected.ipAddress,
            payload: selected.payload,
          }} />
        </Modal>
      ) : null}
      <Loading show={loading} />
    </>
  );
}
