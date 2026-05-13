import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../../config.js';

/**
 * Database abstraction layer.
 *
 * ⚠️ PORTABILITY RULE: Toda la app usa SOLO esta capa para acceder a datos.
 * Hoy corremos Postgres (local Docker o Supabase Postgres en la nube).
 * Si mañana migramos a Cloud SQL u otro Postgres, solo cambia esta capa.
 *
 * NUNCA importes 'pg' directamente en las rutas o servicios. Pasa por aquí.
 */

// Habilita SSL si la URL es de Supabase / hosted (NODE_ENV=production o sslmode en URL)
const useSsl =
  config.NODE_ENV === 'production' ||
  /sslmode=require/.test(config.DATABASE_URL) ||
  /supabase\.co/.test(config.DATABASE_URL);

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = {
  /**
   * Run a parameterized query.
   * @example db.query<User>('SELECT * FROM users WHERE id = $1', [userId])
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    return pool.query<T>(text, params as never[]);
  },

  /**
   * Run multiple queries inside a single transaction.
   * Automatically rolls back on error.
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Quick health check used by readiness probe. */
  async ping(): Promise<void> {
    await pool.query('SELECT 1');
  },

  /** Close all connections. Called only on shutdown. */
  async close(): Promise<void> {
    await pool.end();
  },
};
