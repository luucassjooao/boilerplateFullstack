import { beforeEach, describe, expect, it } from 'vitest';
import { makeAuthIdentity } from '#tests/factories/makeAuthIdentity';
import { makeUser } from '#tests/factories/makeUser';
import type { MakeRepositories, Repositories } from '#tests/contracts/Repositories';

export function runAuthIdentitiesRepositoryContract(makeRepositories: MakeRepositories) {
  describe('IAuthIdentitiesRepository contract', () => {
    let repos: Repositories;

    beforeEach(async () => {
      repos = await makeRepositories();
    });

    it('finds by provider + provider user id', async () => {
      const user = makeUser();
      const identity = makeAuthIdentity({ userId: user.id, provider: 'google', providerUserId: 'sub-1', email: 'A@x.com' });

      await repos.users.createWithIdentity(user, identity);

      await expect(repos.authIdentities.findByProviderUserId('google', 'sub-1')).resolves.toEqual(identity);
      await expect(repos.authIdentities.findByProviderUserId('apple', 'sub-1')).resolves.toBeNull();
    });

    it('lists identities of a user, oldest first', async () => {
      const user = makeUser();
      const google = makeAuthIdentity({ userId: user.id, provider: 'google', createdAt: new Date('2026-01-01') });
      const apple = makeAuthIdentity({ userId: user.id, provider: 'apple', createdAt: new Date('2026-01-02') });

      await repos.users.createWithIdentity(user, apple);
      await repos.users.linkIdentity(user, google);

      expect((await repos.authIdentities.listByUserId(user.id)).map((item) => item.provider)).toEqual(['google', 'apple']);
      await expect(repos.authIdentities.listByUserId(makeUser().id)).resolves.toEqual([]);
    });
  });
}
