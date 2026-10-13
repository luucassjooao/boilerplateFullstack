import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FakeOAuthProvider } from '#tests/fakes/FakeOAuthProvider';
import { makeTestApp } from '#tests/makeTestApp';

function cookie(response: LightMyRequestResponse, name: string) {
  return response.cookies.find((item) => item.name === name);
}

describe('oauth (e2e)', () => {
  let app: FastifyInstance;
  let oauth: { google: FakeOAuthProvider; apple: FakeOAuthProvider };

  beforeEach(async () => {
    const testApp = await makeTestApp();

    app = testApp.app;
    oauth = testApp.oauth;
  });

  afterEach(async () => {
    await app.close();
  });

  function authorize(provider: string, redirectTo?: string) {
    const query = redirectTo === undefined ? '' : `?redirectTo=${encodeURIComponent(redirectTo)}`;

    return app.inject({ method: 'GET', url: `/auth/oauth/${provider}/authorize${query}` });
  }

  describe('web (authorization code + PKCE)', () => {
    it('authorize redirects to the provider and stores the transaction in a signed cookie', async () => {
      const response = await authorize('google', '/dashboard');
      const location = new URL(response.headers.location as string);
      const tx = cookie(response, 'oauth_tx');

      expect(response.statusCode).toBe(302);
      expect(location.origin).toBe('https://google.example');
      expect(location.searchParams.get('redirect_uri')).toBe('http://api.test/auth/oauth/google/callback');
      expect(tx).toMatchObject({ httpOnly: true, path: '/auth/oauth', sameSite: 'Lax', maxAge: 600 });
      // Signed: tampering is detectable, and the PKCE verifier is not readable as plain JSON.
      expect(app.unsignCookie(tx!.value).valid).toBe(true);
    });

    it('callback signs in, sets the refresh cookie and redirects to the web app without tokens in the URL', async () => {
      const start = await authorize('google', '/dashboard');
      const tx = cookie(start, 'oauth_tx')!;
      const state = new URL(start.headers.location as string).searchParams.get('state')!;

      oauth.google.willAccept('auth-code');

      const callback = await app.inject({
        method: 'GET',
        url: `/auth/oauth/google/callback?code=auth-code&state=${state}`,
        cookies: { oauth_tx: tx.value },
      });

      expect(callback.statusCode).toBe(302);
      expect(callback.headers.location).toBe('http://localhost:5173/auth/callback?redirectTo=%2Fdashboard');
      expect(cookie(callback, 'oauth_tx')?.value).toBe('');

      const refreshCookie = cookie(callback, 'refresh_token')!;
      const refresh = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { 'x-client-platform': 'web', origin: 'http://localhost:5173' },
        cookies: { refresh_token: refreshCookie.value },
      });

      expect(refresh.statusCode).toBe(200);

      const me = await app.inject({
        method: 'GET',
        url: '/me',
        headers: { authorization: `Bearer ${refresh.json().accessToken}` },
      });

      expect(me.json()).toMatchObject({ email: 'auth-code@example.com', emailVerified: true, providers: ['google'] });
    });

    it('callback with a forged state or without the transaction cookie redirects with an error', async () => {
      const start = await authorize('google');
      const tx = cookie(start, 'oauth_tx')!;

      oauth.google.willAccept('auth-code');

      const forged = await app.inject({
        method: 'GET',
        url: '/auth/oauth/google/callback?code=auth-code&state=forged',
        cookies: { oauth_tx: tx.value },
      });
      const noCookie = await app.inject({ method: 'GET', url: '/auth/oauth/google/callback?code=auth-code&state=x' });
      const tampered = await app.inject({
        method: 'GET',
        url: '/auth/oauth/google/callback?code=auth-code&state=x',
        cookies: { oauth_tx: `${tx.value}x` },
      });

      for (const response of [forged, noCookie, tampered]) {
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('http://localhost:5173/auth/callback?error=OAUTH_FAILED');
        expect(cookie(response, 'refresh_token')).toBeUndefined();
      }

      expect(oauth.google.exchanges).toHaveLength(0);
    });

    it('callback forwards provider errors (e.g. user cancelled) and unverified emails as error codes', async () => {
      const denied = await app.inject({ method: 'GET', url: '/auth/oauth/google/callback?error=access_denied' });

      expect(denied.headers.location).toBe('http://localhost:5173/auth/callback?error=OAUTH_FAILED');

      const start = await authorize('google');
      const state = new URL(start.headers.location as string).searchParams.get('state')!;

      oauth.google.willAccept('unverified', { emailVerified: false });

      const unverified = await app.inject({
        method: 'GET',
        url: `/auth/oauth/google/callback?code=unverified&state=${state}`,
        cookies: { oauth_tx: cookie(start, 'oauth_tx')!.value },
      });

      expect(unverified.headers.location).toBe('http://localhost:5173/auth/callback?error=OAUTH_EMAIL_NOT_VERIFIED');
    });

    it('apple: SameSite=None cookie and form_post callback with the first-login name', async () => {
      const start = await authorize('apple', '/welcome');
      const tx = cookie(start, 'oauth_tx')!;
      const state = new URL(start.headers.location as string).searchParams.get('state')!;

      expect(tx).toMatchObject({ sameSite: 'None', secure: true });

      oauth.apple.willAccept('apple-code', { email: 'ada@privaterelay.appleid.com' });

      const callback = await app.inject({
        method: 'POST',
        url: '/auth/oauth/apple/callback',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        payload: new URLSearchParams({
          code: 'apple-code',
          state,
          user: JSON.stringify({ name: { firstName: 'Ada', lastName: 'Lovelace' }, email: 'ada@privaterelay.appleid.com' }),
        }).toString(),
        cookies: { oauth_tx: tx.value },
      });

      expect(callback.statusCode).toBe(302);
      expect(callback.headers.location).toBe('http://localhost:5173/auth/callback?redirectTo=%2Fwelcome');
      expect(cookie(callback, 'oauth_tx')).toMatchObject({ value: '', sameSite: 'None', secure: true });

      const refresh = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        headers: { 'x-client-platform': 'web', origin: 'http://localhost:5173' },
        cookies: { refresh_token: cookie(callback, 'refresh_token')!.value },
      });
      const me = await app.inject({
        method: 'GET',
        url: '/me',
        headers: { authorization: `Bearer ${refresh.json().accessToken}` },
      });

      expect(me.json()).toMatchObject({ name: 'Ada Lovelace', providers: ['apple'] });
    });

    it.each(['//evil.com', '/\\evil.com', 'https://evil.com', '/\t/evil.com'])(
      'authorize rejects redirectTo=%j (open redirect)',
      async (redirectTo) => {
        const response = await authorize('google', redirectTo);

        expect(response.statusCode).toBe(400);
        expect(response.json().error.code).toBe('VALIDATION');
      },
    );

    it('authorize rejects unknown providers with 400', async () => {
      const response = await authorize('github');

      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe('BAD_REQUEST');
    });
  });

  describe('mobile (native id_token)', () => {
    function token(provider: string, payload: object) {
      return app.inject({
        method: 'POST',
        url: `/auth/oauth/${provider}/token`,
        headers: { 'x-client-platform': 'mobile' },
        payload,
      });
    }

    it('exchanges a valid id_token for a session', async () => {
      oauth.apple.willAccept('id-token');

      const response = await token('apple', { idToken: 'id-token', nonce: 'raw-nonce', name: 'Ada' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ accessToken: expect.any(String), refreshToken: expect.any(String) });
      expect(oauth.apple.verifications[0]).toEqual({ idToken: 'id-token', nonce: 'raw-nonce' });
    });

    it('links to an existing email+password account', async () => {
      await app.inject({
        method: 'POST',
        url: '/auth/sign-up',
        payload: { name: 'Ada', email: 'ada@example.com', password: 'password-123' },
      });
      oauth.google.willAccept('id-token', { email: 'ada@example.com' });

      const session = (await token('google', { idToken: 'id-token' })).json();
      const me = await app.inject({ method: 'GET', url: '/me', headers: { authorization: `Bearer ${session.accessToken}` } });

      expect(me.json()).toMatchObject({ email: 'ada@example.com', emailVerified: true, providers: ['google'] });
    });

    it('rejects invalid id_tokens with 401 OAUTH_FAILED', async () => {
      const response = await token('google', { idToken: 'forged' });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe('OAUTH_FAILED');
    });

    it('rejects unverified provider emails with 403', async () => {
      oauth.google.willAccept('id-token', { emailVerified: false });

      const response = await token('google', { idToken: 'id-token' });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe('OAUTH_EMAIL_NOT_VERIFIED');
    });
  });
});
