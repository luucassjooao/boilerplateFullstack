import { createHash } from 'node:crypto';
import { createRemoteJWKSet, importPKCS8, type JWTVerifyGetKey, SignJWT } from 'jose';
import * as client from 'openid-client';
import type { IOAuthProfile, IOAuthProvider } from '#application/contracts/gateways/IOAuthProvider';
import { exchangeAuthorizationCode } from '#infra/oauth/exchangeAuthorizationCode';
import { verifyIdToken } from '#infra/oauth/verifyIdToken';

const APPLE = {
  issuer: 'https://appleid.apple.com',
  authorization_endpoint: 'https://appleid.apple.com/auth/authorize',
  token_endpoint: 'https://appleid.apple.com/auth/token',
  jwks_uri: 'https://appleid.apple.com/auth/keys',
};

/**
 * Nonce convention (same for web and mobile): Apple receives SHA-256(raw nonce) and signs that value
 * into the id_token; the API receives the raw nonce and compares hashes.
 */
export class AppleOAuthProvider implements IOAuthProvider {
  readonly name = 'apple';
  readonly usesFormPost = true;

  private readonly jwks: JWTVerifyGetKey;

  constructor(private readonly options: AppleOAuthProvider.Options) {
    this.jwks = options.jwks ?? createRemoteJWKSet(new URL(APPLE.jwks_uri));
  }

  getAuthorizationUrl({ state, codeChallenge, nonce, redirectUri }: IOAuthProvider.AuthorizationUrlInput): URL {
    return client.buildAuthorizationUrl(this.makeConfig(), {
      redirect_uri: redirectUri,
      response_type: 'code',
      // Requesting name/email requires response_mode=form_post.
      response_mode: 'form_post',
      scope: 'name email',
      state,
      nonce: sha256(nonce),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
  }

  async exchangeCode({ code, codeVerifier, nonce, redirectUri }: IOAuthProvider.ExchangeCodeInput): Promise<IOAuthProfile> {
    const config = this.makeConfig(await this.makeClientSecret());
    const idToken = await exchangeAuthorizationCode({ config, code, codeVerifier, expectedNonce: sha256(nonce), redirectUri });

    return this.verifyIdToken({ idToken, nonce });
  }

  async verifyIdToken({ idToken, nonce }: IOAuthProvider.VerifyIdTokenInput): Promise<IOAuthProfile> {
    const payload = await verifyIdToken({
      idToken,
      jwks: this.jwks,
      issuer: APPLE.issuer,
      audience: [this.options.servicesId, ...this.options.bundleIds],
      expectedNonce: nonce === undefined ? undefined : sha256(nonce),
    });

    return {
      providerUserId: payload.sub,
      // May be a private relay address (@privaterelay.appleid.com): treated as a regular email.
      email: typeof payload.email === 'string' ? payload.email : null,
      // Apple sends either a boolean or the string "true".
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      // Never in the id_token: only in the first form_post (`user`) or from the native SDK.
      name: null,
    };
  }

  private makeConfig(clientSecret?: string): client.Configuration {
    const config = new client.Configuration(APPLE, this.options.servicesId, undefined, client.ClientSecretPost(clientSecret));

    if (this.options.customFetch) {
      config[client.customFetch] = this.options.customFetch;
    }

    return config;
  }

  /** Apple's client_secret is a short-lived ES256 JWT signed with the .p8 key. */
  private async makeClientSecret(): Promise<string> {
    const key = await importPKCS8(this.options.privateKey, 'ES256');

    return new SignJWT()
      .setProtectedHeader({ alg: 'ES256', kid: this.options.keyId })
      .setIssuer(this.options.teamId)
      .setSubject(this.options.servicesId)
      .setAudience(APPLE.issuer)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export namespace AppleOAuthProvider {
  export type Options = {
    /** Services ID: web client_id and accepted id_token audience. */
    servicesId: string;
    teamId: string;
    keyId: string;
    /** Contents of the .p8 key (PKCS#8 PEM). */
    privateKey: string;
    /** iOS bundle IDs, accepted as id_token audience for native sign-in. */
    bundleIds: string[];
    jwks?: JWTVerifyGetKey;
    customFetch?: client.CustomFetch;
  };
}
