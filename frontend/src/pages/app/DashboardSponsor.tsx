import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, SessionUser } from '../../auth/AuthContext';
import { mlApi, MatchRow } from '../../lib/mlApi';
import { Skeleton } from '../../ui/Skeleton';
import './DashboardEspecializado.css';

function fmtMxn(n: number): string {
  return `$${n.toLocaleString('es-MX')}`;
}

function fmtSeguidores(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K`;
  return String(n);
}

function badgeColor(estado: string): string {
  if (estado === 'conectado') return 'ml-badge-success';
  if (estado === 'solicitado') return 'ml-badge-earth';
  if (estado === 'rechazado') return 'ml-badge-danger';
  return 'ml-badge-neutral';
}

export default function DashboardSponsor({ user }: { user: SessionUser }) {
  const { refresh } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mlApi.matches(user.id, user.tipo).then((res) => {
      if (res.success && res.data) setMatches(res.data);
      setLoading(false);
    });
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // KPIs
  const pipeline = matches.filter((m) => m.estado !== 'rechazado').length;
  const solicitudesPendientes = matches.filter((m) => m.estado === 'solicitado');
  const conectados = matches.filter((m) => m.estado === 'conectado');
  const inversionComprometida = conectados.length * (user.presupuesto_mxn ?? 0) * 0.4; // aproximación
  const alcanceTotal = conectados.reduce((acc, m) => acc + (m.redes_seguidores ?? 0), 0);
  const recomendados = matches.filter((m) => m.estado === 'nuevo' || m.estado === 'solicitado').slice(0, 3);

  return (
    <div className="dx">
      {/* HERO */}
      <section className="dx-hero dx-hero-sponsor">
        <div className="dx-hero-left">
          <div className="dx-hero-logo">{user.nombre.charAt(0)}</div>
          <div>
            <span className="ml-eyebrow">Sponsor · {user.plan.toUpperCase()}</span>
            <h1 className="dx-hero-name">{user.nombre}</h1>
            <div className="dx-hero-meta">
              {user.industria ?? 'Sin industria'}
              {user.presupuesto_mxn ? ` · presupuesto declarado ${fmtMxn(user.presupuesto_mxn)} MXN/mes` : ''}
            </div>
          </div>
        </div>
        <div className="dx-hero-score">
          <div className="dx-score-n">{user.puntuacion}</div>
          <div className="dx-score-l">Puntuación</div>
          <div className="dx-score-bar">
            <div className="dx-score-fill" style={{ width: `${user.puntuacion}%` }} />
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="dx-kpis">
        <div className="dx-kpi">
          <div className="dx-kpi-n">{loading ? <Skeleton width={60} height={36} /> : pipeline}</div>
          <div className="dx-kpi-l">Deportistas en pipeline</div>
        </div>
        <div className="dx-kpi">
          <div className="dx-kpi-n">{loading ? <Skeleton width={60} height={36} /> : conectados.length}</div>
          <div className="dx-kpi-l">Acuerdos activos</div>
        </div>
        <div className="dx-kpi">
          <div className="dx-kpi-n">{loading ? <Skeleton width={80} height={36} /> : fmtSeguidores(alcanceTotal)}</div>
          <div className="dx-kpi-l">Alcance total (seguidores)</div>
        </div>
        <div className="dx-kpi dx-kpi-accent">
          <div className="dx-kpi-n">{loading ? <Skeleton width={120} height={36} /> : fmtMxn(Math.round(inversionComprometida))}</div>
          <div className="dx-kpi-l">Inversión comprometida / mes</div>
        </div>
      </section>

      <div className="dx-grid">
        {/* CTA Match */}
        <section className="dx-card dx-cta-match">
          <span className="ml-eyebrow">IA recomienda</span>
          <h3 className="dx-cta-title">
            {recomendados.length > 0
              ? `Tienes ${recomendados.length} deportistas alineados con tu marca esta semana.`
              : 'Genera tus primeros matches.'}
          </h3>
          <p className="dx-cta-sub">La IA filtra por disciplina, alcance y compatibilidad con tu industria.</p>
          <Link to="/app/match" className="ml-btn ml-btn-primary ml-btn-lg">Buscar deportistas</Link>
        </section>

        {/* Recomendados */}
        <section className="dx-card dx-recomendados">
          <div className="dx-sec-head">
            <span className="ml-eyebrow">Deportistas recomendados</span>
            <Link to="/app/match" className="dx-sec-link">Ver todos</Link>
          </div>
          {recomendados.length === 0 && !loading && (
            <div style={{ color: 'var(--ml-text-muted)', fontSize: 14 }}>Sin deportistas nuevos por ahora.</div>
          )}
          <div className="dx-list">
            {recomendados.map((m) => (
              <Link to="/app/match" key={m.id} className="dx-list-item">
                <img src={m.foto_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(m.talento_nombre ?? '?')}`} alt={m.talento_nombre} />
                <div className="dx-list-info">
                  <div className="dx-list-name">{m.talento_nombre}</div>
                  <div className="dx-list-meta">
                    {m.disciplina}{m.ciudad ? ` · ${m.ciudad}` : ''}
                    {m.redes_seguidores ? ` · ${fmtSeguidores(m.redes_seguidores)} seguidores` : ''}
                  </div>
                </div>
                <div className="dx-list-right">
                  <span className="dx-pct">{m.porcentaje}%</span>
                  <span className={`ml-badge ${badgeColor(m.estado)}`}>{m.estado}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Acuerdos activos */}
        <section className="dx-card dx-acuerdos">
          <div className="dx-sec-head">
            <span className="ml-eyebrow">Acuerdos activos</span>
            <Link to="/app/chat" className="dx-sec-link">Abrir chat</Link>
          </div>
          {conectados.length === 0 && (
            <div style={{ color: 'var(--ml-text-muted)', fontSize: 14 }}>
              Cuando cierres un acuerdo dentro de la plataforma, aparece aquí.
            </div>
          )}
          {conectados.map((a) => (
            <div className="dx-acuerdo" key={a.id}>
              <div className="dx-acuerdo-head">
                <div>
                  <div className="dx-acuerdo-title">Patrocinio activo</div>
                  <div className="dx-acuerdo-marca">{a.talento_nombre} · {a.disciplina}</div>
                </div>
                <div className="dx-acuerdo-monto">
                  {a.redes_seguidores ? `${fmtSeguidores(a.redes_seguidores)} alcance` : '—'}
                </div>
              </div>
              <div className="dx-progress-track">
                <div className="dx-progress-fill" style={{ width: `${a.porcentaje}%`, background: 'var(--ml-success)' }} />
              </div>
              <div className="dx-acuerdo-meta">Compatibilidad {a.porcentaje}% · acuerdo en curso</div>
            </div>
          ))}
        </section>

        {/* Solicitudes pendientes */}
        <section className="dx-card dx-compromisos">
          <div className="dx-sec-head">
            <span className="ml-eyebrow">Solicitudes pendientes</span>
            {solicitudesPendientes.length > 0 && (
              <span className="dx-pill-count">{solicitudesPendientes.length}</span>
            )}
          </div>
          {solicitudesPendientes.length === 0 && (
            <div style={{ color: 'var(--ml-text-muted)', fontSize: 14 }}>Sin solicitudes pendientes.</div>
          )}
          <ul className="dx-comp-list">
            {solicitudesPendientes.map((s) => (
              <li key={s.id} className="dx-comp-item">
                <div className="dx-comp-pill is-urgent">{s.porcentaje}%</div>
                <div>
                  <div className="dx-comp-txt">{s.talento_nombre}</div>
                  <div className="dx-comp-time">{s.disciplina} · esperando tu respuesta</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
