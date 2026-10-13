import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidVerificationCode } from '#application/errors/application/InvalidVerificationCode';
import type { ConsumeVerificationCodeUseCase } from '#application/usecases/auth/ConsumeVerificationCodeUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('ConsumeVerificationCodeUseCase', () => {
  let deps: UnitDeps;
  let sut: ConsumeVerificationCodeUseCase;
  const user = makeUser();
  const purpose = 'email_verification';

  async function sendCode() {
    await deps.sendVerificationCode.execute({ user, purpose });

    return deps.emailGateway.lastCodeFor(user.email);
  }

  function wrong(code: string) {
    return code === '000000' ? '111111' : '000000';
  }

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    deps = makeUnitDeps();
    sut = deps.consumeVerificationCode;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('consumes a valid code exactly once', async () => {
    const code = await sendCode();

    await expect(sut.execute({ userId: user.id, purpose, code })).resolves.toBeUndefined();
    await expect(sut.execute({ userId: user.id, purpose, code })).rejects.toBeInstanceOf(InvalidVerificationCode);
  });

  it('rejects a wrong code and counts the attempt', async () => {
    const code = await sendCode();

    await expect(sut.execute({ userId: user.id, purpose, code: wrong(code) }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);
    expect(deps.database.verificationCodes[0]?.attempts).toBe(1);
  });

  it('kills the code after 5 attempts, even if the 6th is right', async () => {
    const code = await sendCode();

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(sut.execute({ userId: user.id, purpose, code: wrong(code) })).rejects.toThrow();
    }

    await expect(sut.execute({ userId: user.id, purpose, code })).rejects.toBeInstanceOf(InvalidVerificationCode);
  });

  it('rejects an expired code', async () => {
    const code = await sendCode();

    vi.advanceTimersByTime(15 * 60 * 1000);

    await expect(sut.execute({ userId: user.id, purpose, code })).rejects.toBeInstanceOf(InvalidVerificationCode);
  });

  it('rejects when there is no code or the purpose differs', async () => {
    await expect(sut.execute({ userId: user.id, purpose, code: '123456' }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);

    const code = await sendCode();

    await expect(sut.execute({ userId: user.id, purpose: 'password_reset', code }))
      .rejects.toBeInstanceOf(InvalidVerificationCode);
  });

  it('rejects a previous code after a new one was sent', async () => {
    const first = await sendCode();
    const second = await sendCode();

    if (first !== second) {
      await expect(sut.execute({ userId: user.id, purpose, code: first }))
        .rejects.toBeInstanceOf(InvalidVerificationCode);
    }

    await expect(sut.execute({ userId: user.id, purpose, code: second })).resolves.toBeUndefined();
  });

  it('rejects when the code is consumed concurrently between check and consume', async () => {
    const code = await sendCode();

    vi.spyOn(deps.verificationCodesRepository, 'consume').mockResolvedValueOnce(false);

    await expect(sut.execute({ userId: user.id, purpose, code })).rejects.toBeInstanceOf(InvalidVerificationCode);
  });
});
