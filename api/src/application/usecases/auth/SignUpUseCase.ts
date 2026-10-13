import type { IPasswordHasher } from '#application/contracts/gateways/IPasswordHasher';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { User } from '#application/entities/User';
import { EmailAlreadyInUse } from '#application/errors/application/EmailAlreadyInUse';
import type { SendVerificationCodeUseCase } from '#application/usecases/auth/SendVerificationCodeUseCase';

export class SignUpUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly sendVerificationCode: SendVerificationCodeUseCase,
  ) {}

  async execute({ name, email, password }: SignUpUseCase.Input): Promise<void> {
    // Early check for a fast answer; uniqueness itself is guaranteed by the repository.
    if (await this.usersRepository.findByEmail(User.normalizeEmail(email))) {
      throw new EmailAlreadyInUse();
    }

    const user = new User({ name, email, passwordHash: await this.passwordHasher.hash(password) });

    await this.usersRepository.create(user);
    await this.sendVerificationCode.execute({ user, purpose: 'email_verification' });
  }
}

export namespace SignUpUseCase {
  export type Input = {
    name: string;
    email: string;
    password: string;
  };
}
