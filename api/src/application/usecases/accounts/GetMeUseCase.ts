import type { IAuthIdentitiesRepository } from '#application/contracts/repositories/IAuthIdentitiesRepository';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import { NotFound } from '#application/errors/http/NotFound';

export class GetMeUseCase {
  constructor(
    private readonly usersRepository: IUsersRepository,
    private readonly authIdentitiesRepository: IAuthIdentitiesRepository,
  ) {}

  async execute({ userId }: GetMeUseCase.Input): Promise<GetMeUseCase.Output> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFound('User not found');
    }

    const identities = await this.authIdentitiesRepository.listByUserId(userId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      providers: identities.map((identity) => identity.provider),
    };
  }
}

export namespace GetMeUseCase {
  export type Input = { userId: string };

  export type Output = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    providers: AuthIdentity.Provider[];
  };
}
