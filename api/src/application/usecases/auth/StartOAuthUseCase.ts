import { createHash, randomBytes } from 'node:crypto';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import type { OAuthProviders } from '#application/services/OAuthProviders';

/** Web flow, step 1: authorization URL (PKCE S256 + state + nonce) and the transaction to keep in a cookie. */
export class StartOAuthUseCase {
  constructor(
    private readonly providers: OAuthProviders,
    private readonly options: StartOAuthUseCase.Options,
  ) {}

  execute({ provider: providerName, redirectTo }: StartOAuthUseCase.Input): StartOAuthUseCase.Output {
    const provider = this.providers.get(providerName);
    const transaction: StartOAuthUseCase.Transaction = {
      provider: provider.name,
      state: random(),
      codeVerifier: random(),
      nonce: random(),
      redirectTo,
    };

    const authorizationUrl = provider.getAuthorizationUrl({
      state: transaction.state,
      codeChallenge: createHash('sha256').update(transaction.codeVerifier).digest('base64url'),
      nonce: transaction.nonce,
      redirectUri: this.options.callbackUrl(provider.name),
    });

    return { authorizationUrl, transaction, usesFormPost: provider.usesFormPost };
  }
}

function random(): string {
  return randomBytes(32).toString('base64url');
}

export namespace StartOAuthUseCase {
  export type Options = { callbackUrl: (provider: AuthIdentity.Provider) => string };

  export type Input = {
    provider: string | undefined;
    redirectTo: string;
  };

  export type Transaction = {
    provider: AuthIdentity.Provider;
    state: string;
    codeVerifier: string;
    nonce: string;
    redirectTo: string;
  };

  export type Output = {
    authorizationUrl: URL;
    transaction: Transaction;
    usesFormPost: boolean;
  };
}
