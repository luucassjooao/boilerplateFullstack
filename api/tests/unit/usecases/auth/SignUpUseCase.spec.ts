import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailAlreadyInUse } from '#application/errors/application/EmailAlreadyInUse';
import { SignUpUseCase } from '#application/usecases/auth/SignUpUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('SignUpUseCase', () => {
  let deps: UnitDeps;
  let sut: SignUpUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new SignUpUseCase(deps.usersRepository, deps.passwordHasher, deps.sendVerificationCode);
  });

  it('creates an unverified user with a hashed password and normalized email', async () => {
    await sut.execute({ name: 'Ada', email: '  Ada@Example.COM ', password: 'secret-123' });

    const user = await deps.usersRepository.findByEmail('ada@example.com');

    expect(user).not.toBeNull();
    expect(user?.passwordHash).toBe('hashed:secret-123');
    expect(user?.emailVerified).toBe(false);
  });

  it('emails a verification code', async () => {
    await sut.execute({ name: 'Ada', email: 'ada@example.com', password: 'secret-123' });

    expect(deps.emailGateway.lastCodeFor('ada@example.com')).toMatch(/^\d{6}$/);
  });

  it('rejects an email already in use', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com' }));

    await expect(sut.execute({ name: 'Ada', email: 'ADA@example.com', password: 'secret-123' }))
      .rejects.toBeInstanceOf(EmailAlreadyInUse);
    expect(deps.emailGateway.sent).toHaveLength(0);
  });

  it('relies on the repository when the early check loses a race', async () => {
    await deps.usersRepository.create(makeUser({ email: 'ada@example.com' }));
    vi.spyOn(deps.usersRepository, 'findByEmail').mockResolvedValueOnce(null);

    await expect(sut.execute({ name: 'Ada', email: 'ada@example.com', password: 'secret-123' }))
      .rejects.toBeInstanceOf(EmailAlreadyInUse);
  });
});
