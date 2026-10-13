import type { IAuthIdentitiesRepository } from '#application/contracts/repositories/IAuthIdentitiesRepository';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';

export class InMemoryAuthIdentitiesRepository implements IAuthIdentitiesRepository {
  constructor(private readonly database: InMemoryDatabase) {}

  async findByProviderUserId(provider: AuthIdentity.Provider, providerUserId: string): Promise<AuthIdentity | null> {
    const identity = this.database.authIdentities.find(
      (item) => item.provider === provider && item.providerUserId === providerUserId,
    );

    return identity ? InMemoryDatabase.copy(identity) : null;
  }

  async listByUserId(userId: string): Promise<AuthIdentity[]> {
    return this.database.authIdentities
      .filter((item) => item.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(InMemoryDatabase.copy);
  }
}
