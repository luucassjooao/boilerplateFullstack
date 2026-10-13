import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from 'jose';

/** A local OIDC "provider": RS256 key pair, its JWKS and an id_token signer. */
export async function makeOidcTestKit(issuer: string) {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
  const jwks = createLocalJWKSet({ keys: [jwk] });

  async function signIdToken(claims: JWTPayload & { aud: string | string[] }, options: { expiresIn?: string; key?: Parameters<SignJWT['sign']>[0] } = {}) {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(claims.iss ?? issuer)
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? '5m')
      .sign(options.key ?? privateKey);
  }

  return { jwks, signIdToken };
}

/** A fake token endpoint for openid-client's customFetch. */
export function tokenEndpoint(idToken: string, requests: URLSearchParams[]) {
  return async (_url: string, options: { body?: unknown }) => {
    requests.push(new URLSearchParams(String(options.body)));

    return new Response(JSON.stringify({ access_token: 'at', token_type: 'Bearer', expires_in: 3600, id_token: idToken }), {
      headers: { 'content-type': 'application/json' },
    });
  };
}
