import type {
  ApiResponse,
  Decision,
  FiltroEstado,
  Marca,
  Talento,
} from './types';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const JWT_KEY = 'ml_staff_jwt';

export interface StaffSession {
  id: string;
  email: string;
  nombre: string;
  rol: 'owner' | 'admin';
}

export function getToken(): string | null {
  return localStorage.getItem(JWT_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(JWT_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem('ml_staff_session');
}

export function setSession(s: StaffSession): void {
  localStorage.setItem('ml_staff_session', JSON.stringify(s));
}

export function getSession(): StaffSession | null {
  const raw = localStorage.getItem('ml_staff_session');
  if (!raw) return null;
  try { return JSON.parse(raw) as StaffSession; } catch { return null; }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const token = getToken() ?? '';
  const res = await fetch(`${BASE}/api/v1/admin${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    return { success: false, error: 'No autorizado' };
  }
  return res.json() as Promise<ApiResponse<T>>;
}

async function staffFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const token = getToken() ?? '';
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  try { return await res.json() as ApiResponse<T>; }
  catch { return { success: false, error: `Respuesta inválida (${res.status})` }; }
}

export const staffAuthApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/v1/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    try { return await res.json() as ApiResponse<{ token: string; staff: StaffSession }>; }
    catch { return { success: false as const, error: `Respuesta inválida (${res.status})` }; }
  },
  me: () => staffFetch<StaffSession>('/auth/staff/me'),
};

export interface StaffMember {
  id: string;
  email: string;
  nombre: string;
  rol: 'owner' | 'admin';
  activo: boolean;
  created_at: string;
  last_login_at: string | null;
}

export const staffManageApi = {
  list:   () => staffFetch<StaffMember[]>('/staff'),
  create: (data: { email: string; password: string; nombre: string; rol: 'owner' | 'admin' }) =>
    staffFetch<StaffMember>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, patch: Partial<{ nombre: string; rol: 'owner' | 'admin'; activo: boolean; password: string }>) =>
    staffFetch<StaffMember>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) =>
    staffFetch<unknown>(`/staff/${id}`, { method: 'DELETE' }),
};

// Integraciones
export type IntegracionSlug = 'railway' | 'secureshell' | 'whapi';

export interface IntegracionRow {
  slug: IntegracionSlug;
  nombre: string;
  config: Record<string, unknown>;
  activa: boolean;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_error: string | null;
  updated_at: string;
}

export interface TestResult { ok: boolean; info: string | null; error: string | null }

export const integracionesApi = {
  list: () => staffFetch<IntegracionRow[]>('/integraciones'),
  save: (slug: IntegracionSlug, payload: { config?: Record<string, unknown>; activa?: boolean }) =>
    staffFetch<IntegracionRow>(`/integraciones/${slug}`, { method: 'PUT', body: JSON.stringify(payload) }),
  test: (slug: IntegracionSlug) =>
    staffFetch<TestResult>(`/integraciones/${slug}/test`, { method: 'POST' }),
};

export interface AdminListFilters {
  q?: string;
  plan?: 'free' | 'pro' | 'premium' | 'todos';
  sort?: 'recencia' | 'puntuacion' | 'nombre';
}

function buildQs(estado: FiltroEstado, f: AdminListFilters): string {
  const p = new URLSearchParams({ estado });
  if (f.q) p.set('q', f.q);
  if (f.plan && f.plan !== 'todos') p.set('plan', f.plan);
  if (f.sort) p.set('sort', f.sort);
  return p.toString();
}

export const adminApi = {
  listTalentos: (estado: FiltroEstado = 'todos', filters: AdminListFilters = {}) =>
    adminFetch<Talento[]>(`/talentos?${buildQs(estado, filters)}`),

  listMarcas: (estado: FiltroEstado = 'todos', filters: AdminListFilters = {}) =>
    adminFetch<Marca[]>(`/marcas?${buildQs(estado, filters)}`),

  decideTalento: (id: string, decision: Decision) =>
    adminFetch<Talento>(`/talentos/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),

  decideMarca: (id: string, decision: Decision) =>
    adminFetch<Marca>(`/marcas/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),

  validateSession: async (): Promise<boolean> => {
    const res = await staffAuthApi.me();
    return res.success;
  },
};
