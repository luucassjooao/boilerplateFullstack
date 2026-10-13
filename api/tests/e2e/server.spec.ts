import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Controller } from '#application/contracts/Controller';
import { makeFastifyRouteAdapter } from '#main/adapters/fastifyRouteAdapter';
import { makeTestApp } from '#tests/makeTestApp';

const echoSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
});

class EchoController extends Controller<'public', z.infer<typeof echoSchema>> {
  protected override readonly schema = echoSchema;

  protected override async handle({ body }: Controller.Request<'public', z.infer<typeof echoSchema>>) {
    return { statusCode: 200, body };
  }
}

class WhoAmIController extends Controller<'private', { userId: string }> {
  protected override async handle({ userId }: Controller.Request<'private'>) {
    return { statusCode: 200, body: { userId } };
  }
}

class BoomController extends Controller {
  protected override async handle(): Promise<Controller.Response> {
    throw new Error('database exploded');
  }
}

describe('server', () => {
  let app: FastifyInstance;
  let signAccessToken: (userId: string) => Promise<string>;

  beforeEach(async () => {
    const testApp = await makeTestApp();
    const adapt = makeFastifyRouteAdapter(testApp.infra);

    app = testApp.app;
    signAccessToken = (userId) => testApp.infra.accessTokenService.sign({ userId });

    app.post('/test/echo', adapt(new EchoController(), { type: 'public' }));
    app.get('/test/whoami', adapt(new WhoAmIController(), { type: 'private' }));
    app.get('/test/boom', adapt(new BoomController(), { type: 'public' }));
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns 200', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('sets security headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('answers CORS preflight only for allowed origins', async () => {
    const allowed = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'GET' },
    });
    const denied = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
    });

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns 400 VALIDATION with field errors', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/echo',
      payload: { name: 'a', email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION',
        message: [
          { field: 'name', error: expect.any(String) },
          { field: 'email', error: expect.any(String) },
        ],
      },
    });
  });

  it('passes the parsed body to the controller', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/echo',
      payload: { name: 'Ada', email: 'ada@example.com', extra: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ name: 'Ada', email: 'ada@example.com' });
  });

  it('returns 400 BAD_REQUEST for malformed JSON', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/test/echo',
      headers: { 'content-type': 'application/json' },
      payload: '{"name":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 NOT_FOUND for unknown routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/nope?secret=1' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route GET /nope not found' } });
  });

  it('returns 500 INTERNAL_SERVER_ERROR without leaking the cause', async () => {
    const response = await app.inject({ method: 'GET', url: '/test/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
    });
  });

  it('rejects private routes without a valid bearer token', async () => {
    const missing = await app.inject({ method: 'GET', url: '/test/whoami' });
    const invalid = await app.inject({
      method: 'GET',
      url: '/test/whoami',
      headers: { authorization: 'Bearer not-a-jwt' },
    });

    expect(missing.statusCode).toBe(401);
    expect(missing.json().error.code).toBe('UNAUTHORIZED');
    expect(invalid.statusCode).toBe(401);
  });

  it('injects userId into private routes', async () => {
    const token = await signAccessToken('user-1');
    const response = await app.inject({
      method: 'GET',
      url: '/test/whoami',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: 'user-1' });
  });
});
