import { and, eq, isNull } from 'drizzle-orm';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import type { RefreshToken } from '#application/entities/RefreshToken';
import type { DrizzleDatabase } from '#infra/database/drizzle/client';
import { RefreshTokenMapper } from '#infra/database/drizzle/mappers/RefreshTokenMapper';
import { refreshTokens } from '#infra/database/drizzle/schema/index';

export class DrizzleRefreshTokensRepository implements IRefreshTokensRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  async create(token: RefreshToken): Promise<void> {
    await this.db.insert(refreshTokens).values(RefreshTokenMapper.toPersistence(token));
  }

  async consume(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    // Single conditional UPDATE: Postgres row locking makes concurrent calls mutually exclusive.
    const [row] = await this.db
      .update(refreshTokens)
      .set({ usedAt: now })
      .where(and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.usedAt),
        isNull(refreshTokens.revokedAt),
      ))
      .returning();

    return row ? RefreshTokenMapper.toEntity(row) : null;
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1);

    return row ? RefreshTokenMapper.toEntity(row) : null;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));
  }

  async revokeAllByUserId(userId: string, now: Date): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }
}
