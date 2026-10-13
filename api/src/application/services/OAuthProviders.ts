import type { IOAuthProvider } from '#application/contracts/gateways/IOAuthProvider';
import { AuthIdentity } from '#application/entities/AuthIdentity';
import { BadRequest } from '#application/errors/http/BadRequest';

/** The configured providers. A provider without credentials is simply absent. */
export class OAuthProviders {
  constructor(private readonly providers: Partial<Record<AuthIdentity.Provider, IOAuthProvider>>) {}

  get(name: string | undefined): IOAuthProvider {
    const provider = AuthIdentity.providers.find((item) => item === name);
    const instance = provider && this.providers[provider];

    if (!instance) {
      throw new BadRequest(`OAuth provider "${name}" is not available`);
    }

    return instance;
  }
}
