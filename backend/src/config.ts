import { z } from 'zod';

/**
 * Centralized, typed configuration.
 * All environment variables pass through Zod validation here.
 * If any required var is missing at startup, the server fails fast.
 */
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(8000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Supabase (opcional en local, requerido en staging/prod)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Admin panel (legacy fallback, ya no se usa para nuevas auths)
  ADMIN_TOKEN: z.string().min(4).default('axel123'),

  // JWT staff backoffice
  JWT_SECRET: z.string().min(16).default('ml-dev-secret-cambiame-en-produccion-2026'),
  JWT_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof configSchema>;
