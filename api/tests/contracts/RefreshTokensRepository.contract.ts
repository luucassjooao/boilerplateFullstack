import { beforeEach, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { makeRefreshToken } from '#tests/factories/makeRefreshToken';
import { makeUser } from '#tests/factories/makeUser';
import type { MakeRepositories, Repositories } from '#tests/contracts/Repositories';

export function runRefreshTokensRepositoryContract(makeRepositories: MakeRepositories) {
  describe('IRefreshTokensRepository contract', () => {
    let repos: Repositories;
    const now = new Date('2026-03-01T12:00:00Z');
    const user = makeUser();

    beforeEach(async () => {
      repos = await makeRepositories();
      await repos.users.create(user);
    });

    it('creates and finds by hash', async () => {
      const token = makeRefreshToken({ userId: user.id, userAgent: 'vitest' });

      await repos.refreshTokens.create(token);

      await expect(repos.refreshTokens.findByHash(token.tokenHash)).resolves.toEqual(token);
      await expect(repos.refreshTokens.findByHash('missing')).resolves.toBeNull();
    });

    it('consume marks as used once', async () => {
      const token = makeRefreshToken({ userId: user.id });
      await repos.refreshTokens.create(token);

      const consumed = await repos.refreshTokens.consume(token.tokenHash, now);

      expect(consumed?.id).toBe(token.id);
      expect(consumed?.usedAt).toEqual(now);
      await expect(repos.refreshTokens.consume(token.tokenHash, now)).resolves.toBeNull();
      expect((await repos.refreshTokens.findByHash(token.tokenHash))?.usedAt).toEqual(now);
    });

    it('consume is atomic: of two concurrent calls only one gets the token', async () => {
      const token = makeRefreshToken({ userId: user.id });
      await repos.refreshTokens.create(token);

      const results = await Promise.all([
        repos.refreshTokens.consume(token.tokenHash, now),
        repos.refreshTokens.consume(token.tokenHash, now),
      ]);

      expect(results.filter(Boolean)).toHaveLength(1);
    });

    it('consume ignores revoked tokens', async () => {
      const token = makeRefreshToken({ userId: user.id });
      await repos.refreshTokens.create(token);
      await repos.refreshTokens.revokeFamily(token.familyId, now);

      await expect(repos.refreshTokens.consume(token.tokenHash, now)).resolves.toBeNull();
    });

    it('revokeFamily revokes only that family', async () => {
      const familyId = uuidv7();
      const a = makeRefreshToken({ userId: user.id, familyId });
      const b = makeRefreshToken({ userId: user.id, familyId });
      const other = makeRefreshToken({ userId: user.id });

      for (const token of [a, b, other]) {
        await repos.refreshTokens.create(token);
      }

      await repos.refreshTokens.revokeFamily(familyId, now);

      expect((await repos.refreshTokens.findByHash(a.tokenHash))?.revokedAt).toEqual(now);
      expect((await repos.refreshTokens.findByHash(b.tokenHash))?.revokedAt).toEqual(now);
      expect((await repos.refreshTokens.findByHash(other.tokenHash))?.revokedAt).toBeNull();
    });

    it('revokeAllByUserId revokes every family of the user only', async () => {
      const otherUser = makeUser();
      await repos.users.create(otherUser);
      const mine = [makeRefreshToken({ userId: user.id }), makeRefreshToken({ userId: user.id })];
      const theirs = makeRefreshToken({ userId: otherUser.id });

      for (const token of [...mine, theirs]) {
        await repos.refreshTokens.create(token);
      }

      await repos.refreshTokens.revokeAllByUserId(user.id, now);

      for (const token of mine) {
        expect((await repos.refreshTokens.findByHash(token.tokenHash))?.revokedAt).toEqual(now);
      }
      expect((await repos.refreshTokens.findByHash(theirs.tokenHash))?.revokedAt).toBeNull();
    });
  });
}
