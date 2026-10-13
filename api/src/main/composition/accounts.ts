import { GetMeController } from '#application/controllers/accounts/GetMeController';
import { GetMeUseCase } from '#application/usecases/accounts/GetMeUseCase';
import type { Infra } from '#main/composition/infra';

export function makeAccountsModule(infra: Infra) {
  return {
    controllers: {
      getMe: new GetMeController(new GetMeUseCase(infra.usersRepository, infra.authIdentitiesRepository)),
    },
  };
}

export type AccountsModule = ReturnType<typeof makeAccountsModule>;
