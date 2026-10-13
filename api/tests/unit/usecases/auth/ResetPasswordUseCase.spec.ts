import { beforeEach, describe, expect, it } from 'vitest';
import { InvalidVerificationCode } from '#application/errors/application/InvalidVerificationCode';
import { ResetPasswordUseCase } from '#application/usecases/auth/ResetPasswordUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('ResetPasswordUseCase', () => {
  let deps: UnitDeps;
  let sut: ResetPasswordUseCase;
  const user = makeUser({ email: 'ada@example.com', emailVerifiedAt: null });

  beforeEach(async () => {
    deps = makeUnitDeps();
    sut = new ResetPasswordUseCase(
      deps.usersRepository,
      deps.refreshTokensRepository,
      deps.passwordHasher,
      deps.consumeVerificationCode,
    );
    await deps.usersRepository.create(user);
    await deps.sendVerificationCode.execute({ user, purpose: 'password_reset' });
  });

  it('changes the password, verifies the email and revokes every session', async () => {
    await deps.startSession.execute({ userId: user.id, userAgent: null });
    await deps.startSession.execute({ userId: user.id, userAgent: null });
    const code = deps.emailGateway.lastCodeFor(user.email);

    await sut.execute({ email: user.email, code, password: 'new-password' });

    const updated = await deps.usersRepository.findById(user.id);

    expect(updated?.passwordHash).toBe('hashed:new-password');
    expect(updated?.emailVerified).toBe(true);
    expect(deps.database.refreshTokens.every((token) => token.revokedAt !== null)).toBe(true);
  });

  it('rejects a wrong code and keeps the old password', async () => {
    const code = deps.emailGateway.lastCodeFor(user.email) === '000000' ? '111111' : '000000';

    await expect(sut.execute({ email: user.email, code, password: 'new-password' }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);
    expect((await deps.usersRepository.findById(user.id))?.passwordHash).toBe('hashed:correct-password');
  });

  it('rejects an unknown email', async () => {
    await expect(sut.execute({ email: 'nobody@example.com', code: '123456', password: 'new-password' }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);
  });
});
