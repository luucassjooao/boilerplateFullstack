import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { User } from '#application/entities/User';
import type { SendVerificationCodeUseCase } from '#application/usecases/auth/SendVerificationCodeUseCase';

/** Silent: never reveals whether the email exists. Also lets social-only users create a password. */
export class ForgotPasswordUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly sendVerificationCode: SendVerificationCodeUseCase,
  ) {}

  async execute({ email }: ForgotPasswordUseCase.Input): Promise<void> {
    const user = await this.usersRepository.findByEmail(User.normalizeEmail(email));

    // ponytail: sending the email makes hits slower than misses; queue it if timing enumeration matters.
    if (user) {
      await this.sendVerificationCode.execute({ user, purpose: 'password_reset' });
    }
  }
}

export namespace ForgotPasswordUseCase {
  export type Input = { email: string };
}
