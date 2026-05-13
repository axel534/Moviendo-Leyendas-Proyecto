import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';

import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { exampleRoutes } from './routes/example.js';
import { adminRoutes } from './routes/admin.js';
import { publicRoutes } from './routes/public.js';
import { staffAuthRoutes, staffManageRoutes } from './routes/staff.js';
import { integracionesRoutes } from './routes/integraciones.js';

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

  // CORS: en desarrollo permite todo, en producción restringe a los orígenes definidos
  const allowedOrigins = config.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (config.NODE_ENV === 'development') return cb(null, true);
      if (!origin) return cb(null, true); // health checks, curl, etc.
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Soporta wildcards tipo *.vercel.app
      if (allowedOrigins.some((p) => p.startsWith('*.') && origin.endsWith(p.slice(1)))) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  // Useful HTTP utilities (httpErrors, assert, etc.)
  await app.register(sensible);

  // Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(exampleRoutes, { prefix: '/api/v1' });
  await app.register(publicRoutes, { prefix: '/api/v1' });
  await app.register(staffAuthRoutes,   { prefix: '/api/v1/auth/staff' });
  await app.register(staffManageRoutes,   { prefix: '/api/v1/staff' });
  await app.register(integracionesRoutes, { prefix: '/api/v1/integraciones' });
  await app.register(adminRoutes,       { prefix: '/api/v1/admin' });

  return app;
}
