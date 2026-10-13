import { AuthIdentity } from '#application/entities/AuthIdentity';
import type { authIdentities } from '#infra/database/drizzle/schema/index';

export class AuthIdentityMapper {
  static toEntity(row: typeof authIdentities.$inferSelect): AuthIdentity {
    return new AuthIdentity(row);
  }

  static toPersistence(identity: AuthIdentity): typeof authIdentities.$inferInsert {
    return {
      id: identity.id,
      userId: identity.userId,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
      createdAt: identity.createdAt,
    };
  }
}
