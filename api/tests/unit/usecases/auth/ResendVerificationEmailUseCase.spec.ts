import { beforeEach, describe, expect, it } from 'vitest';
import { ResendVerificationEmailUseCase } from '#application/usecases/auth/ResendVerificationEmailUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('ResendVerificationEmailUseCase', () => {
  let deps: UnitDeps;
  let sut: ResendVerificationEmailUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new ResendVerificationEmailUseCase(deps.usersRepository, deps.sendVerificationCode);
  });

  it('sends a new code to an unverified user', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com', emailVerifiedAt: null }));

    await sut.execute({ email: 'Ada@example.com' });

    expect(deps.emailGateway.sentTo('ada@example.com')).toHaveLength(1);
  });

  it('does nothing for verified or unknown users', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com' }));

    await sut.execute({ email: 'ada@example.com' });
    await sut.execute({ email: 'nobody@example.com' });

    expect(deps.emailGateway.sent).toHaveLength(0);
  });
});
