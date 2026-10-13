import { randomUUID } from 'node:crypto';
import type { IPasswordHasher } from '#application/contracts/gateways/IPasswordHasher';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import { User } from '#application/entities/User';
import { EmailNotVerified } from '#application/errors/application/EmailNotVerified';
import { InvalidCredentials } from '#application/errors/application/InvalidCredentials';
import type { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';

export class SignInUseCase {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly startSession: StartSessionUseCase,
  ) {}

  async execute({ email, password, userAgent }: SignInUseCase.Input): Promise<SignInUseCase.Output> {
    const user = await this.usersRepository.findByEmail(User.normalizeEmail(email));

    if (!user?.passwordHash) {
      // Same cost as a real check, so response time does not reveal whether the account exists.
      await this.passwordHasher.verify(await this.getDummyHash(), password);
      throw new InvalidCredentials();
    }

    if (!(await this.passwordHasher.verify(user.passwordHash, password))) {
      throw new InvalidCredentials();
    }

    if (!user.emailVerified) {
      throw new EmailNotVerified();
    }

    return this.startSession.execute({ userId: user.id, userAgent });
  }

  private getDummyHash(): Promise<string> {
    // ponytail: the very first miss also pays for this hash; precompute at boot if that matters.
    this.dummyHash ??= this.passwordHasher.hash(randomUUID());

    return this.dummyHash;
  }
}

export namespace SignInUseCase {
  export type Input = {
    email: string;
    password: string;
    userAgent: string | null;
  };

  export type Output = StartSessionUseCase.Output;
}
