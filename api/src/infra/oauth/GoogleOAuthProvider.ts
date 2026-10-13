import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import * as client from 'openid-client';
import type { IOAuthProfile, IOAuthProvider } from '#application/contracts/gateways/IOAuthProvider';
import { exchangeAuthorizationCode } from '#infra/oauth/exchangeAuthorizationCode';
import { verifyIdToken } from '#infra/oauth/verifyIdToken';

/** Static metadata (no discovery round-trip at boot). */
const GOOGLE = {
  issuer: 'https://accounts.google.com',
  authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  token_endpoint: 'https://oauth2.googleapis.com/token',
  jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
};

export class GoogleOAuthProvider implements IOAuthProvider {
  readonly name = 'google';
  readonly usesFormPost = false;

  private readonly config: client.Configuration;
  private readonly jwks: JWTVerifyGetKey;

  constructor(private readonly options: GoogleOAuthProvider.Options) {
    this.config = new client.Configuration(GOOGLE, options.clientId, undefined, client.ClientSecretPost(options.clientSecret));
    this.jwks = options.jwks ?? createRemoteJWKSet(new URL(GOOGLE.jwks_uri));

    if (options.customFetch) {
      this.config[client.customFetch] = options.customFetch;
    }
  }

  getAuthorizationUrl({ state, codeChallenge, nonce, redirectUri }: IOAuthProvider.AuthorizationUrlInput): URL {
    return client.buildAuthorizationUrl(this.config, {
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
  }

  async exchangeCode({ code, codeVerifier, nonce, redirectUri }: IOAuthProvider.ExchangeCodeInput): Promise<IOAuthProfile> {
    const idToken = await exchangeAuthorizationCode({ config: this.config, code, codeVerifier, expectedNonce: nonce, redirectUri });

    return this.verifyIdToken({ idToken, nonce });
  }

  async verifyIdToken({ idToken, nonce }: IOAuthProvider.VerifyIdTokenInput): Promise<IOAuthProfile> {
    const payload = await verifyIdToken({
      idToken,
      jwks: this.jwks,
      // Google issues both forms.
      issuer: [GOOGLE.issuer, 'accounts.google.com'],
      audience: [this.options.clientId, ...this.options.mobileClientIds],
      expectedNonce: nonce,
    });

    return {
      providerUserId: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === 'string' ? payload.name : null,
    };
  }
}

export namespace GoogleOAuthProvider {
  export type Options = {
    /** Web client: used for the redirect flow and accepted as id_token audience. */
    clientId: string;
    clientSecret: string;
    /** iOS/Android client IDs, also accepted as id_token audience. */
    mobileClientIds: string[];
    /** Tests inject a local JWKS / fetch. */
    jwks?: JWTVerifyGetKey;
    customFetch?: client.CustomFetch;
  };
}
