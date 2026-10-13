import type { IEmailGateway } from '#application/contracts/gateways/IEmailGateway';
import type { IEmailTemplates } from '#application/contracts/gateways/IEmailTemplates';
import type { IVerificationCodesRepository } from '#application/contracts/repositories/IVerificationCodesRepository';
import type { User } from '#application/entities/User';
import { VerificationCode } from '#application/entities/VerificationCode';
import type { VerificationCodeService } from '#application/services/VerificationCodeService';

/** Generates a new code (invalidating the previous one of the same purpose) and emails it. */
export class SendVerificationCodeUseCase {
  constructor(
    private readonly verificationCodesRepository: IVerificationCodesRepository,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly emailGateway: IEmailGateway,
    private readonly emailTemplates: IEmailTemplates,
    private readonly options: SendVerificationCodeUseCase.Options,
  ) {}

  async execute({ user, purpose }: SendVerificationCodeUseCase.Input): Promise<void> {
    const { code, hash } = this.verificationCodeService.generate();
    const now = new Date();

    await this.verificationCodesRepository.replace(new VerificationCode({
      userId: user.id,
      purpose,
      codeHash: hash,
      expiresAt: new Date(now.getTime() + this.options.ttlSeconds * 1000),
      createdAt: now,
    }));

    const content = this.emailTemplates.verificationCode({
      name: user.name,
      code,
      purpose,
      expiresInMinutes: Math.floor(this.options.ttlSeconds / 60),
    });

    await this.emailGateway.send({ to: user.email, ...content });
  }
}

export namespace SendVerificationCodeUseCase {
  export type Options = { ttlSeconds: number };

  export type Input = {
    user: User;
    purpose: VerificationCode.Purpose;
  };
}
