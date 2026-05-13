import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { mlApi, MatchRow, MatchFilters } from '../../lib/mlApi';
import { useToast } from '../../ui/Toast';
import { SkeletonCard } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import './MatchPage.css';

interface View {
  id: string;
  nombre: string;
  meta: string;
  detalle: string;
  pct: number;
  avatar: string;
  razones: string[];
  estado: MatchRow['estado'];
}

function toView(m: MatchRow, tipoUser: 'atleta' | 'marca'): View {
  if (tipoUser === 'atleta') {
    const nombre = m.marca_nombre ?? '—';
    return {
      id: m.id,
      nombre,
      meta: `${m.industria ?? ''}${m.pais ? ' · ' + m.pais : ''}`,
      detalle: m.presupuesto_mxn ? `Presupuesto: $${m.presupuesto_mxn.toLocaleString('es-MX')} MXN` : 'Presupuesto a definir',
      pct: m.porcentaje,
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=8B5E3C`,
      razones: m.razones?.razones ?? [],
      estado: m.estado,
    };
  }
  const nombre = m.talento_nombre ?? '—';
  return {
    id: m.id,
    nombre,
    meta: `${m.disciplina ?? ''} · ${m.ciudad ?? ''}`,
    detalle: `${(m.redes_seguidores ?? 0).toLocaleString('es-MX')} seguidores`,
    pct: m.porcentaje,
    avatar: m.foto_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(nombre)}`,
    razones: m.razones?.razones ?? [],
    estado: m.estado,
  };
}

const PRESUPUESTOS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Todo' },
  { label: '< $100K', max: 100000 },
  { label: '$100K - $300K', min: 100000, max: 300000 },
  { label: '$300K +', min: 300000 },
];

export default function MatchPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [pctMin, setPctMin] = useState<number | undefined>();
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [industria] = useState('');
  const [sort, setSort] = useState<'compatibilidad' | 'recencia'>('compatibilidad');
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [regen, setRegen] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const filters: MatchFilters = {
      q: q || undefined,
      pct_min: pctMin,
      sort,
      presupuesto_min: PRESUPUESTOS[budgetIdx].min,
      presupuesto_max: PRESUPUESTOS[budgetIdx].max,
      industria: industria || undefined,
    };
    const res = await mlApi.matches(user.id, user.tipo, filters);
    setLoading(false);
    if (res.success && res.data) {
      setMatches(res.data);
      if (!seleccionado && res.data[0]) setSeleccionado(res.data[0].id);
    }
  }, [user, q, pctMin, sort, budgetIdx, industria, seleccionado]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const views = useMemo(() => {
    if (!user) return [];
    return matches.map((m) => toView(m, user.tipo));
  }, [matches, user]);

  const detail = views.find((v) => v.id === seleccionado) ?? views[0];

  async function regenerar() {
    setRegen(true);
    toast.push('info', 'La IA está analizando tus mejores opciones…');
    setTimeout(async () => {
      await fetchMatches();
      setRegen(false);
      toast.push('success', `${matches.length} matches recalculados`);
    }, 1200);
  }

  async function ejecutarAccion(matchId: string, accion: 'solicitar' | 'aceptar' | 'rechazar') {
    const res = await mlApi.matchAccion(matchId, accion);
    if (res.success) {
      const msg =
        accion === 'solicitar' ? 'Solicitud enviada' :
        accion === 'aceptar'   ? 'Match conectado'   : 'Match rechazado';
      toast.push(accion === 'rechazar' ? 'info' : 'success', msg);
      await fetchMatches();
    } else {
      toast.push('error', res.error ?? 'No se pudo procesar');
    }
  }

  if (!user) return null;

  return (
    <div className="mch">
      <div className="page-head">
        <span className="ml-eyebrow">Match · IA</span>
        <h1 className="page-title">
          {user.tipo === 'atleta' ? 'Tus mejores sponsors esta semana' : 'Tus mejores deportistas esta semana'}
        </h1>
        <p className="page-sub">
          La IA analiza disciplina, ubicación, presupuesto, audiencia e historial y te ordena las opciones más compatibles.
        </p>
      </div>

      <div className="mch-toolbar">
        <input
          className="ml-input mch-search"
          placeholder={user.tipo === 'atleta' ? 'Buscar sponsor o industria…' : 'Buscar deportista, deporte, ciudad…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="ml-input mch-select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="compatibilidad">Más compatibles</option>
          <option value="recencia">Más recientes</option>
        </select>
        <button className="ml-btn ml-btn-primary" onClick={regenerar} disabled={regen}>
          {regen ? 'IA analizando…' : 'Regenerar'}
        </button>
      </div>

      <div className="mch-filters-row">
        <div className="mch-filters">
          <span className="mch-flabel">Compatibilidad:</span>
          {[undefined, 70, 80, 90].map((p) => (
            <button
              key={p ?? 'all'}
              className={`onb-chip ${pctMin === p ? 'is-on' : ''}`}
              onClick={() => setPctMin(p)}
            >
              {p === undefined ? 'Toda' : `+${p}%`}
            </button>
          ))}
        </div>
        {user.tipo === 'atleta' && (
          <div className="mch-filters">
            <span className="mch-flabel">Presupuesto:</span>
            {PRESUPUESTOS.map((p, i) => (
              <button key={p.label} className={`onb-chip ${budgetIdx === i ? 'is-on' : ''}`} onClick={() => setBudgetIdx(i)}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="mch-layout">
          <div className="mch-list">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </div>
      )}

      {!loading && views.length === 0 && (
        <EmptyState
          title="No encontramos matches con esos filtros"
          description="Prueba reducir la compatibilidad mínima o quitar el filtro de presupuesto."
          action={<button className="ml-btn ml-btn-secondary" onClick={() => { setQ(''); setPctMin(undefined); setBudgetIdx(0); }}>Limpiar filtros</button>}
        />
      )}

      {!loading && views.length > 0 && (
        <div className="mch-layout">
          <div className="mch-list">
            {views.map((v) => (
              <div
                key={v.id}
                className={`mch-card ${seleccionado === v.id ? 'is-sel' : ''}`}
                onClick={() => setSeleccionado(v.id)}
              >
                <img className="mch-avatar" src={v.avatar} alt={v.nombre} />
                <div className="mch-info">
                  <div className="mch-nombre">{v.nombre}</div>
                  <div className="mch-meta">{v.meta}</div>
                  <div className="mch-presupuesto">{v.detalle}</div>
                </div>
                <div className="mch-pct-box">
                  <div className={`mch-pct ${v.pct >= 85 ? 'is-hi' : v.pct >= 70 ? 'is-mid' : ''}`}>{v.pct}%</div>
                  <div className="mch-pct-l">compatible</div>
                </div>
              </div>
            ))}
          </div>

          {detail && (
            <div className="mch-detail">
              <div className="mch-detail-head">
                <img src={detail.avatar} alt={detail.nombre} />
                <div>
                  <span className="ml-eyebrow">{detail.meta}</span>
                  <h2 className="mch-detail-name">{detail.nombre}</h2>
                  <div className="mch-meta">{detail.detalle}</div>
                </div>
                <div className={`mch-detail-pct ${detail.pct >= 85 ? 'is-hi' : ''}`}>
                  {detail.pct}<span>%</span>
                </div>
              </div>

              <div className="mch-block">
                <div className="ml-eyebrow">Por qué te recomendamos esto</div>
                <ul className="mch-razones">
                  {detail.razones.length === 0 && <li style={{ color: 'var(--ml-text-muted)' }}>La IA aún no generó razones detalladas.</li>}
                  {detail.razones.map((r, i) => (
                    <li key={i}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mch-block mch-stats">
                <div>
                  <div className="mch-stat-n">{detail.estado}</div>
                  <div className="ml-eyebrow">Estado actual</div>
                </div>
                <div>
                  <div className="mch-stat-n">{detail.pct}%</div>
                  <div className="ml-eyebrow">Compatibilidad</div>
                </div>
                <div>
                  <div className="mch-stat-n">IA</div>
                  <div className="ml-eyebrow">Evaluado por</div>
                </div>
              </div>

              <div className="mch-actions">
                {detail.estado === 'nuevo' && (
                  <>
                    <button className="ml-btn ml-btn-ghost" onClick={() => ejecutarAccion(detail.id, 'rechazar')}>
                      No me interesa
                    </button>
                    <button className="ml-btn ml-btn-primary ml-btn-lg" onClick={() => ejecutarAccion(detail.id, 'solicitar')}>
                      Mandar solicitud
                    </button>
                  </>
                )}
                {detail.estado === 'solicitado' && (
                  <>
                    <span className="ml-badge ml-badge-earth">Solicitud enviada</span>
                    <button className="ml-btn ml-btn-secondary" onClick={() => ejecutarAccion(detail.id, 'aceptar')}>
                      Marcar como aceptado
                    </button>
                  </>
                )}
                {detail.estado === 'conectado' && (
                  <>
                    <span className="ml-badge ml-badge-success">Conectado</span>
                    <a href="/app/chat" className="ml-btn ml-btn-primary ml-btn-lg">Abrir chat</a>
                  </>
                )}
                {detail.estado === 'rechazado' && (
                  <>
                    <span className="ml-badge ml-badge-danger">Rechazado</span>
                    <button className="ml-btn ml-btn-secondary" onClick={() => ejecutarAccion(detail.id, 'solicitar')}>
                      Reactivar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
