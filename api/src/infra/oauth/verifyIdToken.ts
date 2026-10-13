import { errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';

/** Signature (JWKS), iss, aud, exp and nonce. Any validation failure becomes OAuthFailed. */
export async function verifyIdToken({
  idToken,
  jwks,
  issuer,
  audience,
  expectedNonce,
}: verifyIdToken.Input): Promise<JWTPayload & { sub: string }> {
  let payload: JWTPayload;

  try {
    ({ payload } = await jwtVerify(idToken, jwks, { issuer, audience, algorithms: ['RS256'] }));
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      throw new OAuthFailed(`Invalid id_token: ${error.code}`);
    }

    throw error;
  }

  if (expectedNonce !== undefined && payload.nonce !== expectedNonce) {
    throw new OAuthFailed('Invalid id_token: nonce mismatch');
  }

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new OAuthFailed('Invalid id_token: missing sub');
  }

  return payload as JWTPayload & { sub: string };
}

export namespace verifyIdToken {
  export type Input = {
    idToken: string;
    jwks: JWTVerifyGetKey;
    issuer: string | string[];
    audience: string[];
    expectedNonce?: string;
  };
}
