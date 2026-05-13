import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, SessionUser } from '../../auth/AuthContext';
import { mlApi, MatchRow } from '../../lib/mlApi';
import { Skeleton } from '../../ui/Skeleton';
import './DashboardEspecializado.css';

function fmtMxn(n: number): string {
  return `$${n.toLocaleString('es-MX')}`;
}

function badgeColor(estado: string): string {
  if (estado === 'conectado') return 'ml-badge-success';
  if (estado === 'solicitado') return 'ml-badge-earth';
  if (estado === 'rechazado') return 'ml-badge-danger';
  return 'ml-badge-neutral';
}

interface Compromiso {
  txt: string;
  fecha: string;
  vence_en_dias: number;
}

export default function DashboardDeportista({ user }: { user: SessionUser }) {
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

  // KPIs derivados
  const matchesActivos = matches.filter((m) => m.estado !== 'rechazado').length;
  const sponsorsInteresados = matches.filter((m) => m.estado === 'solicitado' || m.estado === 'conectado').length;
  const conectados = matches.filter((m) => m.estado === 'conectado');
  const acuerdosEnCurso = conectados.length;
  const ingresosEsperados = conectados.reduce((acc, m) => acc + ((m.presupuesto_mxn ?? 0) * 0.6), 0); // 60% del presupuesto mensual como aproximación
  const topRecomendados = matches.filter((m) => m.estado === 'nuevo' || m.estado === 'solicitado').slice(0, 3);

  // Compromisos mock derivados de matches conectados
  const compromisos: Compromiso[] = conectados.flatMap((m, i) => [
    { txt: `Publicar reel para ${m.marca_nombre ?? 'sponsor'}`,         fecha: 'En 3 días',  vence_en_dias: 3 + i },
    { txt: `Reporte mensual a ${m.marca_nombre ?? 'sponsor'}`,           fecha: 'En 12 días', vence_en_dias: 12 + i },
  ]).slice(0, 4);

  return (
    <div className="dx">
      {/* HERO */}
      <section className="dx-hero">
        <div className="dx-hero-left">
          <img className="dx-hero-avatar" src={user.foto_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.nombre)}`} alt={user.nombre} />
          <div>
            <span className="ml-eyebrow">Deportista · {user.plan.toUpperCase()}</span>
            <h1 className="dx-hero-name">{user.nombre}</h1>
            <div className="dx-hero-meta">
              {user.disciplina ?? 'Sin disciplina'}{user.ciudad ? ` · ${user.ciudad}` : ''}
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

      {/* KPI CARDS */}
      <section className="dx-kpis">
        <div className="dx-kpi">
          <div className="dx-kpi-n">{loading ? <Skeleton width={60} height={36} /> : matchesActivos}</div>
          <div className="dx-kpi-l">Matches activos</div>
        </div>
        <div className="dx-kpi">
          <div className="dx-kpi-n">{loading ? <Skeleton width={60} height={36} /> : sponsorsInteresados}</div>
          <div className="dx-kpi-l">Sponsors interesados</div>
        </div>
        <div className="dx-kpi">
          <div className="dx-kpi-n">{loading ? <Skeleton width={60} height={36} /> : acuerdosEnCurso}</div>
          <div className="dx-kpi-l">Acuerdos en curso</div>
        </div>
        <div className="dx-kpi dx-kpi-accent">
          <div className="dx-kpi-n">{loading ? <Skeleton width={120} height={36} /> : fmtMxn(Math.round(ingresosEsperados))}</div>
          <div className="dx-kpi-l">Ingresos esperados / mes</div>
        </div>
      </section>

      <div className="dx-grid">
        {/* CTA Match */}
        <section className="dx-card dx-cta-match">
          <span className="ml-eyebrow">IA recomienda</span>
          <h3 className="dx-cta-title">
            {topRecomendados.length > 0
              ? `Tienes ${topRecomendados.length} sponsors con buena compatibilidad esta semana.`
              : 'Genera tus primeros matches.'}
          </h3>
          <p className="dx-cta-sub">Cada vez que pulsas Match, la IA recalcula tus mejores opciones.</p>
          <Link to="/app/match" className="ml-btn ml-btn-primary ml-btn-lg">Ver matches</Link>
        </section>

        {/* Sponsors recomendados */}
        <section className="dx-card dx-recomendados">
          <div className="dx-sec-head">
            <span className="ml-eyebrow">Sponsors recomendados</span>
            <Link to="/app/match" className="dx-sec-link">Ver todos</Link>
          </div>
          {topRecomendados.length === 0 && !loading && (
            <div style={{ color: 'var(--ml-text-muted)', fontSize: 14 }}>Sin sponsors nuevos por ahora.</div>
          )}
          <div className="dx-list">
            {topRecomendados.map((m) => (
              <Link to="/app/match" key={m.id} className="dx-list-item">
                <img src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(m.marca_nombre ?? '?')}&backgroundColor=8B5E3C`} alt={m.marca_nombre} />
                <div className="dx-list-info">
                  <div className="dx-list-name">{m.marca_nombre}</div>
                  <div className="dx-list-meta">{m.industria}{m.presupuesto_mxn ? ` · ${fmtMxn(m.presupuesto_mxn)}` : ''}</div>
                </div>
                <div className="dx-list-right">
                  <span className="dx-pct">{m.porcentaje}%</span>
                  <span className={`ml-badge ${badgeColor(m.estado)}`}>{m.estado}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Acuerdos en curso */}
        <section className="dx-card dx-acuerdos">
          <div className="dx-sec-head">
            <span className="ml-eyebrow">Acuerdos en curso</span>
            <Link to="/app/chat" className="dx-sec-link">Abrir chat</Link>
          </div>
          {conectados.length === 0 && (
            <div style={{ color: 'var(--ml-text-muted)', fontSize: 14 }}>
              Cuando cierres un acuerdo dentro de la plataforma, aparece aquí con calendario y compromisos.
            </div>
          )}
          {conectados.map((a) => (
            <div className="dx-acuerdo" key={a.id}>
              <div className="dx-acuerdo-head">
                <div>
                  <div className="dx-acuerdo-title">Patrocinio en negociación</div>
                  <div className="dx-acuerdo-marca">{a.marca_nombre}</div>
                </div>
                <div className="dx-acuerdo-monto">
                  {a.presupuesto_mxn ? `${fmtMxn(a.presupuesto_mxn)} / mes` : '—'}
                </div>
              </div>
              <div className="dx-progress-track">
                <div className="dx-progress-fill" style={{ width: `${a.porcentaje}%`, background: 'var(--ml-success)' }} />
              </div>
              <div className="dx-acuerdo-meta">Compatibilidad {a.porcentaje}% · en chat activo</div>
            </div>
          ))}
        </section>

        {/* Compromisos */}
        <section className="dx-card dx-compromisos">
          <div className="dx-sec-head">
            <span className="ml-eyebrow">Próximos compromisos</span>
          </div>
          {compromisos.length === 0 && (
            <div style={{ color: 'var(--ml-text-muted)', fontSize: 14 }}>
              Sin compromisos próximos.
            </div>
          )}
          <ul className="dx-comp-list">
            {compromisos.map((c, i) => (
              <li key={i} className="dx-comp-item">
                <div className={`dx-comp-pill ${c.vence_en_dias < 7 ? 'is-urgent' : ''}`}>
                  {c.vence_en_dias}d
                </div>
                <div>
                  <div className="dx-comp-txt">{c.txt}</div>
                  <div className="dx-comp-time">{c.fecha}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
