import { beforeEach, describe, expect, it } from 'vitest';
import { SignOutUseCase } from '#application/usecases/auth/SignOutUseCase';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('SignOutUseCase', () => {
  let deps: UnitDeps;
  let sut: SignOutUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new SignOutUseCase(deps.refreshTokensRepository, deps.opaqueTokenService);
  });

  it('revokes only the family of the given token', async () => {
    const session = await deps.startSession.execute({ userId: 'user-1', userAgent: null });
    await deps.startSession.execute({ userId: 'user-1', userAgent: null });

    await sut.execute({ refreshToken: session.refreshToken });

    expect(deps.database.refreshTokens.map((token) => token.revokedAt !== null)).toEqual([true, false]);
  });

  it('ignores unknown tokens', async () => {
    await expect(sut.execute({ refreshToken: 'unknown' })).resolves.toBeUndefined();
  });
});
