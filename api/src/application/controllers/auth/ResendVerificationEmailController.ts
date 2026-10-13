import { Controller } from '#application/contracts/Controller';
import { emailOnlySchema, type EmailOnlyBody } from '#application/controllers/auth/schemas/emailOnlySchema';
import type { ResendVerificationEmailUseCase } from '#application/usecases/auth/ResendVerificationEmailUseCase';

export class ResendVerificationEmailController extends Controller {
  protected override readonly schema = emailOnlySchema;

  constructor(private readonly resendVerificationEmailUseCase: ResendVerificationEmailUseCase) {
    super();
  }

  protected override async handle({ body }: Controller.Request<'public', EmailOnlyBody>): Promise<Controller.Response> {
    await this.resendVerificationEmailUseCase.execute(body);

    return { statusCode: 204 };
  }
}
