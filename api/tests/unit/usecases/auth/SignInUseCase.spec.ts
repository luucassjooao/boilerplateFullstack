import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailNotVerified } from '#application/errors/application/EmailNotVerified';
import { InvalidCredentials } from '#application/errors/application/InvalidCredentials';
import { SignInUseCase } from '#application/usecases/auth/SignInUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('SignInUseCase', () => {
  let deps: UnitDeps;
  let sut: SignInUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new SignInUseCase(deps.usersRepository, deps.passwordHasher, deps.startSession);
  });

  it('starts a session with valid credentials', async () => {
    const user = makeUser({ email: 'ada@example.com' });
    await deps.usersRepository.create(user);

    const session = await sut.execute({ email: 'ADA@example.com', password: 'correct-password', userAgent: null });

    await expect(deps.accessTokenService.verify(session.accessToken)).resolves.toEqual({ userId: user.id });
  });

  it('rejects a wrong password', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com' }));

    await expect(sut.execute({ email: 'ada@example.com', password: 'wrong', userAgent: null }))
      .rejects.toBeInstanceOf(InvalidCredentials);
  });

  it('runs a dummy hash check for unknown emails, then rejects', async () => {
    await expect(sut.execute({ email: 'nobody@example.com', password: 'whatever', userAgent: null }))
      .rejects.toBeInstanceOf(InvalidCredentials);

    expect(deps.passwordHasher.verifyCalls).toHaveLength(1);
    expect(deps.passwordHasher.verifyCalls[0]?.plain).toBe('whatever');
  });

  it('rejects social-only users (no password) as invalid credentials', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com', passwordHash: null }));

    await expect(sut.execute({ email: 'ada@example.com', password: 'anything', userAgent: null }))
      .rejects.toBeInstanceOf(InvalidCredentials);
    expect(deps.passwordHasher.verifyCalls).toHaveLength(1);
  });

  it('rejects unverified emails only after the password matches', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com', emailVerifiedAt: null }));

    await expect(sut.execute({ email: 'ada@example.com', password: 'wrong', userAgent: null }))
      .rejects.toBeInstanceOf(InvalidCredentials);
    await expect(sut.execute({ email: 'ada@example.com', password: 'correct-password', userAgent: null }))
      .rejects.toBeInstanceOf(EmailNotVerified);
  });

  it('does not disguise infrastructure failures as invalid credentials', async () => {
    vi.spyOn(deps.usersRepository, 'findByEmail').mockRejectedValueOnce(new Error('connection refused'));

    await expect(sut.execute({ email: 'ada@example.com', password: 'x', userAgent: null }))
      .rejects.toThrow('connection refused');
  });
});
