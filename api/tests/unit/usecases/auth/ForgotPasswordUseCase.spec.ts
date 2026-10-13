import { beforeEach, describe, expect, it } from 'vitest';
import { ForgotPasswordUseCase } from '#application/usecases/auth/ForgotPasswordUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('ForgotPasswordUseCase', () => {
  let deps: UnitDeps;
  let sut: ForgotPasswordUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new ForgotPasswordUseCase(deps.usersRepository, deps.sendVerificationCode);
  });

  it('emails a reset code, also to social-only users', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com', passwordHash: null }));

    await sut.execute({ email: 'Ada@Example.com' });

    expect(deps.emailGateway.sentTo('ada@example.com')[0]?.subject).toBe('Redefinição de senha');
    expect(deps.database.verificationCodes[0]?.purpose).toBe('password_reset');
  });

  it('is silent for unknown emails', async () => {
    await expect(sut.execute({ email: 'nobody@example.com' })).resolves.toBeUndefined();
    expect(deps.emailGateway.sent).toHaveLength(0);
  });
});
