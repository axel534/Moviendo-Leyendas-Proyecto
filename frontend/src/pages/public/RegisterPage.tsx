import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, UserType } from '../../auth/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialTipo = (params.get('tipo') as UserType) || 'atleta';
  const [tipo, setTipo] = useState<UserType>(initialTipo);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!nombre || !email || !pass) {
      setErr('Completa los campos para continuar');
      return;
    }
    const res = await register({ nombre, email, tipo });
    if (!res.ok) { setErr(res.error); return; }
    nav('/onboarding', { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="ml-container-narrow">
        <Link to="/" className="auth-back">← Volver al inicio</Link>
        <div className="auth-card">
          <span className="ml-eyebrow">Crear cuenta</span>
          <h1 className="auth-title">Empieza en Moviendo Leyendas</h1>
          <p className="auth-sub">Elige tu lado y arranca en 30 segundos.</p>

          <div className="auth-tipo-grid">
            <button
              type="button"
              className={`auth-tipo ${tipo === 'atleta' ? 'is-active' : ''}`}
              onClick={() => setTipo('atleta')}
            >
              <div className="auth-tipo-title">Soy deportista</div>
              <div className="auth-tipo-sub">Busco patrocinio para seguir compitiendo.</div>
            </button>
            <button
              type="button"
              className={`auth-tipo ${tipo === 'marca' ? 'is-active' : ''}`}
              onClick={() => setTipo('marca')}
            >
              <div className="auth-tipo-title">Soy sponsor</div>
              <div className="auth-tipo-sub">Busco deportistas que representen mi marca.</div>
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="ml-field">
              <label className="ml-label" htmlFor="nombre">{tipo === 'atleta' ? 'Tu nombre' : 'Nombre del sponsor'}</label>
              <input
                id="nombre"
                className="ml-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={tipo === 'atleta' ? 'Ej. Luis Carrasco' : 'Ej. Hidra+'}
              />
            </div>
            <div className="ml-field">
              <label className="ml-label" htmlFor="email">Correo</label>
              <input
                id="email"
                className="ml-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />
            </div>
            <div className="ml-field">
              <label className="ml-label" htmlFor="pass">Contraseña</label>
              <input
                id="pass"
                className="ml-input"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {err && <div className="auth-err">{err}</div>}

            <button type="submit" className="ml-btn ml-btn-primary ml-btn-block ml-btn-lg">
              Continuar al onboarding
            </button>
          </form>

          <div className="auth-foot">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
