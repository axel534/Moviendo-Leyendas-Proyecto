import { FormEvent, useEffect, useState } from 'react';
import { staffManageApi, StaffMember } from './api';
import './AdminEquipo.css';

interface Props {
  onBack: () => void;
  currentId: string;
}

export default function AdminEquipo({ onBack, currentId }: Props) {
  const [list, setList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'owner' | 'admin'>('admin');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await staffManageApi.list();
    setLoading(false);
    if (res.success && res.data) setList(res.data);
    else setErr(res.error ?? '—');
  }

  useEffect(() => { refresh(); }, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await staffManageApi.create({ email, password, nombre, rol });
    setSaving(false);
    if (res.success) {
      setEmail(''); setPassword(''); setNombre(''); setRol('admin'); setShowForm(false);
      refresh();
    } else {
      setErr(res.error ?? 'No se pudo crear');
    }
  }

  async function toggleActivo(m: StaffMember) {
    if (m.id === currentId) return;
    const res = await staffManageApi.update(m.id, { activo: !m.activo });
    if (res.success) refresh();
  }

  async function cambiarRol(m: StaffMember, nuevoRol: 'owner' | 'admin') {
    if (m.id === currentId) return;
    const res = await staffManageApi.update(m.id, { rol: nuevoRol });
    if (res.success) refresh();
    else setErr(res.error ?? 'No se pudo cambiar el rol');
  }

  async function eliminar(m: StaffMember) {
    if (m.id === currentId) return;
    if (!confirm(`¿Eliminar a ${m.nombre}? Esta acción no se puede deshacer.`)) return;
    const res = await staffManageApi.remove(m.id);
    if (res.success) refresh();
    else setErr(res.error ?? 'No se pudo eliminar');
  }

  return (
    <div className="adm equ">
      <div className="adm-shell">
        <div className="adm-header">
          <div>
            <div className="adm-title">Equipo</div>
            <div className="adm-subtitle">Gestión de staff (owner + admin)</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="adm-logout" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancelar' : 'Agregar persona'}
            </button>
            <button className="adm-logout" onClick={onBack}>← Volver</button>
          </div>
        </div>

        {showForm && (
          <form className="equ-form" onSubmit={crear}>
            <div className="ml-eyebrow">Nueva persona</div>
            <div className="equ-form-grid">
              <div className="ml-field">
                <label className="ml-label">Nombre</label>
                <input className="ml-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. María López" />
              </div>
              <div className="ml-field">
                <label className="ml-label">Correo</label>
                <input className="ml-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="ml-field">
                <label className="ml-label">Contraseña</label>
                <input className="ml-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="ml-field">
                <label className="ml-label">Rol</label>
                <select className="ml-input" value={rol} onChange={(e) => setRol(e.target.value as 'owner' | 'admin')}>
                  <option value="admin">Admin (modera)</option>
                  <option value="owner">Owner (todo el control)</option>
                </select>
              </div>
            </div>
            {err && <div className="adm-gate-error" style={{ marginTop: 12 }}>{err}</div>}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="ml-btn ml-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="ml-btn ml-btn-primary" disabled={saving || !email || !password || !nombre}>
                {saving ? 'Creando…' : 'Crear acceso'}
              </button>
            </div>
          </form>
        )}

        {loading && <div className="adm-loading">Cargando equipo…</div>}

        {!loading && (
          <div className="equ-list">
            {list.map((m) => (
              <div className="equ-row" key={m.id}>
                <div className="equ-avatar">{m.nombre.charAt(0)}</div>
                <div className="equ-info">
                  <div className="equ-name">
                    {m.nombre}
                    {m.id === currentId && <span className="equ-self">tú</span>}
                  </div>
                  <div className="equ-email">{m.email}</div>
                </div>
                <div className="equ-rol">
                  <select
                    className="adm-gate-input"
                    style={{ margin: 0, fontSize: 12, padding: '6px 10px' }}
                    value={m.rol}
                    onChange={(e) => cambiarRol(m, e.target.value as 'owner' | 'admin')}
                    disabled={m.id === currentId}
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div className="equ-estado">
                  <span className={`adm-badge ${m.activo ? 'adm-badge-aprobado' : 'adm-badge-rechazado'}`}>
                    {m.activo ? 'activo' : 'pausado'}
                  </span>
                </div>
                <div className="equ-actions">
                  <button className="adm-btn adm-btn-reject" onClick={() => toggleActivo(m)} disabled={m.id === currentId}>
                    {m.activo ? 'Pausar' : 'Reactivar'}
                  </button>
                  <button className="adm-btn adm-btn-reject" onClick={() => eliminar(m)} disabled={m.id === currentId}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
