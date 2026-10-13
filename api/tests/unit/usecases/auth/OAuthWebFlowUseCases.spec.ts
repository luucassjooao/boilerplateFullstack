import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import { BadRequest } from '#application/errors/http/BadRequest';
import { OAuthProviders } from '#application/services/OAuthProviders';
import { CompleteOAuthUseCase } from '#application/usecases/auth/CompleteOAuthUseCase';
import { OAuthSignInUseCase } from '#application/usecases/auth/OAuthSignInUseCase';
import { OAuthTokenSignInUseCase } from '#application/usecases/auth/OAuthTokenSignInUseCase';
import { StartOAuthUseCase } from '#application/usecases/auth/StartOAuthUseCase';
import { FakeOAuthProvider } from '#tests/fakes/FakeOAuthProvider';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('OAuth web and mobile flows', () => {
  let deps: UnitDeps;
  let google: FakeOAuthProvider;
  let start: StartOAuthUseCase;
  let complete: CompleteOAuthUseCase;
  let tokenSignIn: OAuthTokenSignInUseCase;
  const options = { callbackUrl: (provider: string) => `http://api.test/auth/oauth/${provider}/callback` };

  beforeEach(() => {
    deps = makeUnitDeps();
    google = new FakeOAuthProvider('google');

    const providers = new OAuthProviders({ google });
    const oauthSignIn = new OAuthSignInUseCase(deps.usersRepository, deps.authIdentitiesRepository, deps.startSession);

    start = new StartOAuthUseCase(providers, options);
    complete = new CompleteOAuthUseCase(providers, oauthSignIn, options);
    tokenSignIn = new OAuthTokenSignInUseCase(providers, oauthSignIn);
  });

  describe('StartOAuthUseCase', () => {
    it('builds the URL with S256 PKCE challenge, state, nonce and callback', () => {
      const { authorizationUrl, transaction, usesFormPost } = start.execute({ provider: 'google', redirectTo: '/dashboard' });
      const params = authorizationUrl.searchParams;

      expect(params.get('code_challenge'))
        .toBe(createHash('sha256').update(transaction.codeVerifier).digest('base64url'));
      expect(params.get('state')).toBe(transaction.state);
      expect(params.get('nonce')).toBe(transaction.nonce);
      expect(params.get('redirect_uri')).toBe('http://api.test/auth/oauth/google/callback');
      expect(transaction).toMatchObject({ provider: 'google', redirectTo: '/dashboard' });
      expect(transaction.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(usesFormPost).toBe(false);
    });

    it('generates fresh random values each time', () => {
      const a = start.execute({ provider: 'google', redirectTo: '/' }).transaction;
      const b = start.execute({ provider: 'google', redirectTo: '/' }).transaction;

      expect(new Set([a.state, a.nonce, a.codeVerifier, b.state, b.nonce, b.codeVerifier]).size).toBe(6);
    });

    it('rejects unknown or unconfigured providers', () => {
      expect(() => start.execute({ provider: 'apple', redirectTo: '/' })).toThrow(BadRequest);
      expect(() => start.execute({ provider: 'github', redirectTo: '/' })).toThrow(BadRequest);
    });
  });

  describe('CompleteOAuthUseCase', () => {
    it('exchanges the code with the stored verifier and nonce, then signs in', async () => {
      const { transaction } = start.execute({ provider: 'google', redirectTo: '/dashboard' });
      google.willAccept('good-code');

      const result = await complete.execute({
        provider: 'google',
        code: 'good-code',
        state: transaction.state,
        transaction,
        name: null,
        userAgent: null,
      });

      expect(result.redirectTo).toBe('/dashboard');
      expect(google.exchanges[0]).toEqual({
        code: 'good-code',
        codeVerifier: transaction.codeVerifier,
        nonce: transaction.nonce,
        redirectUri: 'http://api.test/auth/oauth/google/callback',
      });
      await expect(deps.accessTokenService.verify(result.session.accessToken)).resolves.toBeTruthy();
    });

    it('rejects a missing transaction, a state mismatch or a missing code', async () => {
      const { transaction } = start.execute({ provider: 'google', redirectTo: '/' });
      const base = { provider: 'google', code: 'c', state: transaction.state, transaction, name: null, userAgent: null };

      await expect(complete.execute({ ...base, transaction: null })).rejects.toBeInstanceOf(OAuthFailed);
      await expect(complete.execute({ ...base, state: 'forged' })).rejects.toBeInstanceOf(OAuthFailed);
      await expect(complete.execute({ ...base, code: undefined })).rejects.toBeInstanceOf(OAuthFailed);
      await expect(complete.execute({ ...base, transaction: { ...transaction, provider: 'apple' } }))
        .rejects.toBeInstanceOf(OAuthFailed);
      expect(google.exchanges).toHaveLength(0);
    });
  });

  describe('OAuthTokenSignInUseCase', () => {
    it('verifies the native id_token (with nonce) and signs in', async () => {
      google.willAccept('id-token');

      const session = await tokenSignIn.execute({ provider: 'google', idToken: 'id-token', nonce: 'raw', userAgent: null });

      expect(google.verifications[0]).toEqual({ idToken: 'id-token', nonce: 'raw' });
      await expect(deps.accessTokenService.verify(session.accessToken)).resolves.toBeTruthy();
    });

    it('propagates invalid tokens as OAuthFailed', async () => {
      await expect(tokenSignIn.execute({ provider: 'google', idToken: 'forged', userAgent: null }))
        .rejects.toBeInstanceOf(OAuthFailed);
    });
  });
});
