import { Link } from 'react-router-dom';

interface Plan {
  nombre: string;
  precio: string;
  precioAnual?: string;
  desc: string;
  feats: string[];
  cta: string;
  highlight?: boolean;
}

const PLANES: Plan[] = [
  {
    nombre: 'Free', precio: '$0', desc: 'Para empezar a explorar la plataforma.',
    feats: ['50 matches al año', 'Chat con IA monitoreada', 'Vitrina (publicar y ver)', 'Generación de contrato básica'],
    cta: 'Empezar gratis',
  },
  {
    nombre: 'Pro', precio: '$499', precioAnual: '$4,790 anual', desc: 'Para atletas y marcas que ya cierran acuerdos.',
    feats: ['1,000 matches al año', 'IA optimiza tu perfil', 'IA recomienda acciones', 'Soporte prioritario'],
    cta: 'Empezar Pro',
    highlight: true,
  },
  {
    nombre: 'Premium', precio: '$2,000', precioAnual: '$19,200 anual', desc: 'Para el siguiente nivel.',
    feats: ['Matches ilimitados', 'IA avanzada', 'Acceso a grandes marcas', 'Account manager dedicado'],
    cta: 'Empezar Premium',
  },
];

export default function PlanesPage() {
  return (
    <div className="ml-container" style={{ padding: '80px 24px 120px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
        <span className="ml-eyebrow">Planes</span>
        <h1 className="ml-headline" style={{ marginTop: 12 }}>Empieza gratis. Sube cuando estés listo.</h1>
        <p style={{ color: 'var(--ml-text-muted)', marginTop: 12 }}>
          Sin permanencia. Cancela cuando quieras. La comisión sobre acuerdos cerrados es la misma en todos los planes.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
        {PLANES.map((p) => (
          <div key={p.nombre} className="ml-card" style={{
            borderColor: p.highlight ? 'var(--ml-black)' : 'var(--ml-border)',
            borderWidth: p.highlight ? 2 : 1,
            position: 'relative',
          }}>
            {p.highlight && (
              <span className="ml-badge ml-badge-earth" style={{ position: 'absolute', top: -10, left: 24 }}>Más popular</span>
            )}
            <div style={{ fontFamily: 'var(--ml-font-display)', fontSize: 28, letterSpacing: '0.06em' }}>{p.nombre.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--ml-font-serif)', fontSize: 42, lineHeight: 1, marginTop: 8 }}>
              {p.precio}<span style={{ fontSize: 16, color: 'var(--ml-text-muted)' }}>/mes</span>
            </div>
            {p.precioAnual && <div style={{ fontSize: 12, color: 'var(--ml-text-muted)', marginTop: 4 }}>o {p.precioAnual} con 20% off</div>}
            <p style={{ color: 'var(--ml-text-muted)', marginTop: 16, fontSize: 14 }}>{p.desc}</p>
            <ul style={{ margin: '16px 0 24px', padding: '0 0 0 18px', fontSize: 14 }}>
              {p.feats.map((f) => <li key={f} style={{ marginBottom: 6 }}>{f}</li>)}
            </ul>
            <Link to="/registro" className={`ml-btn ml-btn-block ${p.highlight ? 'ml-btn-primary' : 'ml-btn-secondary'}`}>{p.cta}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
