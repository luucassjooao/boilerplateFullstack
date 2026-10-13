import { randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { RefreshToken } from '#application/entities/RefreshToken';

export function makeRefreshToken(override: Partial<RefreshToken.Attributes> & { userId: string }): RefreshToken {
  return new RefreshToken({
    familyId: uuidv7(),
    tokenHash: randomUUID(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...override,
  });
}
