import { FormEvent, useEffect, useState } from 'react';
import { integracionesApi, IntegracionRow, IntegracionSlug, TestResult } from './api';
import './AdminIntegraciones.css';

interface Props {
  onBack: () => void;
}

interface CardProps {
  row: IntegracionRow;
  onSaved: (next: IntegracionRow) => void;
  onTest: (slug: IntegracionSlug) => Promise<TestResult | null>;
}

const SLUG_DESC: Record<IntegracionSlug, { tagline: string; docs: string }> = {
  railway:     { tagline: 'Despliegues y operaciones en Railway',     docs: 'https://docs.railway.com/reference/public-api' },
  secureshell: { tagline: 'Conexión SSH a servidores de producción',  docs: 'https://man.openbsd.org/ssh' },
  whapi:       { tagline: 'WhatsApp Business para notificar usuarios', docs: 'https://whapi.cloud/docs' },
};

function ts(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function RailwayForm({ config, set }: { config: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <div className="ml-field">
        <label className="ml-label">API Token</label>
        <input
          className="ml-input"
          type="password"
          value={String(config.api_token ?? '')}
          onChange={(e) => set('api_token', e.target.value)}
          placeholder={config._api_token_set ? 'Token guardado (deja en blanco para conservar)' : 'Pega tu token de Railway'}
        />
        <div className="ml-help">Genera en railway.com → Account Settings → Tokens.</div>
      </div>
      <div className="ml-field">
        <label className="ml-label">Project ID (opcional)</label>
        <input
          className="ml-input"
          value={String(config.project_id ?? '')}
          onChange={(e) => set('project_id', e.target.value)}
        />
      </div>
    </>
  );
}

function SshForm({ config, set }: { config: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  const authType = String(config.auth_type ?? 'key');
  return (
    <>
      <div className="int-row3">
        <div className="ml-field">
          <label className="ml-label">Host</label>
          <input className="ml-input" value={String(config.host ?? '')} onChange={(e) => set('host', e.target.value)} placeholder="34.135.245.35" />
        </div>
        <div className="ml-field">
          <label className="ml-label">Puerto</label>
          <input className="ml-input" type="number" value={String(config.port ?? 22)} onChange={(e) => set('port', parseInt(e.target.value, 10) || 22)} />
        </div>
        <div className="ml-field">
          <label className="ml-label">Usuario</label>
          <input className="ml-input" value={String(config.user ?? '')} onChange={(e) => set('user', e.target.value)} placeholder="atorres" />
        </div>
      </div>
      <div className="ml-field">
        <label className="ml-label">Método de autenticación</label>
        <div className="onb-radios">
          <label className={`onb-radio ${authType === 'key' ? 'is-on' : ''}`}>
            <input type="radio" checked={authType === 'key'} onChange={() => set('auth_type', 'key')} />
            <span>Llave privada</span>
          </label>
          <label className={`onb-radio ${authType === 'password' ? 'is-on' : ''}`}>
            <input type="radio" checked={authType === 'password'} onChange={() => set('auth_type', 'password')} />
            <span>Contraseña</span>
          </label>
        </div>
      </div>
      {authType === 'key' ? (
        <div className="ml-field">
          <label className="ml-label">Llave privada</label>
          <textarea
            className="ml-input"
            rows={5}
            value={String(config.private_key ?? '')}
            onChange={(e) => set('private_key', e.target.value)}
            placeholder={config._private_key_set ? 'Llave guardada (deja en blanco para conservar)' : '-----BEGIN OPENSSH PRIVATE KEY-----'}
          />
        </div>
      ) : (
        <div className="ml-field">
          <label className="ml-label">Contraseña</label>
          <input
            className="ml-input"
            type="password"
            value={String(config.password ?? '')}
            onChange={(e) => set('password', e.target.value)}
            placeholder={config._password_set ? 'Contraseña guardada' : ''}
          />
        </div>
      )}
      <div className="ml-help">
        Para v1, el probador solo verifica que el puerto responde con un banner SSH válido. No ejecuta comandos remotos.
      </div>
    </>
  );
}

function WhapiForm({ config, set }: { config: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <div className="ml-field">
        <label className="ml-label">API Token</label>
        <input
          className="ml-input"
          type="password"
          value={String(config.api_token ?? '')}
          onChange={(e) => set('api_token', e.target.value)}
          placeholder={config._api_token_set ? 'Token guardado' : 'Pega tu token de Whapi'}
        />
        <div className="ml-help">Encuéntralo en panel.whapi.cloud → Settings → API Token.</div>
      </div>
      <div className="int-row2">
        <div className="ml-field">
          <label className="ml-label">Channel ID</label>
          <input
            className="ml-input"
            value={String(config.channel_id ?? '')}
            onChange={(e) => set('channel_id', e.target.value)}
            placeholder="WHC-12345"
          />
        </div>
        <div className="ml-field">
          <label className="ml-label">Base URL</label>
          <input
            className="ml-input"
            value={String(config.base_url ?? 'https://gate.whapi.cloud')}
            onChange={(e) => set('base_url', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

function IntegracionCard({ row, onSaved, onTest }: CardProps) {
  const [config, setConfig] = useState<Record<string, unknown>>(row.config);
  const [activa, setActiva] = useState(row.activa);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; texto: string } | null>(null);

  function setField(k: string, v: unknown) {
    setConfig((c) => ({ ...c, [k]: v }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await integracionesApi.save(row.slug, { config, activa });
    setSaving(false);
    if (res.success && res.data) {
      onSaved(res.data);
      setConfig(res.data.config);
      setMsg({ tone: 'success', texto: 'Configuración guardada' });
    } else {
      setMsg({ tone: 'error', texto: res.error ?? 'No se pudo guardar' });
    }
  }

  async function probar() {
    setTesting(true);
    setMsg(null);
    const r = await onTest(row.slug);
    setTesting(false);
    setTestResult(r);
    if (r) {
      setMsg({
        tone: r.ok ? 'success' : 'error',
        texto: r.ok ? (r.info ?? 'Conexión OK') : (r.error ?? 'Falló la prueba'),
      });
    }
  }

  return (
    <form className="int-card" onSubmit={guardar}>
      <header className="int-head">
        <div className="int-head-info">
          <div className="int-head-name">
            {row.nombre}
            <span className={`int-dot ${row.last_test_ok ? 'is-ok' : row.last_test_ok === false ? 'is-err' : 'is-neutral'}`} />
          </div>
          <div className="int-head-tag">{SLUG_DESC[row.slug].tagline}</div>
        </div>
        <label className="int-toggle">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
          <span>{activa ? 'Activa' : 'Pausada'}</span>
        </label>
      </header>

      <div className="int-body">
        {row.slug === 'railway'     && <RailwayForm config={config} set={setField} />}
        {row.slug === 'secureshell' && <SshForm     config={config} set={setField} />}
        {row.slug === 'whapi'       && <WhapiForm   config={config} set={setField} />}
      </div>

      <footer className="int-foot">
        <div className="int-foot-meta">
          <div>
            <span className="ml-eyebrow">Última prueba</span>
            <div className="int-foot-val">{ts(row.last_test_at)}</div>
          </div>
          <div>
            <span className="ml-eyebrow">Estado</span>
            <div className="int-foot-val">
              {row.last_test_ok === true && <span className="int-pill int-pill-ok">OK</span>}
              {row.last_test_ok === false && <span className="int-pill int-pill-err">Falló</span>}
              {row.last_test_ok === null && <span className="int-pill">Sin probar</span>}
            </div>
          </div>
          <a href={SLUG_DESC[row.slug].docs} target="_blank" rel="noopener noreferrer" className="int-docs">
            Documentación ↗
          </a>
        </div>

        {msg && <div className={`int-msg int-msg-${msg.tone}`}>{msg.texto}</div>}

        <div className="int-foot-actions">
          <button type="button" className="ml-btn ml-btn-secondary" onClick={probar} disabled={testing}>
            {testing ? 'Probando…' : 'Probar conexión'}
          </button>
          <button type="submit" className="ml-btn ml-btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </footer>
    </form>
  );
}

export default function AdminIntegraciones({ onBack }: Props) {
  const [rows, setRows] = useState<IntegracionRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await integracionesApi.list();
    setLoading(false);
    if (res.success && res.data) setRows(res.data);
  }

  useEffect(() => { refresh(); }, []);

  async function handleTest(slug: IntegracionSlug) {
    const res = await integracionesApi.test(slug);
    refresh(); // recargar para mostrar last_test_at actualizado
    return res.success && res.data ? res.data : null;
  }

  function handleSaved(next: IntegracionRow) {
    setRows((prev) => prev.map((r) => (r.slug === next.slug ? next : r)));
  }

  return (
    <div className="adm int">
      <div className="adm-shell">
        <div className="adm-header">
          <div>
            <div className="adm-title">Integraciones</div>
            <div className="adm-subtitle">Conexiones con servicios externos · solo Owner</div>
          </div>
          <button className="adm-logout" onClick={onBack}>← Volver</button>
        </div>

        <div className="int-disclaimer">
          Las credenciales se guardan en la base de datos. Para producción se recomienda mover los valores sensibles
          a un KMS o encriptarlos con <code>pgcrypto</code>.
        </div>

        {loading && <div className="adm-loading">Cargando integraciones…</div>}

        {!loading && (
          <div className="int-grid">
            {rows.map((r) => (
              <IntegracionCard key={r.slug} row={r} onSaved={handleSaved} onTest={handleTest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
