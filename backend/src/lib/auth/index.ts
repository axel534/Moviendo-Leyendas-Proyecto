/**
 * Auth abstraction layer.
 *
 * ⚠️ PORTABILITY RULE: No llamar directamente al SDK de Supabase desde rutas.
 * Siempre pasar por esta capa. Si cambian de proveedor (Auth0, Firebase,
 * JWT propio), solo se reemplaza lo de adentro.
 */

export interface AuthUser {
  id: string;
  email: string;
  metadata?: Record<string, unknown>;
}

export interface AuthProvider {
  verifyToken(token: string): Promise<AuthUser | null>;
  getUserById(id: string): Promise<AuthUser | null>;
}

/**
 * Placeholder implementation.
 * TODO: reemplazar por Supabase Auth o proveedor elegido.
 */
class NoopAuthProvider implements AuthProvider {
  async verifyToken(_token: string): Promise<AuthUser | null> {
    return null;
  }

  async getUserById(_id: string): Promise<AuthUser | null> {
    return null;
  }
}

export const auth: AuthProvider = new NoopAuthProvider();
