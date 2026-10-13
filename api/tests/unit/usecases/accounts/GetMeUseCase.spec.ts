import { beforeEach, describe, expect, it } from 'vitest';
import { NotFound } from '#application/errors/http/NotFound';
import { GetMeUseCase } from '#application/usecases/accounts/GetMeUseCase';
import { makeAuthIdentity } from '#tests/factories/makeAuthIdentity';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('GetMeUseCase', () => {
  let deps: UnitDeps;
  let sut: GetMeUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new GetMeUseCase(deps.usersRepository, deps.authIdentitiesRepository);
  });

  it('returns the profile with linked providers', async () => {
    const user = makeUser({ name: 'Ada', email: 'ada@example.com' });
    await deps.usersRepository.createWithIdentity(user, makeAuthIdentity({ userId: user.id, provider: 'apple' }));

    await expect(sut.execute({ userId: user.id })).resolves.toEqual({
      id: user.id,
      name: 'Ada',
      email: 'ada@example.com',
      emailVerified: true,
      providers: ['apple'],
    });
  });

  it('throws NotFound for a deleted user', async () => {
    await expect(sut.execute({ userId: 'missing' })).rejects.toBeInstanceOf(NotFound);
  });
});
