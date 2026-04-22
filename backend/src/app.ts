import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';

import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { exampleRoutes } from './routes/example.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport: config.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  });

  // Security headers
  await app.register(helmet);

  // CORS: en desarrollo permite todo, en produccion restringe
  await app.register(cors, {
    origin: config.NODE_ENV === 'development' ? true : config.CORS_ORIGIN.split(','),
    credentials: true,
  });

  // Useful HTTP utilities (httpErrors, assert, etc.)
  await app.register(sensible);

  // Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(exampleRoutes, { prefix: '/api/v1' });

  return app;
}
