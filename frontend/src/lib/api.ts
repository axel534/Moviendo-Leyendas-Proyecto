/**
 * API client abstraction.
 *
 * ⚠️ PORTABILITY RULE: Usar siempre `api.get/post/...` en vez de `fetch` directo.
 * Centraliza el manejo de errores, headers y base URL. Si mañana cambian la
 * estrategia de auth o el host del backend, solo se toca aquí.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text();
    }
    throw new ApiError(`Request failed: ${res.status}`, res.status, errorBody);
  }

  // Handle empty responses
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiError };
