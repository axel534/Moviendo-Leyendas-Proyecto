/**
 * Implementación en memoria + localStorage de toda la API.
 * Misma firma exacta que `mlApi` y `admin/api`.
 * Se selecciona automáticamente cuando VITE_API_BASE_URL está vacío.
 */

import type { UserType } from '../auth/AuthContext';
import type {
  ApiResponse,
  MatchRow,
  MatchFilters,
  ConversacionRow,
  MensajeRow,
  PostVitrinaRow,
  VitrinaFilters,
  SessionUserApi,
  StatsPublicos,
  AdminStats,
} from './mlApi';
import {
  SEED_TALENTOS, SEED_MARCAS, SEED_MATCHES, SEED_MENSAJES, SEED_POSTS, SEED_STAFF, SEED_INTEGRACIONES,
  MockTalento, MockMarca, MockMatch, MockMensaje, MockPost, MockStaff, MockIntegracion,
} from './mockData';

// =============================================================
// STATE
// =============================================================
const STORE_KEY = 'ml_demo_state_v1';

interface State {
  talentos: MockTalento[];
  marcas: MockMarca[];
  matches: MockMatch[];
  mensajes: MockMensaje[];
  posts: MockPost[];
  staff: MockStaff[];
  integraciones: MockIntegracion[];
}

function seedState(): State {
  return {
    talentos: structuredClone(SEED_TALENTOS),
    marcas: structuredClone(SEED_MARCAS),
    matches: structuredClone(SEED_MATCHES),
    mensajes: structuredClone(SEED_MENSAJES),
    posts: structuredClone(SEED_POSTS),
    staff: structuredClone(SEED_STAFF),
    integraciones: structuredClone(SEED_INTEGRACIONES),
  };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    return JSON.parse(raw) as State;
  } catch {
    return seedState();
  }
}

function saveState(s: State) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

let state = loadState();

function persist() { saveState(state); }

function uuid(): string {
  return 'm-' + Math.random().toString(36).slice(2, 10);
}

function ok<T>(data: T): ApiResponse<T> { return { success: true, data }; }
function err(error: string): ApiResponse<never> { return { success: false, error }; }

// =============================================================
// HELPERS de mapeo (mock → mismo shape que backend real)
// =============================================================

function talentoToSession(t: MockTalento): SessionUserApi {
  return {
    id: t.id,
    tipo: 'atleta',
    nombre: t.nombre,
    email: t.email,
    ciudad: t.ciudad,
    foto_url: t.foto_url,
    plan: t.plan,
    puntuacion: t.puntuacion,
    estado: t.estado,
    onboarded: t.estado !== 'pendiente' || !!t.bio,
    bio: t.bio,
    disciplina: t.disciplina,
    edad: t.edad,
    redes_seguidores: t.redes_seguidores,
    telefono: t.telefono,
  };
}

function marcaToSession(m: MockMarca): SessionUserApi {
  return {
    id: m.id,
    tipo: 'marca',
    nombre: m.nombre,
    email: m.contacto_email,
    foto_url: null,
    plan: m.plan,
    puntuacion: m.puntuacion,
    estado: m.estado,
    onboarded: m.estado !== 'pendiente',
    industria: m.industria,
    presupuesto_mxn: m.presupuesto_mxn,
    sitio_web: m.sitio_web,
  };
}

function buildMatchRow(m: MockMatch): MatchRow {
  const t = state.talentos.find((x) => x.id === m.talento_id);
  const ma = state.marcas.find((x) => x.id === m.marca_id);
  return {
    id: m.id,
    porcentaje: m.porcentaje,
    estado: m.estado,
    razones: m.razones,
    created_at: m.created_at,
    marca_id: ma?.id,
    marca_nombre: ma?.nombre,
    industria: ma?.industria,
    pais: ma?.pais ?? undefined,
    presupuesto_mxn: ma?.presupuesto_mxn ?? undefined,
    marca_puntuacion: ma?.puntuacion,
    talento_id: t?.id,
    talento_nombre: t?.nombre,
    disciplina: t?.disciplina,
    ciudad: t?.ciudad ?? undefined,
    foto_url: t?.foto_url ?? undefined,
    redes_seguidores: t?.redes_seguidores,
    talento_puntuacion: t?.puntuacion,
  };
}

// =============================================================
// PUBLIC API (mlApi shape)
// =============================================================
export const mockMlApi = {
  login: async (email: string) => {
    const t = state.talentos.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (t) return ok(talentoToSession(t));
    const m = state.marcas.find((x) => x.contacto_email.toLowerCase() === email.toLowerCase());
    if (m) return ok(marcaToSession(m));
    // Fallback demo: Luis Carrasco
    const luis = state.talentos.find((x) => x.nombre === 'Luis Carrasco');
    if (luis) return ok(talentoToSession(luis));
    return err('Usuario no encontrado');
  },

  register: async (data: { tipo: UserType; nombre: string; email: string; ciudad?: string }) => {
    if (data.tipo === 'atleta') {
      const exists = state.talentos.find((x) => x.email.toLowerCase() === data.email.toLowerCase());
      if (exists) return err('Ya existe una cuenta con ese correo');
      const t: MockTalento = {
        id: uuid(), nombre: data.nombre, disciplina: 'Sin definir', ciudad: data.ciudad ?? null,
        edad: null, bio: null, foto_url: null, email: data.email, telefono: null,
        redes_seguidores: 0, estado: 'pendiente', plan: 'free', puntuacion: 50,
        created_at: new Date().toISOString(), decidido_at: null,
      };
      state.talentos.push(t); persist();
      return ok(talentoToSession(t));
    }
    const exists = state.marcas.find((x) => x.contacto_email.toLowerCase() === data.email.toLowerCase());
    if (exists) return err('Ya existe una marca con ese correo');
    const m: MockMarca = {
      id: uuid(), nombre: data.nombre, industria: 'Sin definir', pais: 'México', sitio_web: null,
      contacto_nombre: data.nombre, contacto_email: data.email, presupuesto_mxn: null,
      estado: 'pendiente', plan: 'free', puntuacion: 50,
      created_at: new Date().toISOString(), decidido_at: null,
    };
    state.marcas.push(m); persist();
    return ok(marcaToSession(m));
  },

  me: async (id: string, tipo: UserType) => {
    if (tipo === 'atleta') {
      const t = state.talentos.find((x) => x.id === id);
      return t ? ok(talentoToSession(t)) : err('No encontrado');
    }
    const m = state.marcas.find((x) => x.id === id);
    return m ? ok(marcaToSession(m)) : err('No encontrado');
  },

  patchMe: async (id: string, tipo: UserType, patch: Record<string, unknown>) => {
    if (tipo === 'atleta') {
      const i = state.talentos.findIndex((x) => x.id === id);
      if (i < 0) return err('No encontrado');
      state.talentos[i] = { ...state.talentos[i], ...patch } as MockTalento;
      persist();
      return ok(talentoToSession(state.talentos[i]));
    }
    const i = state.marcas.findIndex((x) => x.id === id);
    if (i < 0) return err('No encontrado');
    state.marcas[i] = { ...state.marcas[i], ...patch } as MockMarca;
    persist();
    return ok(marcaToSession(state.marcas[i]));
  },

  matches: async (usuario_id?: string, tipo?: UserType, filters: MatchFilters = {}) => {
    let list = state.matches.slice();
    if (usuario_id && tipo === 'atleta') list = list.filter((m) => m.talento_id === usuario_id);
    else if (usuario_id && tipo === 'marca') list = list.filter((m) => m.marca_id === usuario_id);

    if (filters.pct_min !== undefined) list = list.filter((m) => m.porcentaje >= filters.pct_min!);
    if (filters.estado) list = list.filter((m) => m.estado === filters.estado);

    const rows = list.map(buildMatchRow);

    let filtered = rows;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      filtered = filtered.filter((r) =>
        (r.marca_nombre ?? '').toLowerCase().includes(q) ||
        (r.industria ?? '').toLowerCase().includes(q) ||
        (r.talento_nombre ?? '').toLowerCase().includes(q) ||
        (r.disciplina ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.industria) filtered = filtered.filter((r) => (r.industria ?? '').toLowerCase().includes(filters.industria!.toLowerCase()));
    if (filters.ciudad)    filtered = filtered.filter((r) => (r.ciudad ?? '').toLowerCase().includes(filters.ciudad!.toLowerCase()));
    if (filters.disciplina) filtered = filtered.filter((r) => (r.disciplina ?? '').toLowerCase().includes(filters.disciplina!.toLowerCase()));
    if (filters.presupuesto_min !== undefined) filtered = filtered.filter((r) => (r.presupuesto_mxn ?? 0) >= filters.presupuesto_min!);
    if (filters.presupuesto_max !== undefined) filtered = filtered.filter((r) => (r.presupuesto_mxn ?? 0) <= filters.presupuesto_max!);

    if (filters.sort === 'recencia') filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else filtered.sort((a, b) => b.porcentaje - a.porcentaje);

    return ok(filtered);
  },

  matchAccion: async (id: string, accion: 'solicitar' | 'aceptar' | 'rechazar') => {
    const i = state.matches.findIndex((m) => m.id === id);
    if (i < 0) return err('Match no encontrado');
    const estado: MockMatch['estado'] =
      accion === 'solicitar' ? 'solicitado' :
      accion === 'aceptar'   ? 'conectado'  : 'rechazado';
    state.matches[i].estado = estado;
    persist();
    return ok({ id, estado });
  },

  conversaciones: async (usuario_id: string, tipo: UserType): Promise<ApiResponse<ConversacionRow[]>> => {
    const list = state.matches.filter((m) =>
      tipo === 'atleta' ? m.talento_id === usuario_id : m.marca_id === usuario_id
    );
    const rows: ConversacionRow[] = list.map((m) => {
      const otro = tipo === 'atleta'
        ? state.marcas.find((x) => x.id === m.marca_id)
        : state.talentos.find((x) => x.id === m.talento_id);
      const msgs = state.mensajes.filter((x) => x.match_id === m.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
      const ultimo = msgs[msgs.length - 1];
      return {
        match_id: m.id,
        porcentaje: m.porcentaje,
        match_estado: m.estado,
        otro_id: otro?.id ?? '',
        otro_nombre: otro?.nombre ?? '—',
        otro_meta: tipo === 'atleta'
          ? ((otro as MockMarca | undefined)?.industria ?? '')
          : ((otro as MockTalento | undefined)?.disciplina ?? ''),
        foto_url: tipo === 'marca' ? (otro as MockTalento | undefined)?.foto_url ?? null : null,
        ultimo: ultimo?.texto ?? null,
        ultimo_at: ultimo?.created_at ?? null,
        total_msgs: msgs.length,
      };
    });
    rows.sort((a, b) => (b.ultimo_at ?? '').localeCompare(a.ultimo_at ?? ''));
    return ok(rows);
  },

  mensajes: async (matchId: string): Promise<ApiResponse<MensajeRow[]>> => {
    const list = state.mensajes
      .filter((m) => m.match_id === matchId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return ok(list);
  },

  enviarMensaje: async (matchId: string, texto: string, autor_tipo: UserType) => {
    const autorDb: MockMensaje['autor_tipo'] = autor_tipo === 'atleta' ? 'talento' : 'marca';
    const msg: MockMensaje = {
      id: uuid(), match_id: matchId, autor_tipo: autorDb, texto,
      tipo_ia: null, created_at: new Date().toISOString(),
    };
    state.mensajes.push(msg);

    const fuga = /whats\s*app|tel[eé]fono|email personal|por fuera|mis datos|hablamos aparte/i.test(texto);
    let ia: MockMensaje | null = null;
    if (fuga) {
      ia = {
        id: uuid(), match_id: matchId, autor_tipo: 'ia',
        texto: 'Detecté que sugieren continuar fuera de la plataforma. Si lo hacen pierden: el seguimiento del contrato, el calendario de compromisos, la protección legal y baja la puntuación de tu perfil. ¿Seguro que quieres continuar fuera?',
        tipo_ia: 'fuga', created_at: new Date().toISOString(),
      };
      state.mensajes.push(ia);
    }
    persist();
    return ok({ mensaje: msg, ia });
  },

  vitrina: async (filters: VitrinaFilters = {}): Promise<ApiResponse<PostVitrinaRow[]>> => {
    let list = state.posts.slice();
    if (filters.tipo && filters.tipo !== 'todos') list = list.filter((p) => p.tipo === filters.tipo);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((p) => {
        const autor = state.talentos.find((t) => t.id === p.autor_id);
        return p.texto.toLowerCase().includes(q) ||
               (autor?.nombre.toLowerCase().includes(q) ?? false) ||
               (p.hashtags?.toLowerCase().includes(q) ?? false);
      });
    }
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const rows: PostVitrinaRow[] = list.map((p) => {
      const autor = state.talentos.find((t) => t.id === p.autor_id);
      return {
        id: p.id, texto: p.texto, imagen_url: p.imagen_url, tipo: p.tipo,
        likes: p.likes, hashtags: p.hashtags, created_at: p.created_at,
        autor_id: p.autor_id,
        autor_nombre: autor?.nombre ?? '—',
        disciplina: autor?.disciplina ?? '',
        ciudad: autor?.ciudad ?? null,
        foto_url: autor?.foto_url ?? null,
      };
    });
    return ok(rows);
  },

  like: async (postId: string) => {
    const i = state.posts.findIndex((p) => p.id === postId);
    if (i < 0) return err('Post no encontrado');
    state.posts[i].likes += 1;
    persist();
    return ok({ id: postId, likes: state.posts[i].likes });
  },

  statsPublicos: async (): Promise<ApiResponse<StatsPublicos>> => ok({
    talentos_activos: state.talentos.filter((t) => t.estado === 'aprobado').length,
    marcas_activas:   state.marcas.filter((m) => m.estado === 'aprobado').length,
    conexiones:       state.matches.filter((m) => m.estado === 'conectado' || m.estado === 'solicitado').length,
    presupuesto_total: state.marcas.filter((m) => m.estado === 'aprobado').reduce((acc, m) => acc + (m.presupuesto_mxn ?? 0), 0),
  }),
};

// =============================================================
// ADMIN
// =============================================================

let staffSessionId: string | null = null; // se trackea por localStorage también

export const mockAdminApi = {
  listTalentos: async (estado: string = 'todos', filters: { q?: string; plan?: string; sort?: string } = {}) => {
    let list = state.talentos.slice();
    if (estado !== 'todos') list = list.filter((t) => t.estado === estado);
    if (filters.plan && filters.plan !== 'todos') list = list.filter((t) => t.plan === filters.plan);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((t) => t.nombre.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.disciplina.toLowerCase().includes(q));
    }
    if (filters.sort === 'puntuacion') list.sort((a, b) => b.puntuacion - a.puntuacion);
    else if (filters.sort === 'nombre') list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    else list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ok(list);
  },

  listMarcas: async (estado: string = 'todos', filters: { q?: string; plan?: string; sort?: string } = {}) => {
    let list = state.marcas.slice();
    if (estado !== 'todos') list = list.filter((t) => t.estado === estado);
    if (filters.plan && filters.plan !== 'todos') list = list.filter((t) => t.plan === filters.plan);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((t) => t.nombre.toLowerCase().includes(q) || t.contacto_email.toLowerCase().includes(q) || t.industria.toLowerCase().includes(q));
    }
    if (filters.sort === 'puntuacion') list.sort((a, b) => b.puntuacion - a.puntuacion);
    else if (filters.sort === 'nombre') list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    else list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ok(list);
  },

  decideTalento: async (id: string, decision: 'aprobado' | 'rechazado') => {
    const i = state.talentos.findIndex((t) => t.id === id);
    if (i < 0) return err('No encontrado');
    state.talentos[i].estado = decision;
    state.talentos[i].decidido_at = new Date().toISOString();
    persist();
    return ok(state.talentos[i]);
  },

  decideMarca: async (id: string, decision: 'aprobado' | 'rechazado') => {
    const i = state.marcas.findIndex((m) => m.id === id);
    if (i < 0) return err('No encontrado');
    state.marcas[i].estado = decision;
    state.marcas[i].decidido_at = new Date().toISOString();
    persist();
    return ok(state.marcas[i]);
  },

  stats: async (): Promise<ApiResponse<AdminStats>> => {
    const aprobadosT = state.talentos.filter((t) => t.estado === 'aprobado');
    const aprobadosM = state.marcas.filter((m) => m.estado === 'aprobado');
    const matchesConectados = state.matches.filter((m) => m.estado === 'conectado').length;
    const planSum = (plan: string) => state.talentos.filter((t) => t.plan === plan).length + state.marcas.filter((m) => m.plan === plan).length;
    const mrr = planSum('pro') * 499 + planSum('premium') * 2000;

    const groupBy = <T, K extends string>(arr: T[], keyFn: (x: T) => K | null) => {
      const m = new Map<K, number>();
      for (const x of arr) {
        const k = keyFn(x);
        if (!k) continue;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    };

    return ok({
      totales: {
        usuarios: state.talentos.length + state.marcas.length,
        talentos: state.talentos.length,
        marcas: state.marcas.length,
        matches: state.matches.length,
        mensajes: state.mensajes.length,
        posts: state.posts.length,
      },
      aprobados: {
        talentos: aprobadosT.length,
        marcas: aprobadosM.length,
        matchesConectados,
      },
      pendientes: {
        talentos: state.talentos.filter((t) => t.estado === 'pendiente').length,
        marcas: state.marcas.filter((m) => m.estado === 'pendiente').length,
      },
      crecimiento: {
        ult7d: { talentos: state.talentos.length, marcas: state.marcas.length, matches: state.matches.length },
        ult30d: { talentos: state.talentos.length, marcas: state.marcas.length },
      },
      finanzas: {
        mrr_estimado_mxn: mrr,
        comision_potencial_mxn: Math.round(aprobadosM.reduce((acc, m) => acc + (m.presupuesto_mxn ?? 0), 0) * 0.1),
      },
      ia: {
        intentos_fuga_detectados: state.mensajes.filter((m) => m.tipo_ia === 'fuga').length,
      },
      distribuciones: {
        deportes:   groupBy(aprobadosT, (t) => t.disciplina).map(([disciplina, n]) => ({ disciplina, n })),
        industrias: groupBy(aprobadosM, (m) => m.industria).map(([industria, n]) => ({ industria, n })),
        ciudades:   groupBy(aprobadosT, (t) => t.ciudad).map(([ciudad, n]) => ({ ciudad: ciudad as string, n })),
        planes_talentos: groupBy(state.talentos, (t) => t.plan).map(([plan, n]) => ({ plan, n })),
        planes_marcas:   groupBy(state.marcas, (m) => m.plan).map(([plan, n]) => ({ plan, n })),
      },
    });
  },
};

// =============================================================
// STAFF AUTH
// =============================================================
export const mockStaffAuth = {
  login: async (email: string, password: string) => {
    const s = state.staff.find((x) => x.email === email && x.activo);
    if (!s) return err('Credenciales incorrectas');
    if (s.password !== password) return err('Credenciales incorrectas');
    s.last_login_at = new Date().toISOString();
    persist();
    staffSessionId = s.id;
    const token = `demo-${s.id}-${Date.now()}`;
    return ok({ token, staff: { id: s.id, email: s.email, nombre: s.nombre, rol: s.rol } });
  },

  me: async () => {
    if (!staffSessionId) {
      // intenta recuperar de localStorage
      const raw = localStorage.getItem('ml_staff_session');
      if (raw) {
        try {
          const session = JSON.parse(raw) as { id: string };
          staffSessionId = session.id;
        } catch { /* noop */ }
      }
    }
    if (!staffSessionId) return err('No autorizado');
    const s = state.staff.find((x) => x.id === staffSessionId);
    if (!s) return err('Sesión inválida');
    return ok({ id: s.id, email: s.email, nombre: s.nombre, rol: s.rol });
  },
};

// =============================================================
// STAFF MANAGEMENT (solo owner)
// =============================================================
function requireOwner() {
  const cur = state.staff.find((x) => x.id === staffSessionId);
  return cur?.rol === 'owner';
}

export const mockStaffManage = {
  list: async () => {
    if (!requireOwner()) return err('No autorizado');
    return ok(state.staff.map(({ password: _, ...rest }) => rest));
  },

  create: async (data: { email: string; password: string; nombre: string; rol: 'owner' | 'admin' }) => {
    if (!requireOwner()) return err('No autorizado');
    if (state.staff.some((x) => x.email === data.email)) return err('Ese correo ya está en uso');
    if (data.password.length < 8) return err('Mínimo 8 caracteres');
    const s: MockStaff = {
      id: uuid(), email: data.email, password: data.password, nombre: data.nombre,
      rol: data.rol, activo: true, created_at: new Date().toISOString(), last_login_at: null,
    };
    state.staff.push(s); persist();
    const { password: _, ...rest } = s;
    return ok(rest);
  },

  update: async (id: string, patch: Partial<{ nombre: string; rol: 'owner' | 'admin'; activo: boolean; password: string }>) => {
    if (!requireOwner()) return err('No autorizado');
    const i = state.staff.findIndex((x) => x.id === id);
    if (i < 0) return err('No encontrado');
    state.staff[i] = { ...state.staff[i], ...patch } as MockStaff;
    persist();
    const { password: _, ...rest } = state.staff[i];
    return ok(rest);
  },

  remove: async (id: string) => {
    if (!requireOwner()) return err('No autorizado');
    if (id === staffSessionId) return err('No puedes eliminarte a ti mismo');
    const target = state.staff.find((x) => x.id === id);
    const owners = state.staff.filter((x) => x.rol === 'owner' && x.activo);
    if (target?.rol === 'owner' && owners.length <= 1) return err('No puedes eliminar al único owner');
    state.staff = state.staff.filter((x) => x.id !== id);
    persist();
    return ok({});
  },
};

// =============================================================
// INTEGRACIONES
// =============================================================
export const mockIntegracionesApi = {
  list: async () => {
    if (!requireOwner()) return err('No autorizado');
    // Enmascarar valores sensibles en memoria también
    return ok(state.integraciones.map((r) => {
      const sensibles = ['api_token', 'private_key', 'password'];
      const cfg: Record<string, unknown> = { ...r.config };
      for (const k of sensibles) {
        if (typeof cfg[k] === 'string' && cfg[k]) {
          const v = cfg[k] as string;
          cfg[k] = v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : '••••';
          cfg[`_${k}_set`] = true;
        } else {
          cfg[`_${k}_set`] = false;
        }
      }
      return { ...r, config: cfg };
    }));
  },

  save: async (slug: string, payload: { config?: Record<string, unknown>; activa?: boolean }) => {
    if (!requireOwner()) return err('No autorizado');
    const i = state.integraciones.findIndex((x) => x.slug === slug);
    if (i < 0) return err('No encontrada');
    const sensibles = ['api_token', 'private_key', 'password'];
    const prev = state.integraciones[i].config;
    const incoming = payload.config ?? {};
    const merged: Record<string, unknown> = { ...prev };
    for (const [k, v] of Object.entries(incoming)) {
      if (k.startsWith('_')) continue;
      if (sensibles.includes(k)) {
        if (typeof v === 'string' && v && !v.includes('…') && v !== '••••') merged[k] = v;
      } else {
        merged[k] = v;
      }
    }
    state.integraciones[i] = { ...state.integraciones[i], config: merged, activa: payload.activa ?? state.integraciones[i].activa, updated_at: new Date().toISOString() };
    persist();
    return ok(state.integraciones[i]);
  },

  test: async (slug: string) => {
    if (!requireOwner()) return err('No autorizado');
    // En modo demo no hacemos test real (no hay backend para llamar APIs externas)
    const i = state.integraciones.findIndex((x) => x.slug === slug);
    if (i < 0) return err('No encontrada');
    const cfg = state.integraciones[i].config;
    const hasCreds = Boolean(cfg.api_token || cfg.host || cfg.private_key);
    const ok_ = hasCreds;
    state.integraciones[i] = {
      ...state.integraciones[i],
      last_test_at: new Date().toISOString(),
      last_test_ok: ok_,
      last_test_error: ok_ ? null : 'Modo demo — el test real requiere backend conectado',
    };
    persist();
    return ok({
      ok: ok_,
      info: ok_ ? 'Modo demo: credenciales presentes. El test real corre cuando se conecte el backend.' : null,
      error: ok_ ? null : 'Modo demo — agrega credenciales y conecta el backend para probar de verdad.',
    });
  },
};
