import { useEffect, useMemo, useState } from 'react';
import {
  adminApi,
  clearToken,
  getSession,
  getToken,
  setSession,
  setToken,
  staffAuthApi,
  StaffSession,
} from './api';
import type {
  Decision,
  Estado,
  FiltroEstado,
  Marca,
  Talento,
} from './types';
import AdminStats from './AdminStats';
import AdminEquipo from './AdminEquipo';
import AdminIntegraciones from './AdminIntegraciones';
import './AdminPage.css';

type Tab = 'talentos' | 'marcas';
type View = 'panel' | 'stats' | 'equipo' | 'integraciones';

function AdminGate({ onAuth }: { onAuth: (s: StaffSession) => void }) {
  const [email, setEmail] = useState('torres.rivera.axel@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await staffAuthApi.login(email, password);
    setLoading(false);
    if (res.success && res.data) {
      setToken(res.data.token);
      setSession(res.data.staff);
      onAuth(res.data.staff);
    } else {
      setError(res.error ?? 'No se pudo iniciar sesión');
    }
  }

  return (
    <div className="adm-gate">
      <form className="adm-gate-card" onSubmit={handleSubmit}>
        <div className="adm-gate-title">Backoffice</div>
        <div className="adm-gate-sub">Moviendo Leyendas — acceso staff</div>
        <input
          className="adm-gate-input"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          className="adm-gate-input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="adm-gate-error">{error}</div>}
        <button className="adm-gate-btn" type="submit" disabled={loading || !email || !password}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--ml-text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
          Owner demo: torres.rivera.axel@gmail.com / moviendo2026<br/>
          Admin demo: marco@moviendoleyendas.com / admin2026
        </div>
      </form>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: Estado }) {
  if (estado === 'pendiente') return null;
  return <span className={`adm-badge adm-badge-${estado}`}>{estado}</span>;
}

function TalentoCard({ t, onDecide }: { t: Talento; onDecide: (d: Decision) => void }) {
  return (
    <div className="adm-card">
      {t.foto_url
        ? <img className="adm-avatar" src={t.foto_url} alt={t.nombre} />
        : <div className="adm-avatar-placeholder">{t.nombre.charAt(0)}</div>}
      <div className="adm-info">
        <div className="adm-name">{t.nombre}</div>
        <div className="adm-meta">
          <span>{t.disciplina}</span>
          {t.ciudad && <span>{t.ciudad}</span>}
          {t.edad && <span>{t.edad} años</span>}
          <span>{t.redes_seguidores.toLocaleString('es-MX')} seguidores</span>
        </div>
        {t.bio && <div className="adm-bio">{t.bio}</div>}
      </div>
      <div className="adm-actions">
        {t.estado === 'pendiente' ? (
          <>
            <button className="adm-btn adm-btn-reject" onClick={() => onDecide('rechazado')}>Rechazar</button>
            <button className="adm-btn adm-btn-approve" onClick={() => onDecide('aprobado')}>Aprobar</button>
          </>
        ) : (
          <EstadoBadge estado={t.estado} />
        )}
      </div>
    </div>
  );
}

function MarcaCard({ m, onDecide }: { m: Marca; onDecide: (d: Decision) => void }) {
  return (
    <div className="adm-card">
      <div className="adm-avatar-placeholder">{m.nombre.charAt(0)}</div>
      <div className="adm-info">
        <div className="adm-name">{m.nombre}</div>
        <div className="adm-meta">
          <span>{m.industria}</span>
          {m.pais && <span>{m.pais}</span>}
          <span>{m.contacto_nombre}</span>
          {m.presupuesto_mxn && <span>Presupuesto: ${m.presupuesto_mxn.toLocaleString('es-MX')} MXN</span>}
        </div>
        <div className="adm-bio">
          {m.contacto_email}
          {m.sitio_web && ` · ${m.sitio_web}`}
        </div>
      </div>
      <div className="adm-actions">
        {m.estado === 'pendiente' ? (
          <>
            <button className="adm-btn adm-btn-reject" onClick={() => onDecide('rechazado')}>Rechazar</button>
            <button className="adm-btn adm-btn-approve" onClick={() => onDecide('aprobado')}>Aprobar</button>
          </>
        ) : (
          <EstadoBadge estado={m.estado} />
        )}
      </div>
    </div>
  );
}

function AdminPanel({
  staff,
  onView,
  onLogout,
}: {
  staff: StaffSession;
  onView: (v: View) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>('talentos');
  const [filtro, setFiltro] = useState<FiltroEstado>('pendiente');
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'premium' | 'todos'>('todos');
  const [sort, setSort] = useState<'recencia' | 'puntuacion' | 'nombre'>('recencia');
  const [talentos, setTalentos] = useState<Talento[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const filters = { q: q || undefined, plan, sort };
    const [t, m] = await Promise.all([
      adminApi.listTalentos(filtro, filters),
      adminApi.listMarcas(filtro, filters),
    ]);
    if (t.success && t.data) setTalentos(t.data);
    if (m.success && m.data) setMarcas(m.data);
    setLoading(false);
  }

  useEffect(() => {
    const id = setTimeout(refresh, q ? 250 : 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, q, plan, sort]);

  async function handleTalentoDecide(id: string, decision: Decision) {
    const res = await adminApi.decideTalento(id, decision);
    if (res.success) setTalentos((prev) => prev.map((t) => (t.id === id ? { ...t, estado: decision } : t)));
  }

  async function handleMarcaDecide(id: string, decision: Decision) {
    const res = await adminApi.decideMarca(id, decision);
    if (res.success) setMarcas((prev) => prev.map((m) => (m.id === id ? { ...m, estado: decision } : m)));
  }

  const pendientesTalentos = useMemo(() => talentos.filter((t) => t.estado === 'pendiente').length, [talentos]);
  const pendientesMarcas   = useMemo(() => marcas.filter((m) => m.estado === 'pendiente').length, [marcas]);

  const items = tab === 'talentos' ? talentos : marcas;
  const isOwner = staff.rol === 'owner';

  return (
    <div className="adm">
      <div className="adm-shell">
        <div className="adm-header">
          <div>
            <div className="adm-title">Moviendo Leyendas — Backoffice</div>
            <div className="adm-subtitle">
              {staff.nombre} · <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ml-earth)' }}>{staff.rol}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isOwner && <button className="adm-logout" onClick={() => onView('stats')}>Ver stats</button>}
            {isOwner && <button className="adm-logout" onClick={() => onView('equipo')}>Equipo</button>}
            {isOwner && <button className="adm-logout" onClick={() => onView('integraciones')}>Integraciones</button>}
            <button className="adm-logout" onClick={onLogout}>Salir</button>
          </div>
        </div>

        <div className="adm-tabs">
          <button className={`adm-tab ${tab === 'talentos' ? 'is-active' : ''}`} onClick={() => setTab('talentos')}>
            Deportistas
            {pendientesTalentos > 0 && <span className="pill">{pendientesTalentos}</span>}
          </button>
          <button className={`adm-tab ${tab === 'marcas' ? 'is-active' : ''}`} onClick={() => setTab('marcas')}>
            Sponsors
            {pendientesMarcas > 0 && <span className="pill">{pendientesMarcas}</span>}
          </button>
        </div>

        <div className="adm-filters">
          {(['pendiente', 'aprobado', 'rechazado', 'todos'] as FiltroEstado[]).map((f) => (
            <button key={f} className={`adm-chip ${filtro === f ? 'is-active' : ''}`} onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 8, marginBottom: 16 }}>
          <input
            className="adm-gate-input"
            style={{ margin: 0 }}
            placeholder={`Buscar ${tab === 'talentos' ? 'por nombre, email o disciplina' : 'por nombre, email o industria'}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="adm-gate-input" style={{ margin: 0 }} value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)}>
            <option value="todos">Todos los planes</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <select className="adm-gate-input" style={{ margin: 0 }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="recencia">Más recientes</option>
            <option value="puntuacion">Mayor puntuación</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>

        {loading ? (
          <div className="adm-loading">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="adm-empty">Nada por aquí.</div>
        ) : (
          <div className="adm-card-list">
            {tab === 'talentos'
              ? talentos.map((t) => <TalentoCard key={t.id} t={t} onDecide={(d) => handleTalentoDecide(t.id, d)} />)
              : marcas.map((m) => <MarcaCard key={m.id} m={m} onDecide={(d) => handleMarcaDecide(m.id, d)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [staff, setStaff] = useState<StaffSession | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [view, setView] = useState<View>('panel');

  useEffect(() => {
    const token = getToken();
    const session = getSession();
    if (!token || !session) {
      setAuthed(false);
      return;
    }
    staffAuthApi.me().then((res) => {
      if (res.success && res.data) {
        setStaff(res.data);
        setAuthed(true);
      } else {
        clearToken();
        setAuthed(false);
      }
    });
  }, []);

  if (authed === null) return <div className="adm-loading">Cargando…</div>;

  if (!authed || !staff) {
    return <AdminGate onAuth={(s) => { setStaff(s); setAuthed(true); }} />;
  }

  if (view === 'stats')         return <AdminStats         onBack={() => setView('panel')} />;
  if (view === 'equipo')        return <AdminEquipo        onBack={() => setView('panel')} currentId={staff.id} />;
  if (view === 'integraciones') return <AdminIntegraciones onBack={() => setView('panel')} />;

  return (
    <AdminPanel
      staff={staff}
      onView={setView}
      onLogout={() => { clearToken(); setStaff(null); setAuthed(false); }}
    />
  );
}
