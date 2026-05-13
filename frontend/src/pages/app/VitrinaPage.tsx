import { useEffect, useState } from 'react';
import { mlApi, PostVitrinaRow } from '../../lib/mlApi';
import { useToast } from '../../ui/Toast';
import { Skeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import './VitrinaPage.css';

type FiltroVit = 'todos' | 'logro' | 'acuerdo' | 'competencia' | 'general';

const FILTROS: Array<{ key: FiltroVit; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'logro', label: 'Logros' },
  { key: 'competencia', label: 'Competencias' },
  { key: 'acuerdo', label: 'Acuerdos cerrados' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = diff / 3600000;
  if (h < 1) return `hace ${Math.max(1, Math.floor(diff / 60000))}min`;
  if (h < 24) return `hace ${Math.floor(h)}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/\s+/).map((t) => t.replace(/^#/, '')).filter(Boolean);
}

export default function VitrinaPage() {
  const toast = useToast();
  const [filtro, setFiltro] = useState<FiltroVit>('todos');
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<PostVitrinaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bumps, setBumps] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      mlApi.vitrina({ tipo: filtro, q: q || undefined }).then((res) => {
        if (res.success && res.data) setPosts(res.data);
        setLoading(false);
      });
    }, q ? 250 : 0); // debounce ligero al escribir
    return () => clearTimeout(t);
  }, [filtro, q]);

  async function toggleLike(id: string, currentLikes: number) {
    if (liked[id]) return;
    setLiked((p) => ({ ...p, [id]: true }));
    setBumps((p) => ({ ...p, [id]: currentLikes + 1 }));
    const res = await mlApi.like(id);
    if (!res.success) {
      setLiked((p) => ({ ...p, [id]: false }));
      setBumps((p) => { const { [id]: _, ...rest } = p; return rest; });
      toast.push('error', 'No se pudo dar like');
    }
  }

  return (
    <div className="vtr">
      <div className="page-head">
        <span className="ml-eyebrow">Vitrina</span>
        <h1 className="page-title">Lo que los deportistas están moviendo</h1>
        <p className="page-sub">Logros, competencias y acuerdos en tiempo real. Solo visible para usuarios registrados.</p>
      </div>

      <div className="vtr-toolbar">
        <input
          className="ml-input vtr-search"
          placeholder="Buscar por deportista, texto, deporte o hashtag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="ml-btn ml-btn-earth">Publicar</button>
      </div>

      <div className="vtr-filters">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            className={`onb-chip ${filtro === f.key ? 'is-on' : ''}`}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="vtr-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="vtr-post">
              <div style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Skeleton width={40} height={40} radius="full" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="50%" height={14} />
                  <div style={{ marginTop: 6 }}><Skeleton width="30%" height={11} /></div>
                </div>
              </div>
              <Skeleton width="100%" height={280} />
              <div style={{ padding: 16 }}><Skeleton width="80%" height={14} /></div>
            </div>
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <EmptyState
          title="No hay publicaciones que coincidan"
          description={q ? `Nada para "${q}". Prueba con otro término o cambia el filtro.` : 'Aún no hay publicaciones en esta categoría.'}
          action={q && <button className="ml-btn ml-btn-secondary" onClick={() => setQ('')}>Limpiar búsqueda</button>}
        />
      )}

      {!loading && posts.length > 0 && (
        <div className="vtr-grid">
          {posts.map((p) => {
            const likesCount = bumps[p.id] ?? p.likes;
            const tags = parseTags(p.hashtags);
            return (
              <article className="vtr-post" key={p.id}>
                <header className="vtr-post-head">
                  <img className="vtr-avatar" src={p.foto_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.autor_nombre)}`} alt={p.autor_nombre} />
                  <div className="vtr-author">
                    <div className="vtr-name">{p.autor_nombre}</div>
                    <div className="vtr-meta">{p.disciplina} · {p.ciudad ?? ''}</div>
                  </div>
                  {p.tipo !== 'general' && (
                    <span className={`ml-badge ${p.tipo === 'acuerdo' ? 'ml-badge-success' : 'ml-badge-earth'}`}>{p.tipo}</span>
                  )}
                </header>

                {p.imagen_url && (
                  <div className="vtr-image-wrap">
                    <img className="vtr-image" src={p.imagen_url} alt={p.texto} loading="lazy" />
                  </div>
                )}

                <div className="vtr-actions">
                  <button className={`vtr-btn ${liked[p.id] ? 'is-liked' : ''}`} onClick={() => toggleLike(p.id, p.likes)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={liked[p.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{likesCount}</span>
                  </button>
                  <button className="vtr-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>—</span>
                  </button>
                  <button className="vtr-btn vtr-btn-right">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>

                <div className="vtr-body">
                  <p className="vtr-text">
                    <strong>{p.autor_nombre.split(' ')[0]}</strong> {p.texto}
                  </p>
                  {tags.length > 0 && (
                    <div className="vtr-tags">
                      {tags.map((h) => (
                        <a key={h} className="vtr-tag" onClick={() => setQ(h)}>#{h}</a>
                      ))}
                    </div>
                  )}
                  <div className="vtr-tiempo">{timeAgo(p.created_at)}</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
