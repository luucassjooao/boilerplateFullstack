import { createHash } from 'node:crypto';
import { decodeProtectedHeader, exportPKCS8, generateKeyPair, importSPKI, jwtVerify, exportSPKI } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import { AppleOAuthProvider } from '#infra/oauth/AppleOAuthProvider';
import { makeOidcTestKit, tokenEndpoint } from '#tests/unit/infra/oauth/oidcTestKit';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('AppleOAuthProvider', () => {
  let kit: Awaited<ReturnType<typeof makeOidcTestKit>>;
  let requests: URLSearchParams[];
  let p8: string;
  let p8PublicKey: string;

  function makeProvider(idTokenForExchange = '') {
    return new AppleOAuthProvider({
      servicesId: 'com.example.web',
      teamId: 'TEAM123',
      keyId: 'KEY123',
      privateKey: p8,
      bundleIds: ['com.example.app'],
      jwks: kit.jwks,
      customFetch: tokenEndpoint(idTokenForExchange, requests),
    });
  }

  beforeEach(async () => {
    kit = await makeOidcTestKit('https://appleid.apple.com');
    requests = [];

    const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });

    p8 = await exportPKCS8(privateKey);
    p8PublicKey = await exportSPKI(publicKey);
  });

  it('accepts the bundle id as audience and compares SHA-256 of the raw nonce', async () => {
    const idToken = await kit.signIdToken({
      sub: 'apple-1',
      aud: 'com.example.app',
      nonce: sha256('raw-nonce'),
      email: 'x@privaterelay.appleid.com',
      email_verified: 'true',
    });

    await expect(makeProvider().verifyIdToken({ idToken, nonce: 'raw-nonce' })).resolves.toEqual({
      providerUserId: 'apple-1',
      email: 'x@privaterelay.appleid.com',
      emailVerified: true,
      name: null,
    });
    await expect(makeProvider().verifyIdToken({ idToken, nonce: sha256('raw-nonce') })).rejects.toBeInstanceOf(OAuthFailed);
  });

  it('rejects other audiences', async () => {
    const idToken = await kit.signIdToken({ sub: 'apple-1', aud: 'com.other.app' });

    await expect(makeProvider().verifyIdToken({ idToken })).rejects.toBeInstanceOf(OAuthFailed);
  });

  it('asks for form_post with name/email scope and sends the hashed nonce', () => {
    const url = makeProvider().getAuthorizationUrl({ state: 's', codeChallenge: 'cc', nonce: 'raw', redirectUri: 'https://api.test/cb' });

    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: 'com.example.web',
      response_mode: 'form_post',
      scope: 'name email',
      nonce: sha256('raw'),
    });
  });

  it('exchanges the code using an ES256 client_secret signed with the .p8 key', async () => {
    const idToken = await kit.signIdToken({ sub: 'apple-1', aud: 'com.example.web', nonce: sha256('raw'), email: 'a@b.c', email_verified: true });

    const profile = await makeProvider(idToken).exchangeCode({ code: 'c', codeVerifier: 'v', nonce: 'raw', redirectUri: 'https://api.test/cb' });

    expect(profile).toMatchObject({ providerUserId: 'apple-1', emailVerified: true });

    const clientSecret = requests[0]!.get('client_secret')!;
    const { payload } = await jwtVerify(clientSecret, await importSPKI(p8PublicKey, 'ES256'), {
      issuer: 'TEAM123',
      audience: 'https://appleid.apple.com',
      subject: 'com.example.web',
    });

    expect(decodeProtectedHeader(clientSecret)).toMatchObject({ alg: 'ES256', kid: 'KEY123' });
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(300);
  });
});
