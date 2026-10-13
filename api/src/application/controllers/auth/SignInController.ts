import { Controller } from '#application/contracts/Controller';
import { signInSchema, type SignInBody } from '#application/controllers/auth/schemas/signInSchema';
import type { SessionTransport } from '#application/controllers/auth/SessionTransport';
import { userAgent } from '#application/controllers/auth/userAgent';
import type { SignInUseCase } from '#application/usecases/auth/SignInUseCase';

export class SignInController extends Controller<'public', SessionTransport.Body> {
  protected override readonly schema = signInSchema;

  constructor(
    private readonly signInUseCase: SignInUseCase,
    private readonly sessionTransport: SessionTransport,
  ) {
    super();
  }

  protected override async handle({ body, headers }: Controller.Request<'public', SignInBody>) {
    const platform = this.sessionTransport.getPlatform(headers);
    const session = await this.signInUseCase.execute({ ...body, userAgent: userAgent(headers) });

    return this.sessionTransport.respond(session, platform);
  }
}
