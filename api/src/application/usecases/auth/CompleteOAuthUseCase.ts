import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import type { OAuthProviders } from '#application/services/OAuthProviders';
import type { OAuthSignInUseCase } from '#application/usecases/auth/OAuthSignInUseCase';
import type { StartOAuthUseCase } from '#application/usecases/auth/StartOAuthUseCase';

/** Web flow, step 2: checks state, exchanges the code (with the PKCE verifier) and signs in. */
export class CompleteOAuthUseCase {
  constructor(
    private readonly providers: OAuthProviders,
    private readonly oauthSignIn: OAuthSignInUseCase,
    private readonly options: StartOAuthUseCase.Options,
  ) {}

  async execute({
    provider: providerName,
    code,
    state,
    transaction,
    name,
    userAgent,
  }: CompleteOAuthUseCase.Input): Promise<CompleteOAuthUseCase.Output> {
    const provider = this.providers.get(providerName);

    if (!transaction || transaction.provider !== provider.name || !state || state !== transaction.state || !code) {
      throw new OAuthFailed();
    }

    const profile = await provider.exchangeCode({
      code,
      codeVerifier: transaction.codeVerifier,
      nonce: transaction.nonce,
      redirectUri: this.options.callbackUrl(provider.name),
    });

    const session = await this.oauthSignIn.execute({ provider: provider.name, profile, name, userAgent });

    return { session, redirectTo: transaction.redirectTo };
  }
}

export namespace CompleteOAuthUseCase {
  export type Input = {
    provider: string | undefined;
    code: string | undefined;
    state: string | undefined;
    transaction: StartOAuthUseCase.Transaction | null;
    name: string | null;
    userAgent: string | null;
  };

  export type Output = {
    session: OAuthSignInUseCase.Output;
    redirectTo: string;
  };
}
