/**
 * Cliente único de la API pública de Moviendo Leyendas.
 * Todos los componentes deben pasar por aquí — nada de fetch directo.
 */

import type { UserType } from '../auth/AuthContext';

// En dev: ruta relativa /api/v1 (proxy de Vite hacia backend container).
// En prod: VITE_API_BASE_URL apunta al backend (ej: https://moviendo-api.up.railway.app).
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const BASE = `${API_BASE}/api/v1`;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

async function call<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: `Respuesta inválida (${res.status})` };
  }
}

export interface SessionUserApi {
  id: string;
  tipo: UserType;
  nombre: string;
  email: string;
  ciudad?: string | null;
  foto_url?: string | null;
  plan: 'free' | 'pro' | 'premium';
  puntuacion: number;
  estado: string;
  onboarded: boolean;
  bio?: string | null;
  disciplina?: string | null;
  industria?: string | null;
}

export interface MatchRow {
  id: string;
  porcentaje: number;
  estado: 'nuevo' | 'solicitado' | 'conectado' | 'rechazado';
  razones: { razones?: string[] } | null;
  created_at: string;
  // Para atleta — datos de la marca
  marca_id?: string;
  marca_nombre?: string;
  industria?: string;
  pais?: string;
  presupuesto_mxn?: number;
  marca_puntuacion?: number;
  // Para marca — datos del talento
  talento_id?: string;
  talento_nombre?: string;
  disciplina?: string;
  ciudad?: string;
  foto_url?: string;
  redes_seguidores?: number;
  talento_puntuacion?: number;
}

export interface ConversacionRow {
  match_id: string;
  porcentaje: number;
  match_estado: 'nuevo' | 'solicitado' | 'conectado' | 'rechazado';
  otro_id: string;
  otro_nombre: string;
  otro_meta: string;
  foto_url?: string | null;
  ultimo: string | null;
  ultimo_at: string | null;
  total_msgs: string | number;
}

export interface MensajeRow {
  id: string;
  autor_tipo: 'talento' | 'marca' | 'ia';
  texto: string;
  tipo_ia: string | null;
  created_at: string;
}

export interface MatchFilters {
  q?: string;
  industria?: string;
  ciudad?: string;
  disciplina?: string;
  presupuesto_min?: number;
  presupuesto_max?: number;
  pct_min?: number;
  estado?: 'nuevo' | 'solicitado' | 'conectado' | 'rechazado';
  sort?: 'compatibilidad' | 'recencia';
}

export interface VitrinaFilters {
  tipo?: 'todos' | 'logro' | 'acuerdo' | 'competencia' | 'general';
  q?: string;
  disciplina?: string;
}

export interface StatsPublicos {
  talentos_activos: string | number;
  marcas_activas: string | number;
  conexiones: string | number;
  presupuesto_total: string | number;
}

export interface AdminStats {
  totales: { usuarios: number; talentos: number; marcas: number; matches: number; mensajes: number; posts: number };
  aprobados: { talentos: number; marcas: number; matchesConectados: number };
  pendientes: { talentos: number; marcas: number };
  crecimiento: {
    ult7d: { talentos: number; marcas: number; matches: number };
    ult30d: { talentos: number; marcas: number };
  };
  finanzas: { mrr_estimado_mxn: number; comision_potencial_mxn: number };
  ia: { intentos_fuga_detectados: number };
  distribuciones: {
    deportes: Array<{ disciplina: string; n: number }>;
    industrias: Array<{ industria: string; n: number }>;
    ciudades: Array<{ ciudad: string; n: number }>;
    planes_talentos: Array<{ plan: string; n: number }>;
    planes_marcas: Array<{ plan: string; n: number }>;
  };
}

export interface PostVitrinaRow {
  id: string;
  texto: string;
  imagen_url: string;
  tipo: 'logro' | 'acuerdo' | 'competencia' | 'general';
  likes: number;
  hashtags: string | null;
  created_at: string;
  autor_id: string;
  autor_nombre: string;
  disciplina: string;
  ciudad: string | null;
  foto_url: string | null;
}

export const mlApi = {
  // Auth
  login: (email: string) =>
    call<SessionUserApi>('/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),

  register: (data: { tipo: UserType; nombre: string; email: string; ciudad?: string }) =>
    call<SessionUserApi>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  me: (id: string, tipo: UserType) =>
    call<SessionUserApi>(`/me?id=${id}&tipo=${tipo}`),

  patchMe: (id: string, tipo: UserType, patch: Record<string, unknown>) =>
    call<SessionUserApi>('/me', {
      method: 'PATCH',
      body: JSON.stringify({ id, tipo, ...patch }),
    }),

  // Matches
  matches: (usuario_id?: string, tipo?: UserType, filters: MatchFilters = {}) => {
    const params = new URLSearchParams();
    if (usuario_id) params.set('usuario_id', usuario_id);
    if (tipo) params.set('tipo', tipo);
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return call<MatchRow[]>(`/matches${qs ? '?' + qs : ''}`);
  },

  matchAccion: (id: string, accion: 'solicitar' | 'aceptar' | 'rechazar') =>
    call<{ id: string; estado: string }>(`/matches/${id}/accion`, {
      method: 'POST',
      body: JSON.stringify({ accion }),
    }),

  // Chat
  conversaciones: (usuario_id: string, tipo: UserType) =>
    call<ConversacionRow[]>(`/conversaciones?usuario_id=${usuario_id}&tipo=${tipo}`),

  mensajes: (matchId: string) =>
    call<MensajeRow[]>(`/conversaciones/${matchId}/mensajes`),

  enviarMensaje: (matchId: string, texto: string, autor_tipo: UserType) =>
    call<{ mensaje: MensajeRow; ia: MensajeRow | null }>(
      `/conversaciones/${matchId}/mensajes`,
      { method: 'POST', body: JSON.stringify({ texto, autor_tipo }) }
    ),

  // Vitrina
  vitrina: (filters: VitrinaFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return call<PostVitrinaRow[]>(`/vitrina${qs ? '?' + qs : ''}`);
  },

  like: (postId: string) =>
    call<{ id: string; likes: number }>(`/vitrina/${postId}/like`, { method: 'POST' }),

  // Stats
  statsPublicos: () => call<StatsPublicos>('/stats/publico'),
};

// Admin (usa JWT staff)
async function adminCall<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('ml_staff_jwt') ?? '';
  const res = await fetch(`${BASE}/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  try { return (await res.json()) as ApiResponse<T>; }
  catch { return { success: false, error: `Respuesta inválida (${res.status})` }; }
}

export const adminMlApi = {
  stats: () => adminCall<AdminStats>('/stats'),
};
