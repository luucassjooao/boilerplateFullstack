import { Controller } from '#application/contracts/Controller';
import { resetPasswordSchema, type ResetPasswordBody } from '#application/controllers/auth/schemas/resetPasswordSchema';
import type { ResetPasswordUseCase } from '#application/usecases/auth/ResetPasswordUseCase';

export class ResetPasswordController extends Controller {
  protected override readonly schema = resetPasswordSchema;

  constructor(private readonly resetPasswordUseCase: ResetPasswordUseCase) {
    super();
  }

  protected override async handle({ body }: Controller.Request<'public', ResetPasswordBody>): Promise<Controller.Response> {
    await this.resetPasswordUseCase.execute(body);

    return { statusCode: 204 };
  }
}
