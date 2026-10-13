import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeEmailGateway } from '#tests/fakes/FakeEmailGateway';
import { makeTestApp } from '#tests/makeTestApp';

const WEB_ORIGIN = 'http://localhost:5173';
const mobile = { 'x-client-platform': 'mobile' };
const web = { 'x-client-platform': 'web', origin: WEB_ORIGIN };

const credentials = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct-horse-battery' };

function refreshCookie(response: LightMyRequestResponse) {
  return response.cookies.find((cookie) => cookie.name === 'refresh_token');
}

describe('auth (e2e)', () => {
  let app: FastifyInstance;
  let emails: FakeEmailGateway;

  beforeEach(async () => {
    const testApp = await makeTestApp();

    app = testApp.app;
    emails = testApp.emailGateway;
  });

  afterEach(async () => {
    vi.useRealTimers();
    await app.close();
  });

  function post(url: string, payload: object, headers: Record<string, string> = mobile) {
    return app.inject({ method: 'POST', url, payload, headers });
  }

  async function signUpAndVerify() {
    await post('/auth/sign-up', credentials);
    const response = await post('/auth/verify-email', {
      email: credentials.email,
      code: emails.lastCodeFor(credentials.email),
    });

    return response.json() as { accessToken: string; refreshToken: string };
  }

  async function signIn(password = credentials.password) {
    return post('/auth/sign-in', { email: credentials.email, password });
  }

  it('sign-up → verify → sign-in → me → refresh → reuse detected → sign-out', async () => {
    const signUp = await post('/auth/sign-up', credentials);

    expect(signUp.statusCode).toBe(201);

    const beforeVerify = await signIn();

    expect(beforeVerify.statusCode).toBe(403);
    expect(beforeVerify.json().error.code).toBe('EMAIL_NOT_VERIFIED');

    const verify = await post('/auth/verify-email', {
      email: credentials.email,
      code: emails.lastCodeFor(credentials.email),
    });

    expect(verify.statusCode).toBe(200);
    expect(verify.json()).toEqual({ accessToken: expect.any(String), refreshToken: expect.any(String) });

    const signInResponse = await signIn();

    expect(signInResponse.statusCode).toBe(200);

    const session = signInResponse.json();
    const me = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${session.accessToken}` },
    });

    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual({
      id: expect.any(String),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      emailVerified: true,
      providers: [],
    });

    const rotated = await post('/auth/refresh', { refreshToken: session.refreshToken });

    expect(rotated.statusCode).toBe(200);
    expect(rotated.json().refreshToken).not.toBe(session.refreshToken);

    // Old token replayed long after rotation: theft suspected, family revoked.
    vi.useFakeTimers({ now: Date.now() + 31_000, toFake: ['Date'] });

    const reuse = await post('/auth/refresh', { refreshToken: session.refreshToken });

    expect(reuse.statusCode).toBe(401);
    expect(reuse.json().error.code).toBe('INVALID_REFRESH_TOKEN');

    const afterRevocation = await post('/auth/refresh', { refreshToken: rotated.json().refreshToken });

    expect(afterRevocation.statusCode).toBe(401);

    const newSession = (await signIn()).json();
    const signOut = await post('/auth/sign-out', { refreshToken: newSession.refreshToken });

    expect(signOut.statusCode).toBe(204);
    expect((await post('/auth/refresh', { refreshToken: newSession.refreshToken })).statusCode).toBe(401);
  });

  it('reuse within the grace period does not revoke the family', async () => {
    const session = await signUpAndVerify();
    const rotated = (await post('/auth/refresh', { refreshToken: session.refreshToken })).json();

    expect((await post('/auth/refresh', { refreshToken: session.refreshToken })).statusCode).toBe(401);
    expect((await post('/auth/refresh', { refreshToken: rotated.refreshToken })).statusCode).toBe(200);
  });

  it('rejects sign-up with an email already in use', async () => {
    await post('/auth/sign-up', credentials);

    const response = await post('/auth/sign-up', { ...credentials, email: 'ADA@example.com' });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('EMAIL_ALREADY_IN_USE');
  });

  it('rejects wrong credentials with 401', async () => {
    await signUpAndVerify();

    const wrongPassword = await signIn('wrong-password');
    const unknown = await post('/auth/sign-in', { email: 'nobody@example.com', password: 'whatever' });

    expect(wrongPassword.statusCode).toBe(401);
    expect(wrongPassword.json().error.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.json()).toEqual(wrongPassword.json());
  });

  it('rejects a wrong verification code', async () => {
    await post('/auth/sign-up', credentials);
    const code = emails.lastCodeFor(credentials.email) === '000000' ? '111111' : '000000';

    const response = await post('/auth/verify-email', { email: credentials.email, code });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_VERIFICATION_CODE');
  });

  it('resend always answers 204 and sends a fresh code only to unverified users', async () => {
    await post('/auth/sign-up', credentials);

    expect((await post('/auth/verify-email/resend', { email: credentials.email })).statusCode).toBe(204);
    expect((await post('/auth/verify-email/resend', { email: 'nobody@example.com' })).statusCode).toBe(204);
    expect(emails.sentTo(credentials.email)).toHaveLength(2);
  });

  it('forgot → reset changes the password and revokes every session', async () => {
    const session = await signUpAndVerify();

    expect((await post('/auth/forgot-password', { email: credentials.email })).statusCode).toBe(204);

    const reset = await post('/auth/reset-password', {
      email: credentials.email,
      code: emails.lastCodeFor(credentials.email),
      password: 'brand-new-password',
    });

    expect(reset.statusCode).toBe(204);
    expect((await post('/auth/refresh', { refreshToken: session.refreshToken })).statusCode).toBe(401);
    expect((await signIn()).statusCode).toBe(401);
    expect((await signIn('brand-new-password')).statusCode).toBe(200);
  });

  it('forgot-password answers 204 for unknown emails without sending anything', async () => {
    const response = await post('/auth/forgot-password', { email: 'nobody@example.com' });

    expect(response.statusCode).toBe(204);
    expect(emails.sent).toHaveLength(0);
  });

  it('returns 400 VALIDATION with the error envelope', async () => {
    const response = await post('/auth/sign-up', { name: '', email: 'nope', password: 'short' });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION',
        message: [
          { field: 'name', error: expect.any(String) },
          { field: 'email', error: expect.any(String) },
          { field: 'password', error: expect.any(String) },
        ],
      },
    });
  });

  it('rejects passwords longer than 128 characters', async () => {
    const response = await post('/auth/sign-up', { ...credentials, password: 'a'.repeat(129) });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.message[0].field).toBe('password');
  });

  it('requires X-Client-Platform on session routes', async () => {
    await signUpAndVerify();

    const response = await post('/auth/sign-in', { email: credentials.email, password: credentials.password }, {});

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('BAD_REQUEST');
  });

  it('GET /me requires a valid access token', async () => {
    const response = await app.inject({ method: 'GET', url: '/me' });

    expect(response.statusCode).toBe(401);
  });

  it('rate limits sign-in to 10 requests per minute per IP', async () => {
    const responses = [];

    for (let attempt = 0; attempt < 11; attempt++) {
      responses.push(await post('/auth/sign-in', { email: 'nobody@example.com', password: 'whatever' }));
    }

    expect(responses.at(-2)?.statusCode).toBe(401);
    expect(responses.at(-1)?.statusCode).toBe(429);
    expect(responses.at(-1)?.json().error.code).toBe('TOO_MANY_REQUESTS');
  });

  describe('web platform', () => {
    beforeEach(async () => {
      await signUpAndVerify();
    });

    it('delivers the refresh token only in an httpOnly cookie', async () => {
      const response = await signInWeb();
      const cookie = refreshCookie(response);

      expect(response.json()).toEqual({ accessToken: expect.any(String) });
      expect(cookie).toMatchObject({ httpOnly: true, path: '/auth', sameSite: 'Lax', maxAge: 30 * 24 * 60 * 60 });
      expect(cookie?.secure).toBeFalsy();
    });

    it('refreshes from the cookie and rotates it', async () => {
      const cookie = refreshCookie(await signInWeb())!;

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: web,
        cookies: { refresh_token: cookie.value },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ accessToken: expect.any(String) });
      expect(refreshCookie(response)?.value).not.toBe(cookie.value);
    });

    it('rejects cookie-based refresh without a trusted Origin (CSRF)', async () => {
      const cookie = refreshCookie(await signInWeb())!;
      const attempt = (origin?: string) => app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: origin ? { 'x-client-platform': 'web', origin } : { 'x-client-platform': 'web' },
        cookies: { refresh_token: cookie.value },
      });

      const missing = await attempt();
      const evil = await attempt('https://evil.example');

      expect(missing.statusCode).toBe(403);
      expect(evil.statusCode).toBe(403);
      expect(evil.json().error.code).toBe('FORBIDDEN');
    });

    it('rejects refresh without a cookie', async () => {
      const response = await app.inject({ method: 'POST', url: '/auth/refresh', headers: web });

      expect(response.statusCode).toBe(401);
    });

    it('sign-out revokes the family and clears the cookie', async () => {
      const cookie = refreshCookie(await signInWeb())!;

      const signOut = await app.inject({
        method: 'POST',
        url: '/auth/sign-out',
        headers: web,
        cookies: { refresh_token: cookie.value },
      });
      const refresh = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: web,
        cookies: { refresh_token: cookie.value },
      });

      expect(signOut.statusCode).toBe(204);
      expect(refreshCookie(signOut)?.value).toBe('');
      expect(refresh.statusCode).toBe(401);
    });

    function signInWeb() {
      return post('/auth/sign-in', { email: credentials.email, password: credentials.password }, web);
    }
  });
});
