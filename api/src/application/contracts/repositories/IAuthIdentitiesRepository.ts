import type { AuthIdentity } from '#application/entities/AuthIdentity';

/** Identities are written through IUsersRepository (createWithIdentity / linkIdentity). */
export interface IAuthIdentitiesRepository {
  findByProviderUserId(provider: AuthIdentity.Provider, providerUserId: string): Promise<AuthIdentity | null>;
  listByUserId(userId: string): Promise<AuthIdentity[]>;
}
