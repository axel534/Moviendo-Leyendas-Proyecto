import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AppShell.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'M3 12 12 4l9 8M5 10v10h14V10' },
  { to: '/app/match', label: 'Match', icon: 'M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z' },
  { to: '/app/chat', label: 'Chat', icon: 'M4 4h16v12H6l-2 4z' },
  { to: '/app/vitrina', label: 'Vitrina', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { to: '/app/perfil', label: 'Perfil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 4-6 8-6s8 2 8 6' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="app-shell">
      <aside className="app-side">
        <div className="app-logo">
          <span className="app-logo-mark">ML</span>
        </div>
        <nav className="app-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className="app-nav-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-side-bottom">
          {user && (
            <div className="app-userbox">
              <img className="app-avatar" src={user.foto_url ?? 'https://i.pravatar.cc/200'} alt={user.nombre} />
              <div className="app-userbox-info">
                <div className="app-userbox-name">{user.nombre}</div>
                <div className="app-userbox-plan">{user.plan.toUpperCase()}</div>
              </div>
            </div>
          )}
          <button
            className="app-logout"
            onClick={() => {
              logout();
              nav('/');
            }}
          >
            Salir
          </button>
        </div>
      </aside>

      <div className="app-main">
        <Outlet />
      </div>
    </div>
  );
}
