import { FastifyInstance } from 'fastify';
import { db } from '../lib/db/index.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness probe (solo verifica que el proceso responde)
  app.get('/', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Readiness probe (verifica dependencias externas)
  app.get('/ready', async (_req, reply) => {
    try {
      await db.ping();
      return { status: 'ready', db: 'connected' };
    } catch (err) {
      reply.code(503);
      return { status: 'not-ready', db: 'disconnected', error: (err as Error).message };
    }
  });
}
