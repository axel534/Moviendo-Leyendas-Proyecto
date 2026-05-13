import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import net from 'node:net';
import { db } from '../lib/db/index.js';
import { requireStaffMiddleware } from './staff.js';

type Slug = 'railway' | 'secureshell' | 'whapi';

interface IntegracionRow {
  slug: Slug;
  nombre: string;
  config: Record<string, unknown>;
  activa: boolean;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_error: string | null;
  updated_at: string;
}

/**
 * Devuelve la fila enmascarando valores sensibles antes de mandar al frontend.
 * Solo la marca como `***` si tiene contenido.
 */
function maskConfig(row: IntegracionRow): IntegracionRow {
  const sensibles = ['api_token', 'private_key', 'password'];
  const out: Record<string, unknown> = { ...row.config };
  for (const k of sensibles) {
    if (typeof out[k] === 'string' && out[k]) {
      const v = out[k] as string;
      out[k] = v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : '••••';
      out[`_${k}_set`] = true;
    } else {
      out[`_${k}_set`] = false;
    }
  }
  return { ...row, config: out };
}

/**
 * Toma el patch del cliente y lo mergea con la config existente.
 * Si un campo sensible viene como `***` o vacío (sin que el usuario haya tipeado nada nuevo),
 * conserva el valor anterior.
 */
function mergeConfig(prev: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const sensibles = ['api_token', 'private_key', 'password'];
  const merged: Record<string, unknown> = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    if (k.startsWith('_')) continue; // ignorar flags meta del frontend
    if (sensibles.includes(k)) {
      if (typeof v === 'string' && v && !v.includes('…') && v !== '••••') {
        merged[k] = v;
      }
      // si viene vacío o enmascarado, conservar el anterior
    } else {
      merged[k] = v;
    }
  }
  return merged;
}

async function testRailway(config: Record<string, unknown>): Promise<{ ok: boolean; error?: string; info?: string }> {
  const token = String(config.api_token ?? '');
  if (!token) return { ok: false, error: 'Falta api_token' };
  try {
    const res = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ me { name email } }' }),
    });
    const txt = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${txt.slice(0, 120)}` };
    const data = JSON.parse(txt) as { data?: { me?: { name?: string; email?: string } }; errors?: Array<{ message: string }> };
    if (data.errors?.[0]) return { ok: false, error: data.errors[0].message };
    const me = data.data?.me;
    if (!me) return { ok: false, error: 'Token aceptado pero sin datos de usuario' };
    return { ok: true, info: `Conectado como ${me.name ?? me.email ?? 'usuario Railway'}` };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function testSecureShell(config: Record<string, unknown>): Promise<{ ok: boolean; error?: string; info?: string }> {
  const host = String(config.host ?? '');
  const port = Number(config.port ?? 22);
  if (!host) return { ok: false, error: 'Falta host' };
  if (!port || port <= 0) return { ok: false, error: 'Puerto inválido' };
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const TIMEOUT_MS = 5000;
    let resolved = false;
    const finish = (result: { ok: boolean; error?: string; info?: string }) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(TIMEOUT_MS);
    socket.once('connect', () => {
      // Leer el banner de SSH (primeros bytes que manda el server)
      socket.once('data', (buf: Buffer) => {
        const banner = buf.toString('utf-8').trim().slice(0, 80);
        finish({ ok: banner.startsWith('SSH'), info: banner || 'Conectado, sin banner', error: banner.startsWith('SSH') ? undefined : `Banner inesperado: ${banner}` });
      });
      // Si en 1.5s no llega banner, igual reportamos conexión OK
      setTimeout(() => finish({ ok: true, info: `Puerto ${port} responde en ${host}` }), 1500);
    });
    socket.once('timeout', () => finish({ ok: false, error: `Timeout (${TIMEOUT_MS}ms)` }));
    socket.once('error', (err) => finish({ ok: false, error: err.message }));
    socket.connect(port, host);
  });
}

async function testWhapi(config: Record<string, unknown>): Promise<{ ok: boolean; error?: string; info?: string }> {
  const token = String(config.api_token ?? '');
  const baseUrl = String(config.base_url ?? 'https://gate.whapi.cloud').replace(/\/$/, '');
  if (!token) return { ok: false, error: 'Falta api_token' };
  try {
    const res = await fetch(`${baseUrl}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const txt = await res.text();
    if (res.status === 401 || res.status === 403) return { ok: false, error: 'Token inválido o sin permisos' };
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${txt.slice(0, 120)}` };
    return { ok: true, info: `Whapi conectado (HTTP ${res.status})` };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function runTest(slug: Slug, config: Record<string, unknown>) {
  if (slug === 'railway')     return testRailway(config);
  if (slug === 'secureshell') return testSecureShell(config);
  if (slug === 'whapi')       return testWhapi(config);
  return { ok: false, error: 'Integración no soportada' };
}

export async function integracionesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireStaffMiddleware(['owner']));

  app.get('/', async () => {
    const r = await db.query<IntegracionRow>('select * from integraciones order by slug');
    return { success: true, data: r.rows.map(maskConfig) };
  });

  app.put('/:slug', async (req, reply) => {
    const params = z.object({ slug: z.enum(['railway', 'secureshell', 'whapi']) }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ success: false, error: 'Slug inválido' });

    const body = z.object({
      config: z.record(z.unknown()).default({}),
      activa: z.boolean().optional(),
    }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ success: false, error: 'Datos inválidos' });

    const prev = await db.query<IntegracionRow>('select * from integraciones where slug = $1', [params.data.slug]);
    if (!prev.rows[0]) return reply.code(404).send({ success: false, error: 'Integración no encontrada' });

    const newConfig = mergeConfig(prev.rows[0].config, body.data.config);
    const newActiva = body.data.activa ?? prev.rows[0].activa;

    const r = await db.query<IntegracionRow>(
      `update integraciones
       set config = $1, activa = $2, updated_at = now()
       where slug = $3
       returning *`,
      [JSON.stringify(newConfig), newActiva, params.data.slug]
    );
    return { success: true, data: maskConfig(r.rows[0]) };
  });

  app.post('/:slug/test', async (req, reply) => {
    const params = z.object({ slug: z.enum(['railway', 'secureshell', 'whapi']) }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ success: false, error: 'Slug inválido' });

    const r = await db.query<IntegracionRow>('select * from integraciones where slug = $1', [params.data.slug]);
    if (!r.rows[0]) return reply.code(404).send({ success: false, error: 'Integración no encontrada' });

    const result = await runTest(params.data.slug, r.rows[0].config);

    await db.query(
      'update integraciones set last_test_at = now(), last_test_ok = $1, last_test_error = $2 where slug = $3',
      [result.ok, result.ok ? null : (result.error ?? null), params.data.slug]
    );

    return { success: true, data: { ok: result.ok, info: result.info ?? null, error: result.error ?? null } };
  });
}
