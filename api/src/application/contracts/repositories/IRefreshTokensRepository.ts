import type { RefreshToken } from '#application/entities/RefreshToken';

export interface IRefreshTokensRepository {
  create(token: RefreshToken): Promise<void>;
  /**
   * Atomically marks the token as used, only if it is neither used nor revoked.
   * Returns the token when this call consumed it, null otherwise.
   * Two concurrent calls with the same hash: exactly one gets the token.
   */
  consume(tokenHash: string, now: Date): Promise<RefreshToken | null>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeFamily(familyId: string, now: Date): Promise<void>;
  revokeAllByUserId(userId: string, now: Date): Promise<void>;
}
