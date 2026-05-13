import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="ml-container" style={{ padding: '80px 24px 120px', maxWidth: 760 }}>
      <span className="ml-eyebrow">Cómo funciona</span>
      <h1 className="ml-headline" style={{ marginTop: 12, marginBottom: 24 }}>
        Un puente humano entre talento y marca.
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ml-text-muted)' }}>
        Moviendo Leyendas no es un directorio. Es un sistema donde la IA encuentra el match,
        modera el chat, genera el contrato y asegura el pago. El atleta y la marca se enfocan en
        construir relación. La plataforma se encarga del resto.
      </p>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--ml-text-muted)' }}>
        Hecho en México, para el ecosistema deportivo latinoamericano. Lanzamiento público en 2026.
      </p>
      <div style={{ marginTop: 32 }}>
        <Link to="/registro" className="ml-btn ml-btn-primary ml-btn-lg">Empezar ahora</Link>
      </div>
    </div>
  );
}
