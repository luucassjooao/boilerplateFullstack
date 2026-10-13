import { and, asc, eq } from 'drizzle-orm';
import type { IAuthIdentitiesRepository } from '#application/contracts/repositories/IAuthIdentitiesRepository';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import type { DrizzleDatabase } from '#infra/database/drizzle/client';
import { AuthIdentityMapper } from '#infra/database/drizzle/mappers/AuthIdentityMapper';
import { authIdentities } from '#infra/database/drizzle/schema/index';

export class DrizzleAuthIdentitiesRepository implements IAuthIdentitiesRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  async findByProviderUserId(provider: AuthIdentity.Provider, providerUserId: string): Promise<AuthIdentity | null> {
    const [row] = await this.db
      .select()
      .from(authIdentities)
      .where(and(eq(authIdentities.provider, provider), eq(authIdentities.providerUserId, providerUserId)))
      .limit(1);

    return row ? AuthIdentityMapper.toEntity(row) : null;
  }

  async listByUserId(userId: string): Promise<AuthIdentity[]> {
    const rows = await this.db
      .select()
      .from(authIdentities)
      .where(eq(authIdentities.userId, userId))
      .orderBy(asc(authIdentities.createdAt));

    return rows.map(AuthIdentityMapper.toEntity);
  }
}
