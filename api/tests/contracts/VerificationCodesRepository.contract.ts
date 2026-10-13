import { beforeEach, describe, expect, it } from 'vitest';
import { makeUser } from '#tests/factories/makeUser';
import { makeVerificationCode } from '#tests/factories/makeVerificationCode';
import type { MakeRepositories, Repositories } from '#tests/contracts/Repositories';

export function runVerificationCodesRepositoryContract(makeRepositories: MakeRepositories) {
  describe('IVerificationCodesRepository contract', () => {
    let repos: Repositories;
    const now = new Date('2026-03-01T12:00:00Z');
    const user = makeUser();

    beforeEach(async () => {
      repos = await makeRepositories();
      await repos.users.create(user);
    });

    it('replace stores the code and invalidates the previous one of the same purpose', async () => {
      const first = makeVerificationCode({ userId: user.id, purpose: 'email_verification' });
      const reset = makeVerificationCode({ userId: user.id, purpose: 'password_reset' });
      const second = makeVerificationCode({ userId: user.id, purpose: 'email_verification' });

      await repos.verificationCodes.replace(first);
      await repos.verificationCodes.replace(reset);
      await repos.verificationCodes.replace(second);

      await expect(repos.verificationCodes.findActive(user.id, 'email_verification')).resolves.toEqual(second);
      await expect(repos.verificationCodes.findActive(user.id, 'password_reset')).resolves.toEqual(reset);
      await expect(repos.verificationCodes.registerAttempt(first.id, 5)).resolves.toBe(false);
    });

    it('registerAttempt allows up to maxAttempts', async () => {
      const code = makeVerificationCode({ userId: user.id });
      await repos.verificationCodes.replace(code);

      const results = [];

      for (let attempt = 0; attempt < 4; attempt++) {
        results.push(await repos.verificationCodes.registerAttempt(code.id, 3));
      }

      expect(results).toEqual([true, true, true, false]);
      expect((await repos.verificationCodes.findActive(user.id, code.purpose))?.attempts).toBe(3);
    });

    it('registerAttempt is atomic under concurrency', async () => {
      const code = makeVerificationCode({ userId: user.id });
      await repos.verificationCodes.replace(code);

      const results = await Promise.all(
        Array.from({ length: 8 }, () => repos.verificationCodes.registerAttempt(code.id, 5)),
      );

      expect(results.filter(Boolean)).toHaveLength(5);
    });

    it('consume works once and hides the code from findActive', async () => {
      const code = makeVerificationCode({ userId: user.id });
      await repos.verificationCodes.replace(code);

      const results = await Promise.all([
        repos.verificationCodes.consume(code.id, now),
        repos.verificationCodes.consume(code.id, now),
      ]);

      expect(results.filter(Boolean)).toHaveLength(1);
      await expect(repos.verificationCodes.findActive(user.id, code.purpose)).resolves.toBeNull();
      await expect(repos.verificationCodes.registerAttempt(code.id, 5)).resolves.toBe(false);
    });
  });
}
