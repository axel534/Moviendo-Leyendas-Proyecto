import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './OnboardingPage.css';

const DEPORTES = ['Karting', 'Motocross', 'Atletismo', 'Tenis', 'Surf', 'MMA', 'Triatlón', 'F4', 'Ciclismo', 'Boxeo', 'Natación', 'Crossfit'];
const INDUSTRIAS = ['Bebidas', 'Ropa deportiva', 'Tecnología', 'Banca', 'Restaurantes', 'Automotriz', 'Telecom', 'Salud', 'Industrial', 'Inmobiliaria'];

const PASOS_ATLETA = ['Perfil básico', 'Disciplina', 'Lo que ofreces', 'Lo que buscas', 'Tu plan'];
const PASOS_MARCA  = ['Perfil básico', 'Industria', 'Presupuesto', 'Tu atleta ideal', 'Tu plan'];

export default function OnboardingPage() {
  const { user, completeOnboarding, updateUser } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  const pasos = user?.tipo === 'atleta' ? PASOS_ATLETA : PASOS_MARCA;
  const last = step === pasos.length - 1;

  const [ciudad, setCiudad] = useState(user?.ciudad ?? '');
  const [bio, setBio] = useState('');
  const [disciplina, setDisciplina] = useState<string[]>([]);
  const [nivel, setNivel] = useState('amateur');
  const [presupuesto, setPresupuesto] = useState('100000');
  const [planSel, setPlanSel] = useState<'free' | 'pro' | 'premium'>('free');

  function toggle(list: string[], v: string, set: (next: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function next() {
    if (last) {
      updateUser({ ciudad, plan: planSel });
      completeOnboarding();
      nav('/app/dashboard');
      return;
    }
    setStep((s) => s + 1);
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  const progress = useMemo(() => ((step + 1) / pasos.length) * 100, [step, pasos.length]);

  return (
    <div className="onb-page">
      <div className="onb-shell">
        <div className="onb-progress">
          <div className="onb-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="onb-steps">
          {pasos.map((p, i) => (
            <div key={p} className={`onb-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
              <span className="onb-step-n">{i + 1}</span>
              <span className="onb-step-label">{p}</span>
            </div>
          ))}
        </div>

        <div className="onb-card">
          <span className="ml-eyebrow">Paso {step + 1} de {pasos.length}</span>
          <h1 className="onb-title">{pasos[step]}</h1>

          {step === 0 && (
            <div className="onb-body">
              <p className="onb-help">Lo básico para que los sponsors te conozcan.</p>
              <div className="ml-field">
                <label className="ml-label">Ciudad</label>
                <input className="ml-input" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej. Monterrey" />
              </div>
              <div className="ml-field">
                <label className="ml-label">Bio corta</label>
                <textarea
                  className="ml-input"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={user?.tipo === 'atleta'
                    ? 'Quién eres en una frase. Logros recientes.'
                    : 'A qué se dedica tu marca y qué busca en un deportista.'}
                />
              </div>
            </div>
          )}

          {step === 1 && user?.tipo === 'atleta' && (
            <div className="onb-body">
              <p className="onb-help">Selecciona uno o varios deportes.</p>
              <div className="onb-chips">
                {DEPORTES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`onb-chip ${disciplina.includes(d) ? 'is-on' : ''}`}
                    onClick={() => toggle(disciplina, d, setDisciplina)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="ml-field" style={{ marginTop: 24 }}>
                <label className="ml-label">Nivel competitivo</label>
                <div className="onb-radios">
                  {['amateur', 'semiprofesional', 'profesional'].map((n) => (
                    <label key={n} className={`onb-radio ${nivel === n ? 'is-on' : ''}`}>
                      <input type="radio" name="nivel" value={n} checked={nivel === n} onChange={() => setNivel(n)} />
                      <span>{n.charAt(0).toUpperCase() + n.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && user?.tipo === 'marca' && (
            <div className="onb-body">
              <p className="onb-help">Tu industria principal.</p>
              <div className="onb-chips">
                {INDUSTRIAS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`onb-chip ${disciplina.includes(d) ? 'is-on' : ''}`}
                    onClick={() => toggle(disciplina, d, setDisciplina)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && user?.tipo === 'atleta' && (
            <div className="onb-body">
              <p className="onb-help">¿Qué puedes ofrecer a una marca? Selecciona todo lo que aplica.</p>
              <div className="onb-chips">
                {['Reels', 'Stories', 'Logo en uniforme', 'Presencia en eventos', 'Menciones en medios', 'Sesiones fotográficas', 'Streaming', 'Posts dedicados'].map((o) => (
                  <button key={o} type="button" className={`onb-chip ${disciplina.includes(o) ? 'is-on' : ''}`} onClick={() => toggle(disciplina, o, setDisciplina)}>{o}</button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && user?.tipo === 'marca' && (
            <div className="onb-body">
              <p className="onb-help">Presupuesto mensual aproximado.</p>
              <div className="ml-field">
                <label className="ml-label">Presupuesto MXN/mes</label>
                <input className="ml-input" type="number" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
                <div className="ml-help">Esto solo se comparte cuando hay un match.</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onb-body">
              <p className="onb-help">
                {user?.tipo === 'atleta'
                  ? '¿Qué tipo de marcas te interesan?'
                  : '¿Qué deportista encaja con tu sponsor?'}
              </p>
              <div className="ml-field">
                <label className="ml-label">Tipo de patrocinio que prefieres</label>
                <div className="onb-radios">
                  {['Económico', 'En especie', 'Mixto'].map((n) => (
                    <label key={n} className={`onb-radio ${nivel === n ? 'is-on' : ''}`}>
                      <input type="radio" name="tipo" value={n} checked={nivel === n} onChange={() => setNivel(n)} />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="ml-field">
                <label className="ml-label">Alcance geográfico</label>
                <div className="onb-radios">
                  {['Local', 'Regional', 'Nacional'].map((n) => (
                    <label key={n} className="onb-radio">
                      <input type="checkbox" />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onb-body">
              <p className="onb-help">Empieza gratis. Puedes cambiar de plan en cualquier momento.</p>
              <div className="onb-plans">
                {(['free', 'pro', 'premium'] as const).map((p) => (
                  <label key={p} className={`onb-plan ${planSel === p ? 'is-on' : ''}`}>
                    <input type="radio" name="plan" value={p} checked={planSel === p} onChange={() => setPlanSel(p)} />
                    <div className="onb-plan-head">
                      <div className="onb-plan-name">{p.toUpperCase()}</div>
                      <div className="onb-plan-price">
                        {p === 'free' ? '$0' : p === 'pro' ? '$499' : '$2,000'}
                        <span>/mes</span>
                      </div>
                    </div>
                    <ul className="onb-plan-feats">
                      {p === 'free' && (<>
                        <li>50 matches al año</li>
                        <li>Chat con IA</li>
                        <li>Vitrina</li>
                      </>)}
                      {p === 'pro' && (<>
                        <li>1,000 matches al año</li>
                        <li>IA optimiza tu perfil</li>
                        <li>IA recomienda acciones</li>
                      </>)}
                      {p === 'premium' && (<>
                        <li>Matches ilimitados</li>
                        <li>IA avanzada</li>
                        <li>Acceso a grandes marcas</li>
                      </>)}
                    </ul>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="onb-actions">
            <button className="ml-btn ml-btn-ghost" onClick={prev} disabled={step === 0}>Atrás</button>
            <button className="ml-btn ml-btn-primary" onClick={next}>
              {last ? 'Terminar y entrar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
