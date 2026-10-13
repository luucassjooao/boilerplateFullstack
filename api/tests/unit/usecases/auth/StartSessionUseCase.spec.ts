import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';
import { makeUnitDeps, REFRESH_TTL_SECONDS, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('StartSessionUseCase', () => {
  let deps: UnitDeps;
  let sut: StartSessionUseCase;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    deps = makeUnitDeps();
    sut = deps.startSession;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('issues a valid access token and persists only the refresh token hash', async () => {
    const session = await sut.execute({ userId: 'user-1', userAgent: 'vitest' });

    await expect(deps.accessTokenService.verify(session.accessToken)).resolves.toEqual({ userId: 'user-1' });

    const [stored] = deps.database.refreshTokens;

    expect(deps.database.refreshTokens).toHaveLength(1);
    expect(stored?.tokenHash).toBe(deps.opaqueTokenService.hash(session.refreshToken));
    expect(stored?.tokenHash).not.toBe(session.refreshToken);
    expect(stored?.userAgent).toBe('vitest');
    expect(stored?.expiresAt).toEqual(new Date(Date.now() + REFRESH_TTL_SECONDS * 1000));
  });

  it('starts a new family on login and keeps the family on rotation', async () => {
    await sut.execute({ userId: 'user-1', userAgent: null });
    await sut.execute({ userId: 'user-1', userAgent: null });
    const familyId = deps.database.refreshTokens[0]!.familyId;

    await sut.execute({ userId: 'user-1', familyId, userAgent: null });

    const families = deps.database.refreshTokens.map((token) => token.familyId);

    expect(families[0]).not.toBe(families[1]);
    expect(families[2]).toBe(familyId);
  });
});
