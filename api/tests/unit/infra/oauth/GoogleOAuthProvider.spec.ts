import { generateKeyPair } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import { GoogleOAuthProvider } from '#infra/oauth/GoogleOAuthProvider';
import { makeOidcTestKit, tokenEndpoint } from '#tests/unit/infra/oauth/oidcTestKit';

const ISSUER = 'https://accounts.google.com';

describe('GoogleOAuthProvider', () => {
  let kit: Awaited<ReturnType<typeof makeOidcTestKit>>;
  let requests: URLSearchParams[];

  function makeProvider(idTokenForExchange = '') {
    return new GoogleOAuthProvider({
      clientId: 'web-client',
      clientSecret: 'web-secret',
      mobileClientIds: ['ios-client', 'android-client'],
      jwks: kit.jwks,
      customFetch: tokenEndpoint(idTokenForExchange, requests),
    });
  }

  beforeEach(async () => {
    kit = await makeOidcTestKit(ISSUER);
    requests = [];
  });

  it('maps a valid id_token to a profile', async () => {
    const idToken = await kit.signIdToken({ sub: 'g-1', aud: 'web-client', email: 'ada@gmail.com', email_verified: true, name: 'Ada' });

    await expect(makeProvider().verifyIdToken({ idToken })).resolves.toEqual({
      providerUserId: 'g-1',
      email: 'ada@gmail.com',
      emailVerified: true,
      name: 'Ada',
    });
  });

  it('accepts mobile client ids as audience and the short issuer form', async () => {
    const idToken = await kit.signIdToken({ sub: 'g-1', aud: 'android-client', iss: 'accounts.google.com' });

    await expect(makeProvider().verifyIdToken({ idToken })).resolves.toMatchObject({ providerUserId: 'g-1', emailVerified: false });
  });

  it.each([
    ['wrong audience', { sub: 'g-1', aud: 'someone-else' }, {}],
    ['wrong issuer', { sub: 'g-1', aud: 'web-client', iss: 'https://evil.example' }, {}],
    ['expired', { sub: 'g-1', aud: 'web-client' }, { expiresIn: '-1m' }],
  ])('rejects tokens with %s', async (_case, claims, options) => {
    const idToken = await kit.signIdToken(claims, options);

    await expect(makeProvider().verifyIdToken({ idToken })).rejects.toBeInstanceOf(OAuthFailed);
  });

  it('rejects tokens signed by a key outside the JWKS', async () => {
    const { privateKey } = await generateKeyPair('RS256');
    const idToken = await kit.signIdToken({ sub: 'g-1', aud: 'web-client' }, { key: privateKey });

    await expect(makeProvider().verifyIdToken({ idToken })).rejects.toBeInstanceOf(OAuthFailed);
  });

  it('checks the nonce when given', async () => {
    const idToken = await kit.signIdToken({ sub: 'g-1', aud: 'web-client', nonce: 'n-1' });

    await expect(makeProvider().verifyIdToken({ idToken, nonce: 'n-1' })).resolves.toBeDefined();
    await expect(makeProvider().verifyIdToken({ idToken, nonce: 'other' })).rejects.toBeInstanceOf(OAuthFailed);
  });

  it('builds the authorization URL with PKCE, state and nonce', () => {
    const url = makeProvider().getAuthorizationUrl({
      state: 's',
      codeChallenge: 'cc',
      nonce: 'n',
      redirectUri: 'http://api.test/auth/oauth/google/callback',
    });

    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: 'web-client',
      response_type: 'code',
      scope: 'openid email profile',
      state: 's',
      nonce: 'n',
      code_challenge: 'cc',
      code_challenge_method: 'S256',
      redirect_uri: 'http://api.test/auth/oauth/google/callback',
    });
  });

  it('exchanges the code with the PKCE verifier and validates the returned id_token', async () => {
    const idToken = await kit.signIdToken({ sub: 'g-1', aud: 'web-client', nonce: 'n-1', email: 'a@b.c', email_verified: true });

    const profile = await makeProvider(idToken).exchangeCode({
      code: 'auth-code',
      codeVerifier: 'verifier',
      nonce: 'n-1',
      redirectUri: 'http://api.test/auth/oauth/google/callback',
    });

    expect(profile).toMatchObject({ providerUserId: 'g-1', email: 'a@b.c' });
    expect(Object.fromEntries(requests[0]!)).toMatchObject({
      grant_type: 'authorization_code',
      code: 'auth-code',
      code_verifier: 'verifier',
      redirect_uri: 'http://api.test/auth/oauth/google/callback',
      client_id: 'web-client',
      client_secret: 'web-secret',
    });
  });

  it('rejects an exchanged id_token whose nonce does not match', async () => {
    const idToken = await kit.signIdToken({ sub: 'g-1', aud: 'web-client', nonce: 'other' });

    await expect(makeProvider(idToken).exchangeCode({
      code: 'auth-code',
      codeVerifier: 'verifier',
      nonce: 'n-1',
      redirectUri: 'http://api.test/cb',
    })).rejects.toBeInstanceOf(OAuthFailed);
  });
});
