import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { mlApi, ConversacionRow, MensajeRow } from '../../lib/mlApi';
import './ChatPage.css';

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<ConversacionRow[]>([]);
  const [activa, setActiva] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<MensajeRow[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listEnd = useRef<HTMLDivElement>(null);

  // Cargar conversaciones
  useEffect(() => {
    if (!user) return;
    mlApi.conversaciones(user.id, user.tipo).then((res) => {
      if (res.success && res.data) {
        setConvs(res.data);
        if (res.data[0]) setActiva(res.data[0].match_id);
      }
    });
  }, [user]);

  // Cargar mensajes de la conversación activa
  useEffect(() => {
    if (!activa) { setMsgs([]); return; }
    mlApi.mensajes(activa).then((res) => {
      if (res.success && res.data) setMsgs(res.data);
    });
  }, [activa]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  if (!user) return null;

  const conv = convs.find((c) => c.match_id === activa);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!user || !activa) return;
    const txt = input.trim();
    if (!txt) return;
    setSending(true);
    const res = await mlApi.enviarMensaje(activa, txt, user.tipo);
    setSending(false);
    if (res.success && res.data) {
      setMsgs((prev) => [...prev, res.data!.mensaje, ...(res.data!.ia ? [res.data!.ia] : [])]);
      setInput('');
    }
  }

  function autorLado(m: MensajeRow): 'me' | 'them' | 'ia' {
    if (m.autor_tipo === 'ia') return 'ia';
    const meTipo = user!.tipo === 'atleta' ? 'talento' : 'marca';
    return m.autor_tipo === meTipo ? 'me' : 'them';
  }

  return (
    <div className="cht">
      <div className="cht-layout">
        <aside className="cht-sidebar">
          <div className="cht-search">
            <input className="ml-input" placeholder="Buscar conversación" />
          </div>
          <div className="cht-list">
            {convs.length === 0 && (
              <div style={{ padding: 16, color: 'var(--ml-text-muted)', fontSize: 14 }}>
                Aún no tienes conversaciones. Genera matches primero.
              </div>
            )}
            {convs.map((c) => (
              <button
                key={c.match_id}
                className={`cht-item ${activa === c.match_id ? 'is-on' : ''}`}
                onClick={() => setActiva(c.match_id)}
              >
                <img src={c.foto_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(c.otro_nombre)}&backgroundColor=8B5E3C`} alt={c.otro_nombre} />
                <div className="cht-item-info">
                  <div className="cht-item-top">
                    <span className="cht-item-name">{c.otro_nombre}</span>
                    <span className="cht-item-time">{timeAgo(c.ultimo_at)}</span>
                  </div>
                  <div className="cht-item-bottom">
                    <span className="cht-item-last">{c.ultimo ?? `Match ${c.porcentaje}%`}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="cht-main">
          {conv ? (
            <>
              <header className="cht-head">
                <img src={conv.foto_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(conv.otro_nombre)}&backgroundColor=8B5E3C`} alt={conv.otro_nombre} />
                <div>
                  <div className="cht-head-name">{conv.otro_nombre}</div>
                  <div className="cht-head-meta">{conv.otro_meta} · {conv.match_estado}</div>
                </div>
                <button className="ml-btn ml-btn-ghost">Ver perfil</button>
              </header>

              <div className="cht-stream">
                {msgs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--ml-text-muted)' }}>
                    Empieza la conversación.
                  </div>
                )}
                {msgs.map((m) => {
                  const lado = autorLado(m);
                  return (
                    <div key={m.id} className={`cht-msg cht-msg-${lado} ${m.tipo_ia ? `cht-msg-${m.tipo_ia}` : ''}`}>
                      {lado === 'ia' && (
                        <div className="cht-ia-head">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                          </svg>
                          IA Moviendo Leyendas
                        </div>
                      )}
                      <div className="cht-bubble">
                        <p>{m.texto}</p>
                        <span className="cht-hora">{fmtHora(m.created_at)}</span>
                      </div>
                      {m.tipo_ia === 'cierre' && (
                        <div className="cht-ia-actions">
                          <button className="ml-btn ml-btn-earth">Generar borrador</button>
                          <button className="ml-btn ml-btn-ghost">Ahora no</button>
                        </div>
                      )}
                      {m.tipo_ia === 'fuga' && (
                        <div className="cht-ia-actions">
                          <button className="ml-btn ml-btn-secondary">Seguir aquí</button>
                          <button className="ml-btn ml-btn-ghost cht-action-danger">Continuar afuera</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={listEnd} />
              </div>

              <form className="cht-input" onSubmit={send}>
                <input
                  className="ml-input"
                  placeholder="Escribe un mensaje…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                />
                <button className="ml-btn ml-btn-primary" type="submit" disabled={!input.trim() || sending}>
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ml-text-muted)' }}>
              Selecciona una conversación
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
