import type { IOAuthProfile, IOAuthProvider } from '#application/contracts/gateways/IOAuthProvider';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';

/** Maps authorization codes / id_tokens to profiles; anything unknown is rejected like an invalid token. */
export class FakeOAuthProvider implements IOAuthProvider {
  readonly exchanges: IOAuthProvider.ExchangeCodeInput[] = [];
  readonly verifications: IOAuthProvider.VerifyIdTokenInput[] = [];
  private readonly profiles = new Map<string, IOAuthProfile>();

  constructor(
    readonly name: AuthIdentity.Provider,
    readonly usesFormPost = false,
  ) {}

  willAccept(codeOrIdToken: string, profile: Partial<IOAuthProfile> = {}): IOAuthProfile {
    const full: IOAuthProfile = {
      providerUserId: `${this.name}-sub-${codeOrIdToken}`,
      email: `${codeOrIdToken}@example.com`,
      emailVerified: true,
      name: null,
      ...profile,
    };

    this.profiles.set(codeOrIdToken, full);

    return full;
  }

  getAuthorizationUrl({ state, codeChallenge, nonce, redirectUri }: IOAuthProvider.AuthorizationUrlInput): URL {
    const url = new URL(`https://${this.name}.example/authorize`);

    url.search = new URLSearchParams({ state, code_challenge: codeChallenge, nonce, redirect_uri: redirectUri }).toString();

    return url;
  }

  async exchangeCode(input: IOAuthProvider.ExchangeCodeInput): Promise<IOAuthProfile> {
    this.exchanges.push(input);

    return this.resolve(input.code);
  }

  async verifyIdToken(input: IOAuthProvider.VerifyIdTokenInput): Promise<IOAuthProfile> {
    this.verifications.push(input);

    return this.resolve(input.idToken);
  }

  private resolve(key: string): IOAuthProfile {
    const profile = this.profiles.get(key);

    if (!profile) {
      throw new OAuthFailed();
    }

    return profile;
  }
}
