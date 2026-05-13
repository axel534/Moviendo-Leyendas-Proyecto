import { useEffect, useState } from 'react';
import { adminMlApi, AdminStats as Stats } from '../lib/mlApi';
import './AdminStats.css';

interface Props {
  onBack: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX');
}

function fmtMxn(n: number): string {
  return `$${n.toLocaleString('es-MX')} MXN`;
}

function BarChart({ data, accent }: { data: Array<{ label: string; n: number }>; accent: string }) {
  const max = Math.max(...data.map((d) => d.n), 1);
  return (
    <div className="ast-bars">
      {data.map((d) => (
        <div key={d.label} className="ast-bar-row">
          <span className="ast-bar-label">{d.label}</span>
          <div className="ast-bar-track">
            <div className="ast-bar-fill" style={{ width: `${(d.n / max) * 100}%`, background: accent }} />
          </div>
          <span className="ast-bar-n">{d.n}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminStats({ onBack }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminMlApi.stats().then((res) => {
      setLoading(false);
      if (res.success && res.data) setStats(res.data);
      else setErr(res.error ?? 'No se pudieron cargar las estadísticas');
    });
  }, []);

  if (loading) return <div className="adm adm-loading">Cargando estadísticas…</div>;
  if (err || !stats) return <div className="adm adm-loading">{err ?? '—'}</div>;

  const planLabels: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };

  return (
    <div className="adm ast">
      <div className="adm-shell">
        <div className="adm-header">
          <div>
            <div className="adm-title">Métricas en vivo</div>
            <div className="adm-subtitle">Datos reales de la plataforma</div>
          </div>
          <button className="adm-logout" onClick={onBack}>← Volver al panel</button>
        </div>

        {/* HERO KPIs */}
        <div className="ast-hero">
          <div className="ast-hero-card">
            <span className="ast-hero-eyebrow">MRR estimado</span>
            <div className="ast-hero-n">{fmtMxn(stats.finanzas.mrr_estimado_mxn)}</div>
            <div className="ast-hero-sub">membresías Pro + Premium activas</div>
          </div>
          <div className="ast-hero-card">
            <span className="ast-hero-eyebrow">Comisión potencial</span>
            <div className="ast-hero-n">{fmtMxn(stats.finanzas.comision_potencial_mxn)}</div>
            <div className="ast-hero-sub">10% sobre presupuestos declarados</div>
          </div>
          <div className="ast-hero-card">
            <span className="ast-hero-eyebrow">Usuarios totales</span>
            <div className="ast-hero-n">{fmt(stats.totales.usuarios)}</div>
            <div className="ast-hero-sub">
              {stats.totales.talentos} atletas · {stats.totales.marcas} marcas
            </div>
          </div>
          <div className="ast-hero-card">
            <span className="ast-hero-eyebrow">Matches conectados</span>
            <div className="ast-hero-n">{fmt(stats.aprobados.matchesConectados)}</div>
            <div className="ast-hero-sub">{stats.totales.matches} matches generados en total</div>
          </div>
        </div>

        {/* GRID MEDIO */}
        <div className="ast-grid">
          <div className="ast-card">
            <div className="ml-eyebrow">Crecimiento últimos 7 días</div>
            <div className="ast-row3">
              <div><div className="ast-n">{stats.crecimiento.ult7d.talentos}</div><div className="ast-n-l">atletas nuevos</div></div>
              <div><div className="ast-n">{stats.crecimiento.ult7d.marcas}</div><div className="ast-n-l">marcas nuevas</div></div>
              <div><div className="ast-n">{stats.crecimiento.ult7d.matches}</div><div className="ast-n-l">matches generados</div></div>
            </div>
          </div>

          <div className="ast-card">
            <div className="ml-eyebrow">Pendientes de revisión</div>
            <div className="ast-row3">
              <div><div className="ast-n" style={{ color: 'var(--ml-warning)' }}>{stats.pendientes.talentos}</div><div className="ast-n-l">atletas</div></div>
              <div><div className="ast-n" style={{ color: 'var(--ml-warning)' }}>{stats.pendientes.marcas}</div><div className="ast-n-l">marcas</div></div>
              <div><div className="ast-n" style={{ color: 'var(--ml-danger)' }}>{stats.ia.intentos_fuga_detectados}</div><div className="ast-n-l">fugas detectadas</div></div>
            </div>
          </div>

          <div className="ast-card ast-span-2">
            <div className="ml-eyebrow">Top deportes (atletas aprobados)</div>
            <BarChart
              data={stats.distribuciones.deportes.map((d) => ({ label: d.disciplina, n: d.n }))}
              accent="var(--ml-earth)"
            />
          </div>

          <div className="ast-card ast-span-2">
            <div className="ml-eyebrow">Top industrias (marcas aprobadas)</div>
            <BarChart
              data={stats.distribuciones.industrias.map((d) => ({ label: d.industria, n: d.n }))}
              accent="var(--ml-black)"
            />
          </div>

          <div className="ast-card">
            <div className="ml-eyebrow">Top ciudades</div>
            <BarChart
              data={stats.distribuciones.ciudades.map((d) => ({ label: d.ciudad, n: d.n }))}
              accent="var(--ml-success)"
            />
          </div>

          <div className="ast-card">
            <div className="ml-eyebrow">Distribución por plan (atletas)</div>
            <BarChart
              data={stats.distribuciones.planes_talentos.map((d) => ({ label: planLabels[d.plan] ?? d.plan, n: d.n }))}
              accent="var(--ml-earth)"
            />
          </div>

          <div className="ast-card">
            <div className="ml-eyebrow">Distribución por plan (marcas)</div>
            <BarChart
              data={stats.distribuciones.planes_marcas.map((d) => ({ label: planLabels[d.plan] ?? d.plan, n: d.n }))}
              accent="var(--ml-black)"
            />
          </div>

          <div className="ast-card">
            <div className="ml-eyebrow">Engagement</div>
            <div className="ast-row3">
              <div><div className="ast-n">{stats.totales.mensajes}</div><div className="ast-n-l">mensajes</div></div>
              <div><div className="ast-n">{stats.totales.posts}</div><div className="ast-n-l">posts vitrina</div></div>
              <div><div className="ast-n">{stats.aprobados.talentos + stats.aprobados.marcas}</div><div className="ast-n-l">activos</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
