import type { IVerificationCodesRepository } from '#application/contracts/repositories/IVerificationCodesRepository';
import type { VerificationCode } from '#application/entities/VerificationCode';
import { InvalidVerificationCode } from '#application/errors/application/InvalidVerificationCode';
import type { VerificationCodeService } from '#application/services/VerificationCodeService';

/** Validates and consumes a code. Every check counts as an attempt; after `maxAttempts` the code is dead. */
export class ConsumeVerificationCodeUseCase {
  constructor(
    private readonly verificationCodesRepository: IVerificationCodesRepository,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly options: ConsumeVerificationCodeUseCase.Options,
  ) {}

  async execute({ userId, purpose, code }: ConsumeVerificationCodeUseCase.Input): Promise<void> {
    const now = new Date();
    const active = await this.verificationCodesRepository.findActive(userId, purpose);

    if (!active || active.isExpired(now)) {
      throw new InvalidVerificationCode();
    }

    const hasAttemptsLeft = await this.verificationCodesRepository.registerAttempt(active.id, this.options.maxAttempts);

    if (!hasAttemptsLeft || !this.verificationCodeService.matches(code, active.codeHash)) {
      throw new InvalidVerificationCode();
    }

    if (!(await this.verificationCodesRepository.consume(active.id, now))) {
      throw new InvalidVerificationCode();
    }
  }
}

export namespace ConsumeVerificationCodeUseCase {
  export type Options = { maxAttempts: number };

  export type Input = {
    userId: string;
    purpose: VerificationCode.Purpose;
    code: string;
  };
}
