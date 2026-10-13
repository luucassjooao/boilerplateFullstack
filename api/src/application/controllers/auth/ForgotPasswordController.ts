import { Controller } from '#application/contracts/Controller';
import { emailOnlySchema, type EmailOnlyBody } from '#application/controllers/auth/schemas/emailOnlySchema';
import type { ForgotPasswordUseCase } from '#application/usecases/auth/ForgotPasswordUseCase';

export class ForgotPasswordController extends Controller {
  protected override readonly schema = emailOnlySchema;

  constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {
    super();
  }

  protected override async handle({ body }: Controller.Request<'public', EmailOnlyBody>): Promise<Controller.Response> {
    await this.forgotPasswordUseCase.execute(body);

    return { statusCode: 204 };
  }
}
