import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './PublicShell.css';

export default function PublicShell() {
  const { user } = useAuth();

  return (
    <div className="pub">
      <header className="pub-header">
        <div className="ml-container pub-header-inner">
          <Link to="/" className="pub-logo">
            ML <span className="pub-logo-sub">Moviendo Leyendas</span>
          </Link>
          <nav className="pub-nav">
            <NavLink to="/" end>Inicio</NavLink>
            <NavLink to="/about">Cómo funciona</NavLink>
            <NavLink to="/planes">Planes</NavLink>
          </nav>
          <div className="pub-cta">
            {user ? (
              <Link to="/app/dashboard" className="ml-btn ml-btn-primary">Entrar</Link>
            ) : (
              <>
                <Link to="/login" className="ml-btn ml-btn-ghost">Iniciar sesión</Link>
                <Link to="/registro" className="ml-btn ml-btn-primary">Regístrate</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="pub-footer">
        <div className="ml-container pub-footer-inner">
          <div>
            <div className="pub-logo-footer">Moviendo Leyendas</div>
            <p className="pub-tagline">El puente entre tu talento y la marca correcta.</p>
          </div>
          <div className="pub-foot-cols">
            <div>
              <div className="ml-eyebrow">Plataforma</div>
              <Link to="/about">Cómo funciona</Link>
              <Link to="/planes">Planes</Link>
              <Link to="/registro">Registrarse</Link>
            </div>
            <div>
              <div className="ml-eyebrow">Contacto</div>
              <a href="mailto:hola@moviendoleyendas.com">hola@moviendoleyendas.com</a>
              <a href="https://instagram.com">Instagram</a>
            </div>
            <div>
              <div className="ml-eyebrow">Legal</div>
              <Link to="/terminos">Términos</Link>
              <Link to="/privacidad">Privacidad</Link>
            </div>
          </div>
        </div>
        <div className="ml-container pub-foot-bottom">
          © 2026 Moviendo Leyendas — Hecho en México
        </div>
      </footer>
    </div>
  );
}
