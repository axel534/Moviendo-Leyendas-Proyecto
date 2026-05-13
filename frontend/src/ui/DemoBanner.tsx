import { useState } from 'react';
import { DEMO_MODE } from '../lib/mlApi';
import './DemoBanner.css';

const KEY = 'ml_demo_banner_hidden';

export default function DemoBanner() {
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === '1');

  if (!DEMO_MODE || hidden) return null;

  function dismiss() {
    localStorage.setItem(KEY, '1');
    setHidden(true);
  }

  function resetDemo() {
    if (!confirm('¿Restablecer todos los datos del demo a su estado original?')) return;
    localStorage.removeItem('ml_demo_state_v1');
    localStorage.removeItem('ml_demo_user');
    localStorage.removeItem('ml_staff_jwt');
    localStorage.removeItem('ml_staff_session');
    window.location.reload();
  }

  return (
    <div className="demo-banner">
      <span className="demo-banner-dot" />
      <span className="demo-banner-txt">
        <strong>Modo demo.</strong> Los datos viven en tu navegador. Cuando se conecte el backend real, todo persiste en la base.
      </span>
      <button className="demo-banner-link" onClick={resetDemo}>Restablecer</button>
      <button className="demo-banner-x" onClick={dismiss} aria-label="Cerrar">×</button>
    </div>
  );
}
