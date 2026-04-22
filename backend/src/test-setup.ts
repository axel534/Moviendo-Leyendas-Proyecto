/**
 * Setup global de tests.
 *
 * Se ejecuta ANTES de cargar cualquier archivo del proyecto, asi que
 * podemos inyectar variables de entorno antes de que `config.ts` las valide.
 *
 * Registrado en `vitest.config.ts` via `setupFiles`.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '8000'; // 0 = Fastify elige puerto libre
process.env.HOST = process.env.HOST ?? '127.0.0.1';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
