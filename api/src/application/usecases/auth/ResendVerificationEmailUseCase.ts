import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { User } from '#application/entities/User';
import type { SendVerificationCodeUseCase } from '#application/usecases/auth/SendVerificationCodeUseCase';

/** Silent: never reveals whether the email exists or is already verified. */
export class ResendVerificationEmailUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly sendVerificationCode: SendVerificationCodeUseCase,
  ) {}

  async execute({ email }: ResendVerificationEmailUseCase.Input): Promise<void> {
    const user = await this.usersRepository.findByEmail(User.normalizeEmail(email));

    if (user && !user.emailVerified) {
      await this.sendVerificationCode.execute({ user, purpose: 'email_verification' });
    }
  }
}

export namespace ResendVerificationEmailUseCase {
  export type Input = { email: string };
}
