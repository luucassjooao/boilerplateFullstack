import { beforeEach, describe, expect, it } from 'vitest';
import { EmailAlreadyInUse } from '#application/errors/application/EmailAlreadyInUse';
import { makeAuthIdentity } from '#tests/factories/makeAuthIdentity';
import { makeRefreshToken } from '#tests/factories/makeRefreshToken';
import { makeUser } from '#tests/factories/makeUser';
import { makeVerificationCode } from '#tests/factories/makeVerificationCode';
import type { MakeRepositories, Repositories } from '#tests/contracts/Repositories';

export function runUsersRepositoryContract(makeRepositories: MakeRepositories) {
  describe('IUsersRepository contract', () => {
    let repos: Repositories;

    beforeEach(async () => {
      repos = await makeRepositories();
    });

    it('creates and finds by id and by email', async () => {
      const user = makeUser({ email: 'ada@example.com', emailVerifiedAt: null });

      await repos.users.create(user);

      await expect(repos.users.findById(user.id)).resolves.toEqual(user);
      await expect(repos.users.findByEmail('ada@example.com')).resolves.toEqual(user);
      await expect(repos.users.findByEmail('other@example.com')).resolves.toBeNull();
    });

    it('enforces unique email', async () => {
      await repos.users.create(makeUser({ email: 'ada@example.com' }));

      await expect(repos.users.create(makeUser({ email: 'ada@example.com' })))
        .rejects.toBeInstanceOf(EmailAlreadyInUse);
    });

    it('enforces unique email under concurrency', async () => {
      const results = await Promise.allSettled([
        repos.users.create(makeUser({ email: 'ada@example.com' })),
        repos.users.create(makeUser({ email: 'ada@example.com' })),
      ]);

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.find((result) => result.status === 'rejected')?.reason).toBeInstanceOf(EmailAlreadyInUse);
    });

    it('persists updates', async () => {
      const user = makeUser({ emailVerifiedAt: null });
      await repos.users.create(user);

      user.verifyEmail(new Date('2026-02-01T00:00:00Z'));
      user.changePassword('hashed:new', new Date('2026-02-01T00:00:00Z'));
      user.name = 'Grace';
      await repos.users.update(user);

      await expect(repos.users.findById(user.id)).resolves.toEqual(user);
    });

    it('createWithIdentity creates both, atomically', async () => {
      const user = makeUser({ email: 'ada@example.com' });
      const identity = makeAuthIdentity({ userId: user.id, provider: 'google', providerUserId: 'g-1' });

      await repos.users.createWithIdentity(user, identity);

      await expect(repos.users.findById(user.id)).resolves.toEqual(user);
      await expect(repos.authIdentities.findByProviderUserId('google', 'g-1')).resolves.toEqual(identity);

      const duplicate = makeUser({ email: 'ada@example.com' });
      const orphan = makeAuthIdentity({ userId: duplicate.id, provider: 'apple', providerUserId: 'a-1' });

      await expect(repos.users.createWithIdentity(duplicate, orphan)).rejects.toBeInstanceOf(EmailAlreadyInUse);
      await expect(repos.authIdentities.findByProviderUserId('apple', 'a-1')).resolves.toBeNull();
    });

    it('linkIdentity saves the user and attaches the identity', async () => {
      const user = makeUser({ emailVerifiedAt: null });
      await repos.users.create(user);

      user.verifyEmail(new Date('2026-02-01T00:00:00Z'));
      await repos.users.linkIdentity(user, makeAuthIdentity({ userId: user.id, provider: 'apple' }));

      expect((await repos.users.findById(user.id))?.emailVerified).toBe(true);
      expect((await repos.authIdentities.listByUserId(user.id)).map((item) => item.provider)).toEqual(['apple']);
    });

    it('delete cascades to identities, refresh tokens and verification codes', async () => {
      const user = makeUser();
      const other = makeUser();
      const identity = makeAuthIdentity({ userId: user.id });
      const token = makeRefreshToken({ userId: user.id });
      const otherToken = makeRefreshToken({ userId: other.id });
      const code = makeVerificationCode({ userId: user.id });

      await repos.users.createWithIdentity(user, identity);
      await repos.users.create(other);
      await repos.refreshTokens.create(token);
      await repos.refreshTokens.create(otherToken);
      await repos.verificationCodes.replace(code);

      await repos.users.delete(user.id);

      await expect(repos.users.findById(user.id)).resolves.toBeNull();
      await expect(repos.authIdentities.listByUserId(user.id)).resolves.toEqual([]);
      await expect(repos.refreshTokens.findByHash(token.tokenHash)).resolves.toBeNull();
      await expect(repos.verificationCodes.findActive(user.id, code.purpose)).resolves.toBeNull();
      await expect(repos.refreshTokens.findByHash(otherToken.tokenHash)).resolves.toEqual(otherToken);
    });
  });
}
