import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { User } from '#application/entities/User';
import { InvalidVerificationCode } from '#application/errors/application/InvalidVerificationCode';
import type { ConsumeVerificationCodeUseCase } from '#application/usecases/auth/ConsumeVerificationCodeUseCase';
import type { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';

export class VerifyEmailUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly consumeVerificationCode: ConsumeVerificationCodeUseCase,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute({ email, code, userAgent }: VerifyEmailUseCase.Input): Promise<VerifyEmailUseCase.Output> {
    const user = await this.usersRepository.findByEmail(User.normalizeEmail(email));

    if (!user) {
      throw new InvalidVerificationCode();
    }

    await this.consumeVerificationCode.execute({ userId: user.id, purpose: 'email_verification', code });

    user.verifyEmail();
    await this.usersRepository.update(user);

    return this.startSession.execute({ userId: user.id, userAgent });
  }
}

export namespace VerifyEmailUseCase {
  export type Input = {
    email: string;
    code: string;
    userAgent: string | null;
  };

  export type Output = StartSessionUseCase.Output;
}
