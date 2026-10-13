import { Controller } from '#application/contracts/Controller';
import type { GetMeUseCase } from '#application/usecases/accounts/GetMeUseCase';

export class GetMeController extends Controller<'private', GetMeUseCase.Output> {
  constructor(private readonly getMeUseCase: GetMeUseCase) {
    super();
  }

  protected override async handle({ userId }: Controller.Request<'private'>) {
    const me = await this.getMeUseCase.execute({ userId });

    return { statusCode: 200, body: me };
  }
}
