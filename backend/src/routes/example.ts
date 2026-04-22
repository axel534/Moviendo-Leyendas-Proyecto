import { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * Example route: shows how to structure endpoints with Zod validation.
 * Replace with your actual domain routes.
 */
export async function exampleRoutes(app: FastifyInstance): Promise<void> {
  app.get('/hello', async () => ({
    message: '¡Hola desde el backend!',
    timestamp: new Date().toISOString(),
  }));

  const echoSchema = z.object({
    message: z.string().min(1).max(500),
  });

  app.post('/echo', async (req, reply) => {
    const parsed = echoSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
    }

    return { echo: parsed.data.message, at: new Date().toISOString() };
  });
}
