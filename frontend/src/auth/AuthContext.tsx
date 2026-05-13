import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mlApi, SessionUserApi } from '../lib/mlApi';

export type UserType = 'atleta' | 'marca';
export type UserPlan = 'free' | 'pro' | 'premium';

export interface SessionUser extends SessionUserApi {}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (data: { tipo: UserType; nombre: string; email: string; ciudad?: string }) =>
    Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  updateUser: (patch: Partial<SessionUser>) => void;
  completeOnboarding: () => void;
  refresh: () => Promise<void>;
}

const KEY = 'ml_demo_user';

const AuthCtx = createContext<AuthState | null>(null);

function readLocal(): SessionUser | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as SessionUser; } catch { return null; }
}

function writeLocal(u: SessionUser | null) {
  if (!u) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(u));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readLocal);
  const [loading, setLoading] = useState(false);

  useEffect(() => { writeLocal(user); }, [user]);

  const login = async (email: string) => {
    setLoading(true);
    const res = await mlApi.login(email);
    setLoading(false);
    if (!res.success || !res.data) return { ok: false as const, error: res.error ?? 'No se pudo iniciar sesión' };
    setUser(res.data);
    return { ok: true as const };
  };

  const register = async (data: { tipo: UserType; nombre: string; email: string; ciudad?: string }) => {
    setLoading(true);
    const res = await mlApi.register(data);
    setLoading(false);
    if (!res.success || !res.data) return { ok: false as const, error: res.error ?? 'No se pudo registrar' };
    setUser(res.data);
    return { ok: true as const };
  };

  const updateUser = (patch: Partial<SessionUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const completeOnboarding = () => updateUser({ onboarded: true });

  const logout = () => setUser(null);

  const refresh = async () => {
    if (!user) return;
    const res = await mlApi.me(user.id, user.tipo);
    if (res.success && res.data) setUser({ ...user, ...res.data });
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, updateUser, completeOnboarding, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
