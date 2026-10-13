import type { OAuthProviders } from '#application/services/OAuthProviders';
import type { OAuthSignInUseCase } from '#application/usecases/auth/OAuthSignInUseCase';

/** Mobile flow: the app signs in natively and hands over the provider's id_token. */
export class OAuthTokenSignInUseCase {
  constructor(
    private readonly providers: OAuthProviders,
    private readonly oauthSignIn: OAuthSignInUseCase,
  ) {}

  async execute({ provider: providerName, idToken, nonce, name, userAgent }: OAuthTokenSignInUseCase.Input) {
    const provider = this.providers.get(providerName);
    const profile = await provider.verifyIdToken({ idToken, nonce });

    return this.oauthSignIn.execute({ provider: provider.name, profile, name, userAgent });
  }
}

export namespace OAuthTokenSignInUseCase {
  export type Input = {
    provider: string | undefined;
    idToken: string;
    nonce?: string;
    name?: string;
    userAgent: string | null;
  };
}
