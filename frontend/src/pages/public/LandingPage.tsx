import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mlApi, StatsPublicos } from '../../lib/mlApi';
import './LandingPage.css';

const CATEGORIAS = [
  { nombre: 'Karting', icon: 'M3 17h18M5 17l2-7h10l2 7M7 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M14 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2' },
  { nombre: 'Motocross', icon: 'M5 17a3 3 0 1 1 6 0 3 3 0 0 1-6 0zM13 17a3 3 0 1 1 6 0 3 3 0 0 1-6 0zM8 7l-3 10M16 17l-3-10h6l-3 10' },
  { nombre: 'Atletismo', icon: 'M13 4v4M7 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM11 11l5 3-2 6' },
  { nombre: 'Tenis', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM3 12c5 2 13 2 18 0M3 12a9 9 0 0 1 18 0' },
  { nombre: 'Surf', icon: 'M3 15c4 0 5-3 9-3s5 3 9 3M3 19c4 0 5-3 9-3s5 3 9 3' },
  { nombre: 'MMA', icon: 'M6 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 12v4M15 12v4M12 12v4' },
  { nombre: 'Triatlón', icon: 'M4 12h16M4 6h16M4 18h10' },
  { nombre: 'F4', icon: 'M3 13l5-5h8l5 5-3 5H6zM7 18v2M17 18v2' },
];

const PASOS = [
  {
    n: '01',
    titulo: 'Crea tu perfil',
    cuerpo: 'Atleta o marca. Comparte lo que ofreces y lo que buscas. Sin formularios eternos.',
  },
  {
    n: '02',
    titulo: 'La IA te empareja',
    cuerpo: 'Analiza tu perfil contra el de cada deportista o sponsor y te propone matches ordenados por compatibilidad real.',
  },
  {
    n: '03',
    titulo: 'Chat monitoreado',
    cuerpo: 'Conversa dentro de la plataforma. La IA detecta el cierre y arma el contrato por ti.',
  },
  {
    n: '04',
    titulo: 'Acuerdo firmado y pagado',
    cuerpo: 'Firma electrónica con valor legal. ML recibe el pago y lo redistribuye al deportista.',
  },
];

const TESTIMONIOS = [
  { autor: 'María del Toro', deporte: 'Motocross', texto: 'Cerré tres acuerdos en mi primer mes. ML me ahorró meses de buscar marcas por mi cuenta.' },
  { autor: 'Hidra+', deporte: 'Bebidas deportivas', texto: 'Encontramos a tres atletas que encajaban con nuestra audiencia. La IA aceleró todo el proceso.' },
  { autor: 'Joaquín Rivas', deporte: 'MMA', texto: 'El chat con IA nos guió hasta cerrar. Sin malentendidos, sin fugas. Todo claro.' },
];

function fmt(n: number | string): string {
  const v = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(v)) return String(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
  return String(v);
}

export default function LandingPage() {
  const [stats, setStats] = useState<StatsPublicos | null>(null);
  useEffect(() => {
    mlApi.statsPublicos().then((r) => { if (r.success && r.data) setStats(r.data); });
  }, []);

  return (
    <div className="lp">
      {/* HERO */}
      <section className="lp-hero">
        <div className="ml-container">
          <div className="lp-hero-grid">
            <div className="lp-hero-text">
              <span className="ml-eyebrow">Plataforma mexicana · Marketplace</span>
              <h1 className="lp-hero-title">
                El puente entre tu<br />
                <span className="lp-hero-italic">talento</span> y la <span className="lp-hero-italic">marca correcta.</span>
              </h1>
              <p className="lp-hero-sub">
                Conectamos deportistas con sponsors. La IA encuentra el match,
                te acompaña en el chat, genera el contrato y asegura el pago.
              </p>
              <div className="lp-hero-cta">
                <Link to="/registro" className="ml-btn ml-btn-primary ml-btn-lg">Soy deportista</Link>
                <Link to="/registro?tipo=marca" className="ml-btn ml-btn-secondary ml-btn-lg">Soy sponsor</Link>
              </div>
              <div className="lp-hero-stats">
                <div>
                  <strong>{stats ? fmt(stats.talentos_activos) : '—'}</strong>
                  <span>deportistas activos</span>
                </div>
                <div>
                  <strong>{stats ? fmt(stats.marcas_activas) : '—'}</strong>
                  <span>sponsors conectados</span>
                </div>
                <div>
                  <strong>${stats ? fmt(stats.presupuesto_total) : '—'}</strong>
                  <span>en presupuestos activos</span>
                </div>
              </div>
            </div>
            <div className="lp-hero-art">
              <img
                src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=80"
                alt="Atleta en competencia"
              />
              <div className="lp-hero-quote">
                <div className="ml-eyebrow">Atleta destacada</div>
                <div className="lp-hero-quote-name">María del Toro</div>
                <div className="lp-hero-quote-meta">Motocross · Guadalajara · 22.5K seguidores</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="lp-cats">
        <div className="ml-container">
          <div className="lp-cats-head">
            <span className="ml-eyebrow">Explora por disciplina</span>
            <h2 className="ml-headline">Talento en cada deporte</h2>
          </div>
          <div className="lp-cats-grid">
            {CATEGORIAS.map((c) => (
              <div className="lp-cat" key={c.nombre}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.icon} />
                </svg>
                <span>{c.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how">
        <div className="ml-container">
          <div className="lp-how-head">
            <span className="ml-eyebrow">Cómo funciona</span>
            <h2 className="ml-headline">Cuatro pasos. Un acuerdo real.</h2>
          </div>
          <div className="lp-how-grid">
            {PASOS.map((p) => (
              <div className="lp-how-card" key={p.n}>
                <div className="lp-how-n">{p.n}</div>
                <h3 className="lp-how-title">{p.titulo}</h3>
                <p className="lp-how-body">{p.cuerpo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="lp-quotes">
        <div className="ml-container">
          <div className="lp-quotes-grid">
            {TESTIMONIOS.map((t, i) => (
              <figure className="lp-quote" key={i}>
                <blockquote>“{t.texto}”</blockquote>
                <figcaption>
                  <strong>{t.autor}</strong>
                  <span>{t.deporte}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="lp-cta-final">
        <div className="ml-container">
          <h2 className="lp-cta-title">
            Tu próximo acuerdo<br />
            <em>empieza aquí.</em>
          </h2>
          <div className="lp-cta-actions">
            <Link to="/registro" className="ml-btn ml-btn-earth ml-btn-lg">Empezar gratis</Link>
            <Link to="/planes" className="ml-btn ml-btn-ghost ml-btn-lg">Ver planes</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
