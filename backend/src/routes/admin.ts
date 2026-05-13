import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db/index.js';
import { config } from '../config.js';
import { getStaffFromReq, StaffJwtPayload, StaffRol } from './staff.js';

type Estado = 'pendiente' | 'aprobado' | 'rechazado';

interface Talento {
  id: string;
  nombre: string;
  disciplina: string;
  ciudad: string | null;
  edad: number | null;
  bio: string | null;
  foto_url: string | null;
  email: string;
  telefono: string | null;
  redes_seguidores: number;
  estado: Estado;
  plan: string;
  puntuacion: number;
  created_at: string;
  decidido_at: string | null;
}

interface Marca {
  id: string;
  nombre: string;
  industria: string;
  pais: string | null;
  sitio_web: string | null;
  contacto_nombre: string;
  contacto_email: string;
  presupuesto_mxn: number | null;
  estado: Estado;
  plan: string;
  puntuacion: number;
  created_at: string;
  decidido_at: string | null;
}

const decisionSchema = z.object({
  decision: z.enum(['aprobado', 'rechazado']),
});

const filtroSchema = z.object({
  estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'todos']).optional().default('todos'),
  q: z.string().optional(),
  plan: z.enum(['free', 'pro', 'premium', 'todos']).optional().default('todos'),
  ciudad: z.string().optional(),
  sort: z.enum(['recencia', 'puntuacion', 'nombre']).optional().default('recencia'),
});

/**
 * Permite acceso si:
 *  - El staff está autenticado por JWT y tiene rol en `allowed`, o
 *  - (fallback legacy) viene el header x-admin-token con valor ADMIN_TOKEN — se trata como admin
 *
 * El fallback se mantiene mientras el frontend completa la migración a login real.
 */
function checkStaff(req: FastifyRequest, reply: FastifyReply, allowed: StaffRol[] = ['owner', 'admin']): StaffJwtPayload | null {
  const staff = getStaffFromReq(req);
  if (staff && allowed.includes(staff.rol)) return staff;

  const legacyToken = req.headers['x-admin-token'];
  if (config.ADMIN_TOKEN && legacyToken === config.ADMIN_TOKEN && allowed.includes('admin')) {
    return { id: 'legacy', email: 'legacy@local', nombre: 'Legacy', rol: 'admin' };
  }

  reply.code(401).send({ success: false, error: 'No autorizado' });
  return null;
}

function buildWhere(
  estado: string,
  q: string | undefined,
  plan: string,
  ciudad: string | undefined,
  searchCols: string[],
  ciudadCol: string | null,
) {
  const where: string[] = [];
  const vals: unknown[] = [];
  let n = 1;
  if (estado !== 'todos') { where.push(`estado = $${n++}`); vals.push(estado); }
  if (plan !== 'todos')   { where.push(`plan = $${n++}`); vals.push(plan); }
  if (q) {
    const ors = searchCols.map(() => `$${n}`).map((p, i) => `${searchCols[i]} ilike ${p}`);
    where.push(`(${ors.join(' or ')})`);
    vals.push(`%${q}%`);
    n++;
  }
  if (ciudad && ciudadCol) { where.push(`${ciudadCol} ilike $${n++}`); vals.push(`%${ciudad}%`); }
  return { whereSql: where.length ? 'where ' + where.join(' and ') : '', vals };
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (req, reply) => {
    // Stats solo lo ve owner
    const isStats = req.url.endsWith('/stats') || req.url.includes('/stats?');
    const allowed: StaffRol[] = isStats ? ['owner'] : ['owner', 'admin'];
    if (!checkStaff(req, reply, allowed)) return reply;
  });

  // ============ TALENTOS ============
  app.get('/talentos', async (req) => {
    const p = filtroSchema.parse(req.query);
    const { whereSql, vals } = buildWhere(p.estado, p.q, p.plan, p.ciudad, ['nombre', 'email', 'disciplina'], 'ciudad');
    const order =
      p.sort === 'puntuacion' ? 'puntuacion desc' :
      p.sort === 'nombre'     ? 'nombre asc'      : 'created_at desc';
    const result = await db.query<Talento>(`select * from talentos ${whereSql} order by ${order}`, vals);
    return { success: true, data: result.rows };
  });

  // ============ MARCAS ============
  app.get('/marcas', async (req) => {
    const p = filtroSchema.parse(req.query);
    const { whereSql, vals } = buildWhere(p.estado, p.q, p.plan, p.ciudad, ['nombre', 'contacto_email', 'industria'], null);
    const order =
      p.sort === 'puntuacion' ? 'puntuacion desc' :
      p.sort === 'nombre'     ? 'nombre asc'      : 'created_at desc';
    const result = await db.query<Marca>(`select * from marcas ${whereSql} order by ${order}`, vals);
    return { success: true, data: result.rows };
  });

  // ============ DECISIONES ============
  app.post('/talentos/:id/decision', async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Decisión inválida' });
    const result = await db.query<Talento>(
      'update talentos set estado = $1, decidido_at = now() where id = $2 returning *',
      [parsed.data.decision, id]
    );
    if (result.rowCount === 0) return reply.code(404).send({ success: false, error: 'Talento no encontrado' });
    return { success: true, data: result.rows[0] };
  });

  app.post('/marcas/:id/decision', async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Decisión inválida' });
    const result = await db.query<Marca>(
      'update marcas set estado = $1, decidido_at = now() where id = $2 returning *',
      [parsed.data.decision, id]
    );
    if (result.rowCount === 0) return reply.code(404).send({ success: false, error: 'Marca no encontrada' });
    return { success: true, data: result.rows[0] };
  });

  // ============ STATS / KPIs ============
  app.get('/stats', async () => {
    type RowCount = { n: number };

    const [
      totalTalentos, totalMarcas, totalMatches, totalMsgs, totalPosts,
      talentosAprobados, marcasAprobadas, matchesConectados,
      talentosPendientes, marcasPendientes,
      talentos7d, marcas7d, matches7d,
      talentos30d, marcas30d,
      topDeportes, topIndustrias, topCiudades, distPlanesT, distPlanesM,
      mrrEstimado, comisionPotencial, intentosFuga,
    ] = await Promise.all([
      db.query<RowCount>(`select count(*)::int as n from talentos`),
      db.query<RowCount>(`select count(*)::int as n from marcas`),
      db.query<RowCount>(`select count(*)::int as n from matches`),
      db.query<RowCount>(`select count(*)::int as n from mensajes`),
      db.query<RowCount>(`select count(*)::int as n from posts_vitrina`),
      db.query<RowCount>(`select count(*)::int as n from talentos where estado='aprobado'`),
      db.query<RowCount>(`select count(*)::int as n from marcas where estado='aprobado'`),
      db.query<RowCount>(`select count(*)::int as n from matches where estado='conectado'`),
      db.query<RowCount>(`select count(*)::int as n from talentos where estado='pendiente'`),
      db.query<RowCount>(`select count(*)::int as n from marcas where estado='pendiente'`),
      db.query<RowCount>(`select count(*)::int as n from talentos where created_at >= now() - interval '7 days'`),
      db.query<RowCount>(`select count(*)::int as n from marcas where created_at >= now() - interval '7 days'`),
      db.query<RowCount>(`select count(*)::int as n from matches where created_at >= now() - interval '7 days'`),
      db.query<RowCount>(`select count(*)::int as n from talentos where created_at >= now() - interval '30 days'`),
      db.query<RowCount>(`select count(*)::int as n from marcas where created_at >= now() - interval '30 days'`),
      db.query<{ disciplina: string; n: number }>(
        `select disciplina, count(*)::int as n from talentos where estado='aprobado' group by disciplina order by n desc limit 5`
      ),
      db.query<{ industria: string; n: number }>(
        `select industria, count(*)::int as n from marcas where estado='aprobado' group by industria order by n desc limit 5`
      ),
      db.query<{ ciudad: string; n: number }>(
        `select ciudad, count(*)::int as n from talentos where estado='aprobado' and ciudad is not null group by ciudad order by n desc limit 5`
      ),
      db.query<{ plan: string; n: number }>(
        `select plan, count(*)::int as n from talentos group by plan`
      ),
      db.query<{ plan: string; n: number }>(
        `select plan, count(*)::int as n from marcas group by plan`
      ),
      db.query<{ mrr: number }>(
        `select coalesce(sum(case plan when 'pro' then 499 when 'premium' then 2000 else 0 end), 0)::int as mrr
         from (select plan from talentos union all select plan from marcas) u`
      ),
      db.query<{ comision: number }>(
        `select coalesce(sum(presupuesto_mxn) * 0.10, 0)::int as comision from marcas where estado='aprobado'`
      ),
      db.query<RowCount>(`select count(*)::int as n from mensajes where tipo_ia = 'fuga'`),
    ]);

    return {
      success: true,
      data: {
        totales: {
          usuarios: totalTalentos.rows[0].n + totalMarcas.rows[0].n,
          talentos: totalTalentos.rows[0].n,
          marcas:   totalMarcas.rows[0].n,
          matches:  totalMatches.rows[0].n,
          mensajes: totalMsgs.rows[0].n,
          posts:    totalPosts.rows[0].n,
        },
        aprobados: {
          talentos: talentosAprobados.rows[0].n,
          marcas:   marcasAprobadas.rows[0].n,
          matchesConectados: matchesConectados.rows[0].n,
        },
        pendientes: {
          talentos: talentosPendientes.rows[0].n,
          marcas:   marcasPendientes.rows[0].n,
        },
        crecimiento: {
          ult7d: {
            talentos: talentos7d.rows[0].n,
            marcas:   marcas7d.rows[0].n,
            matches:  matches7d.rows[0].n,
          },
          ult30d: {
            talentos: talentos30d.rows[0].n,
            marcas:   marcas30d.rows[0].n,
          },
        },
        finanzas: {
          mrr_estimado_mxn: mrrEstimado.rows[0].mrr,
          comision_potencial_mxn: comisionPotencial.rows[0].comision,
        },
        ia: {
          intentos_fuga_detectados: intentosFuga.rows[0].n,
        },
        distribuciones: {
          deportes:   topDeportes.rows,
          industrias: topIndustrias.rows,
          ciudades:   topCiudades.rows,
          planes_talentos: distPlanesT.rows,
          planes_marcas:   distPlanesM.rows,
        },
      },
    };
  });
}
