import { FormEvent, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { mlApi } from '../../lib/mlApi';
import { useToast } from '../../ui/Toast';
import './PerfilPage.css';

export default function PerfilPage() {
  const { user, updateUser, refresh } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // Atleta
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [ciudad, setCiudad] = useState(user?.ciudad ?? '');
  const [foto, setFoto] = useState(user?.foto_url ?? '');
  const [disciplina, setDisciplina] = useState(user?.disciplina ?? '');
  const [edad, setEdad] = useState<string>(user?.edad ? String(user.edad) : '');
  const [telefono, setTelefono] = useState(user?.telefono ?? '');
  const [seguidores, setSeguidores] = useState<string>(user?.redes_seguidores ? String(user.redes_seguidores) : '0');
  // Marca
  const [industria, setIndustria] = useState(user?.industria ?? '');
  const [presupuesto, setPresupuesto] = useState<string>(user?.presupuesto_mxn ? String(user.presupuesto_mxn) : '');
  const [sitio, setSitio] = useState(user?.sitio_web ?? '');
  // Plan
  const [plan, setPlan] = useState<'free' | 'pro' | 'premium'>((user?.plan as 'free' | 'pro' | 'premium') ?? 'free');

  if (!user) return null;

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const patch: Record<string, unknown> = { nombre, plan };
    if (user!.tipo === 'atleta') {
      patch.bio = bio || null;
      patch.ciudad = ciudad || null;
      patch.foto_url = foto || null;
      patch.disciplina = disciplina;
      if (edad) patch.edad = parseInt(edad, 10);
      patch.telefono = telefono || null;
      patch.redes_seguidores = parseInt(seguidores, 10) || 0;
    } else {
      patch.industria = industria;
      if (presupuesto) patch.presupuesto_mxn = parseInt(presupuesto, 10);
      patch.sitio_web = sitio || null;
    }
    const res = await mlApi.patchMe(user!.id, user!.tipo, patch);
    setSaving(false);
    if (res.success && res.data) {
      updateUser(res.data);
      toast.push('success', 'Perfil actualizado');
      refresh();
    } else {
      toast.push('error', res.error ?? 'No se pudo guardar');
    }
  }

  return (
    <div className="prf">
      <div className="page-head">
        <span className="ml-eyebrow">Perfil</span>
        <h1 className="page-title">Tu perfil público</h1>
        <p className="page-sub">
          Esta información se muestra a las {user.tipo === 'atleta' ? 'marcas' : 'atletas'} que te emparejen. Más completo, más matches.
        </p>
      </div>

      <form onSubmit={guardar} className="prf-grid">
        <section className="prf-card">
          <div className="ml-eyebrow">Identidad</div>
          <div className="ml-field">
            <label className="ml-label">{user.tipo === 'atleta' ? 'Nombre completo' : 'Nombre de la marca'}</label>
            <input className="ml-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          {user.tipo === 'atleta' && (
            <>
              <div className="ml-field">
                <label className="ml-label">Foto (URL)</label>
                <input className="ml-input" value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://…" />
                <div className="ml-help">Puedes pegar un link a tu mejor foto. Subida directa viene en la siguiente versión.</div>
              </div>
              <div className="ml-field">
                <label className="ml-label">Ciudad</label>
                <input className="ml-input" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej. Monterrey" />
              </div>
              <div className="ml-field">
                <label className="ml-label">Bio</label>
                <textarea
                  className="ml-input"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Qué te define como atleta y qué buscas. 1-3 frases."
                />
              </div>
            </>
          )}
        </section>

        {user.tipo === 'atleta' ? (
          <section className="prf-card">
            <div className="ml-eyebrow">Atleta</div>
            <div className="ml-field">
              <label className="ml-label">Disciplina</label>
              <input className="ml-input" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} placeholder="Ej. F4 NACAM" />
            </div>
            <div className="prf-row2">
              <div className="ml-field">
                <label className="ml-label">Edad</label>
                <input className="ml-input" type="number" min={10} max={100} value={edad} onChange={(e) => setEdad(e.target.value)} />
              </div>
              <div className="ml-field">
                <label className="ml-label">Teléfono</label>
                <input className="ml-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
            </div>
            <div className="ml-field">
              <label className="ml-label">Seguidores en redes</label>
              <input className="ml-input" type="number" min={0} value={seguidores} onChange={(e) => setSeguidores(e.target.value)} />
            </div>
          </section>
        ) : (
          <section className="prf-card">
            <div className="ml-eyebrow">Marca</div>
            <div className="ml-field">
              <label className="ml-label">Industria</label>
              <input className="ml-input" value={industria} onChange={(e) => setIndustria(e.target.value)} placeholder="Ej. Bebidas deportivas" />
            </div>
            <div className="ml-field">
              <label className="ml-label">Presupuesto mensual (MXN)</label>
              <input className="ml-input" type="number" min={0} value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
              <div className="ml-help">Solo se muestra cuando hay un match.</div>
            </div>
            <div className="ml-field">
              <label className="ml-label">Sitio web</label>
              <input className="ml-input" type="url" value={sitio} onChange={(e) => setSitio(e.target.value)} placeholder="https://tumarca.com" />
            </div>
          </section>
        )}

        <section className="prf-card prf-span-2">
          <div className="ml-eyebrow">Plan</div>
          <div className="prf-plans">
            {(['free', 'pro', 'premium'] as const).map((p) => (
              <label key={p} className={`onb-plan ${plan === p ? 'is-on' : ''}`}>
                <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} />
                <div className="onb-plan-head">
                  <div className="onb-plan-name">{p.toUpperCase()}</div>
                  <div className="onb-plan-price">
                    {p === 'free' ? '$0' : p === 'pro' ? '$499' : '$2,000'}
                    <span>/mes</span>
                  </div>
                </div>
                <ul className="onb-plan-feats">
                  {p === 'free' && (<><li>50 matches/año</li><li>Chat con IA</li><li>Vitrina</li></>)}
                  {p === 'pro' && (<><li>1,000 matches/año</li><li>IA optimiza perfil</li><li>Soporte prioritario</li></>)}
                  {p === 'premium' && (<><li>Matches ilimitados</li><li>IA avanzada</li><li>Account manager</li></>)}
                </ul>
              </label>
            ))}
          </div>
        </section>

        <div className="prf-actions prf-span-2">
          <button type="submit" className="ml-btn ml-btn-primary ml-btn-lg" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
