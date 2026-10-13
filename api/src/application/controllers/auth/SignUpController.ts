import { Controller } from '#application/contracts/Controller';
import { signUpSchema, type SignUpBody } from '#application/controllers/auth/schemas/signUpSchema';
import type { SignUpUseCase } from '#application/usecases/auth/SignUpUseCase';

export class SignUpController extends Controller {
  protected override readonly schema = signUpSchema;

  constructor(private readonly signUpUseCase: SignUpUseCase) {
    super();
  }

  protected override async handle({ body }: Controller.Request<'public', SignUpBody>): Promise<Controller.Response> {
    await this.signUpUseCase.execute(body);

    return { statusCode: 201 };
  }
}
