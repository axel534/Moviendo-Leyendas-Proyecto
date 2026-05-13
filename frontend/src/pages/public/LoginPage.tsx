import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('luis@moviendoleyendas.com');
  const [pass, setPass] = useState('demo');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !pass) {
      setErr('Captura tu correo y contraseña');
      return;
    }
    const res = await login(email);
    if (!res.ok) { setErr(res.error); return; }
    const dest = (loc.state as { from?: { pathname: string } })?.from?.pathname ?? '/app/dashboard';
    nav(dest, { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="ml-container-narrow">
        <Link to="/" className="auth-back">← Volver al inicio</Link>
        <div className="auth-card">
          <span className="ml-eyebrow">Iniciar sesión</span>
          <h1 className="auth-title">Bienvenido de vuelta</h1>
          <p className="auth-sub">Entra y sigue construyendo acuerdos.</p>

          <form onSubmit={submit}>
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
                placeholder="••••••••"
              />
              <div className="ml-help">Demo: cualquier correo y cualquier contraseña funciona.</div>
            </div>

            {err && <div className="auth-err">{err}</div>}

            <button type="submit" className="ml-btn ml-btn-primary ml-btn-block ml-btn-lg">Entrar</button>
          </form>

          <div className="auth-foot">
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
