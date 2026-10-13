import { beforeEach, describe, expect, it } from 'vitest';
import type { SendVerificationCodeUseCase } from '#application/usecases/auth/SendVerificationCodeUseCase';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('SendVerificationCodeUseCase', () => {
  let deps: UnitDeps;
  let sut: SendVerificationCodeUseCase;

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = deps.sendVerificationCode;
  });

  it('emails a 6-digit code and stores only its HMAC', async () => {
    const user = makeUser();

    await sut.execute({ user, purpose: 'email_verification' });

    const code = deps.emailGateway.lastCodeFor(user.email);
    const [stored] = deps.database.verificationCodes;

    expect(code).toMatch(/^\d{6}$/);
    expect(stored?.codeHash).toBe(deps.verificationCodeService.hash(code));
    expect(stored?.codeHash).not.toContain(code);
    expect(deps.emailGateway.sent[0]?.subject).toBe('Confirme seu email');
  });

  it('invalidates the previous code of the same purpose only', async () => {
    const user = makeUser();

    await sut.execute({ user, purpose: 'email_verification' });
    await sut.execute({ user, purpose: 'password_reset' });
    await sut.execute({ user, purpose: 'email_verification' });

    const purposes = deps.database.verificationCodes.map((code) => code.purpose).sort();

    expect(purposes).toEqual(['email_verification', 'password_reset']);
    expect(deps.emailGateway.sent.at(-2)?.subject).toBe('Redefinição de senha');
  });
});
