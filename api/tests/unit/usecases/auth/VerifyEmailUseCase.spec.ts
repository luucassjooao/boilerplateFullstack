import { beforeEach, describe, expect, it } from 'vitest';
import { InvalidVerificationCode } from '#application/errors/application/InvalidVerificationCode';
import { VerifyEmailUseCase } from '#application/usecases/auth/VerifyEmailUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('VerifyEmailUseCase', () => {
  let deps: UnitDeps;
  let sut: VerifyEmailUseCase;
  const user = makeUser({ email: 'ada@example.com', emailVerifiedAt: null });

  beforeEach(async () => {
    deps = makeUnitDeps();
    sut = new VerifyEmailUseCase(deps.usersRepository, deps.consumeVerificationCode, deps.startSession);
    await deps.usersRepository.create(user);
    await deps.sendVerificationCode.execute({ user, purpose: 'email_verification' });
  });

  it('marks the email as verified and starts a session', async () => {
    const code = deps.emailGateway.lastCodeFor(user.email);

    const session = await sut.execute({ email: 'ADA@example.com', code, userAgent: null });

    expect((await deps.usersRepository.findById(user.id))?.emailVerified).toBe(true);
    await expect(deps.accessTokenService.verify(session.accessToken)).resolves.toEqual({ userId: user.id });
    expect(deps.database.refreshTokens).toHaveLength(1);
  });

  it('rejects a wrong code without verifying', async () => {
    const code = deps.emailGateway.lastCodeFor(user.email) === '000000' ? '111111' : '000000';

    await expect(sut.execute({ email: user.email, code, userAgent: null }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);
    expect((await deps.usersRepository.findById(user.id))?.emailVerified).toBe(false);
  });

  it('rejects an unknown email with the same error', async () => {
    await expect(sut.execute({ email: 'nobody@example.com', code: '123456', userAgent: null }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);
  });
});
