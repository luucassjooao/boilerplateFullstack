import type { IOAuthProfile } from '#application/contracts/gateways/IOAuthProvider';
import type { IAuthIdentitiesRepository } from '#application/contracts/repositories/IAuthIdentitiesRepository';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { AuthIdentity } from '#application/entities/AuthIdentity';
import { User } from '#application/entities/User';
import { OAuthEmailNotVerified } from '#application/errors/application/OAuthEmailNotVerified';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import type { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';

/**
 * Account resolution for a validated social profile:
 * 1. known identity (provider + sub) → sign in;
 * 2. email not verified by the provider → OAUTH_EMAIL_NOT_VERIFIED;
 * 3. existing user with that email → link the identity and mark the email verified;
 * 4. otherwise → create user + identity.
 */
export class OAuthSignInUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly authIdentitiesRepository: IAuthIdentitiesRepository,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute({ provider, profile, name, userAgent }: OAuthSignInUseCase.Input): Promise<OAuthSignInUseCase.Output> {
    const identity = await this.authIdentitiesRepository.findByProviderUserId(provider, profile.providerUserId);

    if (identity) {
      return this.startSession.execute({ userId: identity.userId, userAgent });
    }

    if (!profile.email) {
      throw new OAuthFailed('The provider did not share an email');
    }

    if (!profile.emailVerified) {
      throw new OAuthEmailNotVerified();
    }

    const existing = await this.usersRepository.findByEmail(User.normalizeEmail(profile.email));

    if (existing) {
      existing.verifyEmail();
      await this.usersRepository.linkIdentity(existing, this.makeIdentity(existing.id, provider, profile));

      return this.startSession.execute({ userId: existing.id, userAgent });
    }

    const user = new User({
      // Apple sends the name only on the very first sign-in, and only to the client.
      name: (name?.trim() || profile.name?.trim() || profile.email.split('@')[0]!).slice(0, 100),
      email: profile.email,
      emailVerifiedAt: new Date(),
    });

    // ponytail: a concurrent sign-up with the same email surfaces as 409; retry with linkIdentity if it ever matters.
    await this.usersRepository.createWithIdentity(user, this.makeIdentity(user.id, provider, profile));

    return this.startSession.execute({ userId: user.id, userAgent });
  }

  private makeIdentity(userId: string, provider: AuthIdentity.Provider, profile: IOAuthProfile): AuthIdentity {
    return new AuthIdentity({ userId, provider, providerUserId: profile.providerUserId, email: profile.email });
  }
}

export namespace OAuthSignInUseCase {
  export type Input = {
    provider: AuthIdentity.Provider;
    profile: IOAuthProfile;
    name?: string | null;
    userAgent: string | null;
  };

  export type Output = StartSessionUseCase.Output;
}
