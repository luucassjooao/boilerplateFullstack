import * as client from 'openid-client';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';

const OAUTH_ERRORS = [
  client.ClientError,
  client.ResponseBodyError,
  client.AuthorizationResponseError,
  client.WWWAuthenticateChallengeError,
];

/**
 * Authorization code grant with PKCE via openid-client. Returns the raw id_token;
 * the caller still verifies its signature with the provider JWKS.
 * Protocol errors become OAuthFailed; network errors bubble up as 500.
 */
export async function exchangeAuthorizationCode({
  config,
  code,
  codeVerifier,
  expectedNonce,
  redirectUri,
}: exchangeAuthorizationCode.Input): Promise<string> {
  const callbackUrl = new URL(redirectUri);

  callbackUrl.searchParams.set('code', code);

  try {
    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce,
      idTokenExpected: true,
    });

    return tokens.id_token!;
  } catch (error) {
    if (OAUTH_ERRORS.some((ErrorClass) => error instanceof ErrorClass)) {
      throw new OAuthFailed(`Code exchange failed: ${(error as Error).message}`);
    }

    throw error;
  }
}

export namespace exchangeAuthorizationCode {
  export type Input = {
    config: client.Configuration;
    code: string;
    codeVerifier: string;
    expectedNonce: string;
    redirectUri: string;
  };
}
