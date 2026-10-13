import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import { RefreshToken } from '#application/entities/RefreshToken';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';

export class InMemoryRefreshTokensRepository implements IRefreshTokensRepository {
  constructor(private readonly database: InMemoryDatabase) {}

  async create(token: RefreshToken): Promise<void> {
    this.database.refreshTokens.push(InMemoryDatabase.copy(token));
  }

  async consume(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    // Check-and-set without awaiting in between: atomic on the single JS thread.
    const index = this.database.refreshTokens.findIndex(
      (item) => item.tokenHash === tokenHash && !item.usedAt && !item.revokedAt,
    );
    const token = this.database.refreshTokens[index];

    if (!token) {
      return null;
    }

    const consumed = new RefreshToken({ ...token, usedAt: now });

    this.database.refreshTokens[index] = consumed;

    return InMemoryDatabase.copy(consumed);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const token = this.database.refreshTokens.find((item) => item.tokenHash === tokenHash);

    return token ? InMemoryDatabase.copy(token) : null;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    this.revokeWhere((item) => item.familyId === familyId, now);
  }

  async revokeAllByUserId(userId: string, now: Date): Promise<void> {
    this.revokeWhere((item) => item.userId === userId, now);
  }

  private revokeWhere(predicate: (token: RefreshToken) => boolean, now: Date): void {
    this.database.refreshTokens = this.database.refreshTokens.map((item) => (
      predicate(item) && !item.revokedAt ? new RefreshToken({ ...item, revokedAt: now }) : item
    ));
  }
}
