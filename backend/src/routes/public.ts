import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db/index.js';

type Tipo = 'atleta' | 'marca';

interface TalentoRow {
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
  estado: string;
  plan: string;
  puntuacion: number;
  created_at: string;
}

interface MarcaRow {
  id: string;
  nombre: string;
  industria: string;
  pais: string | null;
  sitio_web: string | null;
  contacto_nombre: string;
  contacto_email: string;
  presupuesto_mxn: number | null;
  estado: string;
  plan: string;
  puntuacion: number;
  created_at: string;
}

interface SessionUser {
  id: string;
  tipo: Tipo;
  nombre: string;
  email: string;
  ciudad?: string | null;
  foto_url?: string | null;
  plan: string;
  puntuacion: number;
  estado: string;
  onboarded: boolean;
  bio?: string | null;
  disciplina?: string | null;
  industria?: string | null;
  presupuesto_mxn?: number | null;
  edad?: number | null;
  redes_seguidores?: number;
  telefono?: string | null;
  sitio_web?: string | null;
}

function talentoToSession(t: TalentoRow): SessionUser {
  return {
    id: t.id,
    tipo: 'atleta',
    nombre: t.nombre,
    email: t.email,
    ciudad: t.ciudad,
    foto_url: t.foto_url,
    plan: t.plan ?? 'free',
    puntuacion: t.puntuacion ?? 50,
    estado: t.estado,
    onboarded: t.estado !== 'pendiente' || !!t.bio,
    bio: t.bio,
    disciplina: t.disciplina,
    edad: t.edad,
    redes_seguidores: t.redes_seguidores,
    telefono: t.telefono,
  };
}

function marcaToSession(m: MarcaRow): SessionUser {
  return {
    id: m.id,
    tipo: 'marca',
    nombre: m.nombre,
    email: m.contacto_email,
    foto_url: null,
    plan: m.plan ?? 'free',
    puntuacion: m.puntuacion ?? 50,
    estado: m.estado,
    onboarded: m.estado !== 'pendiente',
    industria: m.industria,
    presupuesto_mxn: m.presupuesto_mxn,
    sitio_web: m.sitio_web,
  };
}

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  // ============================================================
  // AUTH
  // ============================================================
  app.post('/auth/login', async (req, reply) => {
    const parsed = z.object({
      email: z.string().email(),
      password: z.string().min(1).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Email inválido' });

    const t = await db.query<TalentoRow>('select * from talentos where email = $1 limit 1', [parsed.data.email]);
    if (t.rows[0]) return { success: true, data: talentoToSession(t.rows[0]) };

    const m = await db.query<MarcaRow>('select * from marcas where contacto_email = $1 limit 1', [parsed.data.email]);
    if (m.rows[0]) return { success: true, data: marcaToSession(m.rows[0]) };

    const demo = await db.query<TalentoRow>('select * from talentos where nombre = $1 limit 1', ['Luis Carrasco']);
    if (demo.rows[0]) return { success: true, data: talentoToSession(demo.rows[0]) };

    return reply.code(404).send({ success: false, error: 'Usuario no encontrado' });
  });

  app.post('/auth/register', async (req, reply) => {
    const parsed = z.object({
      tipo: z.enum(['atleta', 'marca']),
      nombre: z.string().min(1),
      email: z.string().email(),
      ciudad: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });

    const { tipo, nombre, email, ciudad } = parsed.data;

    if (tipo === 'atleta') {
      const exists = await db.query<TalentoRow>('select id from talentos where email = $1', [email]);
      if (exists.rows[0]) return reply.code(409).send({ success: false, error: 'Ya existe una cuenta con ese correo' });
      const r = await db.query<TalentoRow>(
        `insert into talentos (nombre, disciplina, ciudad, email, plan, puntuacion, estado)
         values ($1, 'Sin definir', $2, $3, 'free', 50, 'pendiente')
         returning *`,
        [nombre, ciudad ?? null, email]
      );
      return { success: true, data: talentoToSession(r.rows[0]) };
    }

    const exists = await db.query<MarcaRow>('select id from marcas where contacto_email = $1', [email]);
    if (exists.rows[0]) return reply.code(409).send({ success: false, error: 'Ya existe una marca con ese correo' });
    const r = await db.query<MarcaRow>(
      `insert into marcas (nombre, industria, contacto_nombre, contacto_email, plan, puntuacion, estado)
       values ($1, 'Sin definir', $2, $3, 'free', 50, 'pendiente')
       returning *`,
      [nombre, nombre, email]
    );
    return { success: true, data: marcaToSession(r.rows[0]) };
  });

  // ============================================================
  // ME
  // ============================================================
  app.get('/me', async (req, reply) => {
    const parsed = z.object({
      id: z.string().uuid(),
      tipo: z.enum(['atleta', 'marca']),
    }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Parámetros inválidos' });

    if (parsed.data.tipo === 'atleta') {
      const r = await db.query<TalentoRow>('select * from talentos where id = $1', [parsed.data.id]);
      if (!r.rows[0]) return reply.code(404).send({ success: false, error: 'No encontrado' });
      return { success: true, data: talentoToSession(r.rows[0]) };
    }
    const r = await db.query<MarcaRow>('select * from marcas where id = $1', [parsed.data.id]);
    if (!r.rows[0]) return reply.code(404).send({ success: false, error: 'No encontrado' });
    return { success: true, data: marcaToSession(r.rows[0]) };
  });

  app.patch('/me', async (req, reply) => {
    const parsed = z.object({
      id: z.string().uuid(),
      tipo: z.enum(['atleta', 'marca']),
      nombre: z.string().optional(),
      bio: z.string().nullable().optional(),
      ciudad: z.string().nullable().optional(),
      foto_url: z.string().url().nullable().optional(),
      disciplina: z.string().optional(),
      edad: z.number().int().min(10).max(100).optional(),
      telefono: z.string().nullable().optional(),
      redes_seguidores: z.number().int().min(0).optional(),
      industria: z.string().optional(),
      presupuesto_mxn: z.number().int().min(0).optional(),
      sitio_web: z.string().url().nullable().optional(),
      contacto_nombre: z.string().optional(),
      plan: z.enum(['free', 'pro', 'premium']).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });

    const { id, tipo, ...patch } = parsed.data;

    if (tipo === 'atleta') {
      const fields = ['nombre', 'bio', 'ciudad', 'foto_url', 'disciplina', 'edad', 'telefono', 'redes_seguidores', 'plan'] as const;
      const setters: string[] = [];
      const values: unknown[] = [];
      let n = 1;
      for (const f of fields) {
        if (f in patch) {
          setters.push(`${f} = $${n++}`);
          values.push((patch as Record<string, unknown>)[f]);
        }
      }
      if (setters.length === 0) {
        const r = await db.query<TalentoRow>('select * from talentos where id = $1', [id]);
        return { success: true, data: talentoToSession(r.rows[0]) };
      }
      values.push(id);
      const r = await db.query<TalentoRow>(
        `update talentos set ${setters.join(', ')} where id = $${n} returning *`,
        values
      );
      return { success: true, data: talentoToSession(r.rows[0]) };
    }

    const fields = ['nombre', 'industria', 'sitio_web', 'contacto_nombre', 'presupuesto_mxn', 'plan'] as const;
    const setters: string[] = [];
    const values: unknown[] = [];
    let n = 1;
    for (const f of fields) {
      if (f in patch) {
        setters.push(`${f} = $${n++}`);
        values.push((patch as Record<string, unknown>)[f]);
      }
    }
    if (setters.length === 0) {
      const r = await db.query<MarcaRow>('select * from marcas where id = $1', [id]);
      return { success: true, data: marcaToSession(r.rows[0]) };
    }
    values.push(id);
    const r = await db.query<MarcaRow>(
      `update marcas set ${setters.join(', ')} where id = $${n} returning *`,
      values
    );
    return { success: true, data: marcaToSession(r.rows[0]) };
  });

  // ============================================================
  // MATCHES (con filtros y acciones)
  // ============================================================
  app.get('/matches', async (req) => {
    const parsed = z.object({
      usuario_id: z.string().uuid().optional(),
      tipo: z.enum(['atleta', 'marca']).optional(),
      q: z.string().optional(),
      industria: z.string().optional(),
      ciudad: z.string().optional(),
      disciplina: z.string().optional(),
      presupuesto_min: z.coerce.number().int().min(0).optional(),
      presupuesto_max: z.coerce.number().int().min(0).optional(),
      pct_min: z.coerce.number().int().min(0).max(100).optional(),
      estado: z.enum(['nuevo', 'solicitado', 'conectado', 'rechazado']).optional(),
      sort: z.enum(['compatibilidad', 'recencia']).optional().default('compatibilidad'),
    }).safeParse(req.query);

    if (!parsed.success) return { success: true, data: [] };
    const q = parsed.data;

    const where: string[] = [];
    const vals: unknown[] = [];
    let n = 1;

    // Filtro por usuario+tipo
    let join: string;
    let select: string;
    if (q.tipo === 'atleta') {
      join = 'join marcas ma on ma.id = m.marca_id';
      select = `m.id, m.porcentaje, m.estado, m.razones, m.created_at,
                ma.id as marca_id, ma.nombre as marca_nombre, ma.industria, ma.pais,
                ma.presupuesto_mxn, ma.puntuacion as marca_puntuacion`;
      if (q.usuario_id) {
        where.push(`m.talento_id = $${n++}`);
        vals.push(q.usuario_id);
      }
      if (q.industria)  { where.push(`ma.industria ilike $${n++}`); vals.push(`%${q.industria}%`); }
      if (q.q)          { where.push(`(ma.nombre ilike $${n} or ma.industria ilike $${n})`); vals.push(`%${q.q}%`); n++; }
      if (q.presupuesto_min !== undefined) { where.push(`ma.presupuesto_mxn >= $${n++}`); vals.push(q.presupuesto_min); }
      if (q.presupuesto_max !== undefined) { where.push(`ma.presupuesto_mxn <= $${n++}`); vals.push(q.presupuesto_max); }
    } else if (q.tipo === 'marca') {
      join = 'join talentos t on t.id = m.talento_id';
      select = `m.id, m.porcentaje, m.estado, m.razones, m.created_at,
                t.id as talento_id, t.nombre as talento_nombre, t.disciplina, t.ciudad,
                t.foto_url, t.redes_seguidores, t.puntuacion as talento_puntuacion`;
      if (q.usuario_id) {
        where.push(`m.marca_id = $${n++}`);
        vals.push(q.usuario_id);
      }
      if (q.disciplina) { where.push(`t.disciplina ilike $${n++}`); vals.push(`%${q.disciplina}%`); }
      if (q.ciudad)     { where.push(`t.ciudad ilike $${n++}`); vals.push(`%${q.ciudad}%`); }
      if (q.q)          { where.push(`(t.nombre ilike $${n} or t.disciplina ilike $${n} or t.ciudad ilike $${n})`); vals.push(`%${q.q}%`); n++; }
    } else {
      // Lista pública por defecto: marcas para que un atleta navegue
      join = 'join marcas ma on ma.id = m.marca_id';
      select = `m.id, m.porcentaje, m.estado, m.razones, m.created_at,
                ma.id as marca_id, ma.nombre as marca_nombre, ma.industria, ma.pais,
                ma.presupuesto_mxn, ma.puntuacion as marca_puntuacion`;
    }

    if (q.pct_min !== undefined) { where.push(`m.porcentaje >= $${n++}`); vals.push(q.pct_min); }
    if (q.estado) { where.push(`m.estado = $${n++}`); vals.push(q.estado); }

    const order = q.sort === 'recencia' ? 'm.created_at desc' : 'm.porcentaje desc';
    const sql = `select ${select} from matches m ${join} ${where.length ? 'where ' + where.join(' and ') : ''} order by ${order}`;

    const r = await db.query(sql, vals);
    return { success: true, data: r.rows };
  });

  app.post('/matches/:id/accion', async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ success: false, error: 'Match inválido' });
    const body = z.object({
      accion: z.enum(['solicitar', 'aceptar', 'rechazar']),
    }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ success: false, error: 'Acción inválida' });

    const estado =
      body.data.accion === 'solicitar' ? 'solicitado' :
      body.data.accion === 'aceptar'   ? 'conectado'  : 'rechazado';

    const r = await db.query(
      'update matches set estado = $1 where id = $2 returning id, estado',
      [estado, params.data.id]
    );
    if (r.rowCount === 0) return reply.code(404).send({ success: false, error: 'Match no encontrado' });
    return { success: true, data: r.rows[0] };
  });

  // ============================================================
  // CONVERSACIONES
  // ============================================================
  app.get('/conversaciones', async (req, reply) => {
    const parsed = z.object({
      usuario_id: z.string().uuid(),
      tipo: z.enum(['atleta', 'marca']),
    }).safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Parámetros inválidos' });

    const { usuario_id, tipo } = parsed.data;
    const col = tipo === 'atleta' ? 'm.talento_id' : 'm.marca_id';

    const r = await db.query(
      `select m.id as match_id, m.porcentaje, m.estado as match_estado,
              ${tipo === 'atleta'
                ? `ma.id as otro_id, ma.nombre as otro_nombre, ma.industria as otro_meta, null::text as foto_url`
                : `t.id as otro_id, t.nombre as otro_nombre, t.disciplina as otro_meta, t.foto_url`},
              (select texto from mensajes where match_id = m.id order by created_at desc limit 1) as ultimo,
              (select created_at from mensajes where match_id = m.id order by created_at desc limit 1) as ultimo_at,
              (select count(*) from mensajes where match_id = m.id) as total_msgs
       from matches m
       ${tipo === 'atleta'
         ? 'join marcas ma on ma.id = m.marca_id'
         : 'join talentos t on t.id = m.talento_id'}
       where ${col} = $1
       order by ultimo_at desc nulls last`,
      [usuario_id]
    );
    return { success: true, data: r.rows };
  });

  app.get('/conversaciones/:matchId/mensajes', async (req, reply) => {
    const parsed = z.object({ matchId: z.string().uuid() }).safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Match inválido' });
    const r = await db.query(
      `select id, autor_tipo, texto, tipo_ia, created_at from mensajes where match_id = $1 order by created_at asc`,
      [parsed.data.matchId]
    );
    return { success: true, data: r.rows };
  });

  app.post('/conversaciones/:matchId/mensajes', async (req, reply) => {
    const params = z.object({ matchId: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ success: false, error: 'Match inválido' });

    const body = z.object({
      texto: z.string().min(1).max(2000),
      autor_tipo: z.enum(['atleta', 'marca']),
    }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ success: false, error: 'Mensaje inválido' });

    const autorDb = body.data.autor_tipo === 'atleta' ? 'talento' : 'marca';
    const ins = await db.query(
      `insert into mensajes (match_id, autor_tipo, texto)
       values ($1, $2, $3)
       returning id, autor_tipo, texto, tipo_ia, created_at`,
      [params.data.matchId, autorDb, body.data.texto]
    );

    const fuga = /whats\s*app|tel[eé]fono|email personal|por fuera|mis datos|hablamos aparte/i.test(body.data.texto);
    let extra = null;
    if (fuga) {
      const ia = await db.query(
        `insert into mensajes (match_id, autor_tipo, texto, tipo_ia)
         values ($1, 'ia', $2, 'fuga')
         returning id, autor_tipo, texto, tipo_ia, created_at`,
        [params.data.matchId,
         'Detecté que sugieren continuar fuera de la plataforma. Si lo hacen pierden: el seguimiento del contrato, el calendario de compromisos, la protección legal y baja la puntuación de tu perfil. ¿Seguro que quieres continuar fuera?']
      );
      extra = ia.rows[0];
    }

    return { success: true, data: { mensaje: ins.rows[0], ia: extra } };
  });

  // ============================================================
  // VITRINA
  // ============================================================
  app.get('/vitrina', async (req) => {
    const parsed = z.object({
      tipo: z.enum(['todos', 'logro', 'acuerdo', 'competencia', 'general']).optional().default('todos'),
      q: z.string().optional(),
      disciplina: z.string().optional(),
    }).safeParse(req.query);

    const where: string[] = [];
    const vals: unknown[] = [];
    let n = 1;

    if (parsed.success && parsed.data.tipo !== 'todos') {
      where.push(`p.tipo = $${n++}`);
      vals.push(parsed.data.tipo);
    }
    if (parsed.success && parsed.data.q) {
      where.push(`(p.texto ilike $${n} or t.nombre ilike $${n} or p.hashtags ilike $${n})`);
      vals.push(`%${parsed.data.q}%`);
      n++;
    }
    if (parsed.success && parsed.data.disciplina) {
      where.push(`t.disciplina ilike $${n++}`);
      vals.push(`%${parsed.data.disciplina}%`);
    }

    const sql = `
      select p.id, p.texto, p.imagen_url, p.tipo, p.likes, p.hashtags, p.created_at,
             t.id as autor_id, t.nombre as autor_nombre, t.disciplina, t.ciudad, t.foto_url
      from posts_vitrina p
      join talentos t on t.id = p.autor_id
      ${where.length ? 'where ' + where.join(' and ') : ''}
      order by p.created_at desc
    `;
    const r = await db.query(sql, vals);
    return { success: true, data: r.rows };
  });

  app.post('/vitrina/:id/like', async (req, reply) => {
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Post inválido' });
    const r = await db.query(
      'update posts_vitrina set likes = likes + 1 where id = $1 returning id, likes',
      [parsed.data.id]
    );
    if (!r.rows[0]) return reply.code(404).send({ success: false, error: 'Post no encontrado' });
    return { success: true, data: r.rows[0] };
  });

  // ============================================================
  // STATS PÚBLICOS (para landing)
  // ============================================================
  app.get('/stats/publico', async () => {
    const r = await db.query(`
      select
        (select count(*) from talentos where estado = 'aprobado') as talentos_activos,
        (select count(*) from marcas where estado = 'aprobado') as marcas_activas,
        (select count(*) from matches where estado in ('conectado', 'solicitado')) as conexiones,
        coalesce((select sum(presupuesto_mxn) from marcas where estado='aprobado'), 0) as presupuesto_total
    `);
    return { success: true, data: r.rows[0] };
  });
}
