import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidRefreshToken } from '#application/errors/application/InvalidRefreshToken';
import { RefreshSessionUseCase } from '#application/usecases/auth/RefreshSessionUseCase';
import { makeUnitDeps, REFRESH_TTL_SECONDS, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('RefreshSessionUseCase', () => {
  let deps: UnitDeps;
  let sut: RefreshSessionUseCase;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    deps = makeUnitDeps();
    sut = new RefreshSessionUseCase(
      deps.refreshTokensRepository,
      deps.opaqueTokenService,
      deps.startSession,
      { reuseGraceSeconds: 30 },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function login() {
    return deps.startSession.execute({ userId: 'user-1', userAgent: null });
  }

  it('rotates: consumes the token and issues a new one in the same family', async () => {
    const first = await login();

    const second = await sut.execute({ refreshToken: first.refreshToken, userAgent: null });

    expect(second.refreshToken).not.toBe(first.refreshToken);
    await expect(deps.accessTokenService.verify(second.accessToken)).resolves.toEqual({ userId: 'user-1' });

    const [old, current] = deps.database.refreshTokens;

    expect(old?.usedAt).toEqual(new Date());
    expect(current?.familyId).toBe(old?.familyId);
  });

  it('rejects unknown tokens', async () => {
    await expect(sut.execute({ refreshToken: 'nope', userAgent: null })).rejects.toBeInstanceOf(InvalidRefreshToken);
  });

  it('rejects expired tokens', async () => {
    const { refreshToken } = await login();

    vi.advanceTimersByTime(REFRESH_TTL_SECONDS * 1000);

    await expect(sut.execute({ refreshToken, userAgent: null })).rejects.toBeInstanceOf(InvalidRefreshToken);
  });

  it('reuse within 30s: rejects but keeps the family alive', async () => {
    const first = await login();
    const second = await sut.execute({ refreshToken: first.refreshToken, userAgent: null });

    vi.advanceTimersByTime(30 * 1000);

    await expect(sut.execute({ refreshToken: first.refreshToken, userAgent: null }))
      .rejects.toBeInstanceOf(InvalidRefreshToken);
    await expect(sut.execute({ refreshToken: second.refreshToken, userAgent: null })).resolves.toBeDefined();
  });

  it('reuse after 30s: revokes the whole family', async () => {
    const first = await login();
    const second = await sut.execute({ refreshToken: first.refreshToken, userAgent: null });
    const otherDevice = await login();

    vi.advanceTimersByTime(31 * 1000);

    await expect(sut.execute({ refreshToken: first.refreshToken, userAgent: null }))
      .rejects.toBeInstanceOf(InvalidRefreshToken);
    await expect(sut.execute({ refreshToken: second.refreshToken, userAgent: null }))
      .rejects.toBeInstanceOf(InvalidRefreshToken);
    await expect(sut.execute({ refreshToken: otherDevice.refreshToken, userAgent: null })).resolves.toBeDefined();
  });

  it('rejects tokens of a revoked family', async () => {
    const { refreshToken } = await login();
    const familyId = deps.database.refreshTokens[0]!.familyId;

    await deps.refreshTokensRepository.revokeFamily(familyId, new Date());

    await expect(sut.execute({ refreshToken, userAgent: null })).rejects.toBeInstanceOf(InvalidRefreshToken);
  });
});
