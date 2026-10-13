import { RefreshToken } from '#application/entities/RefreshToken';
import type { refreshTokens } from '#infra/database/drizzle/schema/index';

export class RefreshTokenMapper {
  static toEntity(row: typeof refreshTokens.$inferSelect): RefreshToken {
    return new RefreshToken(row);
  }

  static toPersistence(token: RefreshToken): typeof refreshTokens.$inferInsert {
    return {
      id: token.id,
      userId: token.userId,
      familyId: token.familyId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
      userAgent: token.userAgent,
    };
  }
}
