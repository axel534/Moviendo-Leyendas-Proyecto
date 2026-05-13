import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db/index.js';
import { config } from '../config.js';

export type StaffRol = 'owner' | 'admin';

export interface StaffRow {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  rol: StaffRol;
  activo: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface StaffJwtPayload {
  id: string;
  email: string;
  nombre: string;
  rol: StaffRol;
}

function sign(payload: StaffJwtPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: `${config.JWT_EXPIRES_DAYS}d` });
}

export function verifyStaffToken(token: string): StaffJwtPayload | null {
  try {
    const p = jwt.verify(token, config.JWT_SECRET) as StaffJwtPayload;
    if (!p?.id || !p.rol) return null;
    return p;
  } catch {
    return null;
  }
}

export function getStaffFromReq(req: FastifyRequest): StaffJwtPayload | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  return verifyStaffToken(h.slice('Bearer '.length));
}

export function requireStaffMiddleware(allowed: StaffRol[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const staff = getStaffFromReq(req);
    if (!staff || !allowed.includes(staff.rol)) {
      reply.code(401).send({ success: false, error: 'No autorizado' });
      return reply;
    }
    (req as FastifyRequest & { staff?: StaffJwtPayload }).staff = staff;
  };
}

export async function staffAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', async (req, reply) => {
    const parsed = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Email o contraseña inválidos' });

    const r = await db.query<StaffRow>('select * from staff where email = $1 and activo = true', [parsed.data.email]);
    const row = r.rows[0];
    if (!row) return reply.code(401).send({ success: false, error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(parsed.data.password, row.password_hash);
    if (!ok) return reply.code(401).send({ success: false, error: 'Credenciales incorrectas' });

    await db.query('update staff set last_login_at = now() where id = $1', [row.id]);

    const payload: StaffJwtPayload = {
      id: row.id,
      email: row.email,
      nombre: row.nombre,
      rol: row.rol,
    };
    return { success: true, data: { token: sign(payload), staff: payload } };
  });

  app.get('/me', async (req, reply) => {
    const staff = getStaffFromReq(req);
    if (!staff) return reply.code(401).send({ success: false, error: 'No autorizado' });
    return { success: true, data: staff };
  });
}

export async function staffManageRoutes(app: FastifyInstance): Promise<void> {
  // Solo owner puede gestionar staff
  app.addHook('preHandler', requireStaffMiddleware(['owner']));

  app.get('/', async () => {
    const r = await db.query<Omit<StaffRow, 'password_hash'>>(
      'select id, email, nombre, rol, activo, created_at, last_login_at from staff order by rol, created_at'
    );
    return { success: true, data: r.rows };
  });

  app.post('/', async (req, reply) => {
    const parsed = z.object({
      email: z.string().email(),
      password: z.string().min(8, 'Mínimo 8 caracteres'),
      nombre: z.string().min(1),
      rol: z.enum(['owner', 'admin']),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() });

    const exists = await db.query<{ id: string }>('select id from staff where email = $1', [parsed.data.email]);
    if (exists.rows[0]) return reply.code(409).send({ success: false, error: 'Ese correo ya está en uso' });

    const hash = await bcrypt.hash(parsed.data.password, 10);
    const r = await db.query<Omit<StaffRow, 'password_hash'>>(
      `insert into staff (email, password_hash, nombre, rol)
       values ($1, $2, $3, $4)
       returning id, email, nombre, rol, activo, created_at, last_login_at`,
      [parsed.data.email, hash, parsed.data.nombre, parsed.data.rol]
    );
    return { success: true, data: r.rows[0] };
  });

  app.patch('/:id', async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ success: false, error: 'ID inválido' });
    const body = z.object({
      nombre: z.string().min(1).optional(),
      rol: z.enum(['owner', 'admin']).optional(),
      activo: z.boolean().optional(),
      password: z.string().min(8).optional(),
    }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ success: false, error: 'Datos inválidos' });

    const setters: string[] = [];
    const vals: unknown[] = [];
    let n = 1;
    for (const key of ['nombre', 'rol', 'activo'] as const) {
      if (key in body.data && body.data[key] !== undefined) {
        setters.push(`${key} = $${n++}`);
        vals.push(body.data[key]);
      }
    }
    if (body.data.password) {
      const hash = await bcrypt.hash(body.data.password, 10);
      setters.push(`password_hash = $${n++}`);
      vals.push(hash);
    }
    if (setters.length === 0) return reply.code(400).send({ success: false, error: 'Nada que actualizar' });
    vals.push(params.data.id);

    const r = await db.query<Omit<StaffRow, 'password_hash'>>(
      `update staff set ${setters.join(', ')} where id = $${n}
       returning id, email, nombre, rol, activo, created_at, last_login_at`,
      vals
    );
    if (r.rowCount === 0) return reply.code(404).send({ success: false, error: 'No encontrado' });
    return { success: true, data: r.rows[0] };
  });

  app.delete('/:id', async (req, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) return reply.code(400).send({ success: false, error: 'ID inválido' });

    const requester = (req as FastifyRequest & { staff?: StaffJwtPayload }).staff;
    if (requester?.id === params.data.id) {
      return reply.code(400).send({ success: false, error: 'No puedes eliminarte a ti mismo' });
    }

    // Protección: no permitir eliminar al último owner
    const owners = await db.query<{ n: number }>(`select count(*)::int as n from staff where rol='owner' and activo=true`);
    const target = await db.query<{ rol: StaffRol }>(`select rol from staff where id = $1`, [params.data.id]);
    if (target.rows[0]?.rol === 'owner' && owners.rows[0].n <= 1) {
      return reply.code(400).send({ success: false, error: 'No puedes eliminar al único owner' });
    }

    await db.query('delete from staff where id = $1', [params.data.id]);
    return { success: true };
  });
}
