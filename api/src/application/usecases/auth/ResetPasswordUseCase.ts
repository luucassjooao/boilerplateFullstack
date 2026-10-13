import type { IPasswordHasher } from '#application/contracts/gateways/IPasswordHasher';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { User } from '#application/entities/User';
import { InvalidVerificationCode } from '#application/errors/application/InvalidVerificationCode';
import type { ConsumeVerificationCodeUseCase } from '#application/usecases/auth/ConsumeVerificationCodeUseCase';

export class ResetPasswordUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly refreshTokensRepository: IRefreshTokensRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly consumeVerificationCode: ConsumeVerificationCodeUseCase,
  ) {}

  async execute({ email, code, password }: ResetPasswordUseCase.Input): Promise<void> {
    const user = await this.usersRepository.findByEmail(User.normalizeEmail(email));

    if (!user) {
      throw new InvalidVerificationCode();
    }

    await this.consumeVerificationCode.execute({ userId: user.id, purpose: 'password_reset', code });

    const now = new Date();

    user.changePassword(await this.passwordHasher.hash(password), now);
    // The code reached the inbox, so the email is proven.
    user.verifyEmail(now);
    await this.usersRepository.update(user);
    await this.refreshTokensRepository.revokeAllByUserId(user.id, now);
  }
}

export namespace ResetPasswordUseCase {
  export type Input = {
    email: string;
    code: string;
    password: string;
  };
}
