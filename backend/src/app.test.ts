import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

describe('Health endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Set test env vars if not present
    process.env.DATABASE_URL ||= 'postgres://user:pass@localhost:5432/test';
    process.env.NODE_ENV = 'test';
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('status', 'ok');
  });

  it('GET /api/v1/hello returns a greeting', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/hello' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('message');
  });
});
