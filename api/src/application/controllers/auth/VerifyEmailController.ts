import { Controller } from '#application/contracts/Controller';
import { verifyEmailSchema, type VerifyEmailBody } from '#application/controllers/auth/schemas/verifyEmailSchema';
import type { SessionTransport } from '#application/controllers/auth/SessionTransport';
import { userAgent } from '#application/controllers/auth/userAgent';
import type { VerifyEmailUseCase } from '#application/usecases/auth/VerifyEmailUseCase';

export class VerifyEmailController extends Controller<'public', SessionTransport.Body> {
  protected override readonly schema = verifyEmailSchema;

  constructor(
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly sessionTransport: SessionTransport,
  ) {
    super();
  }

  protected override async handle({ body, headers }: Controller.Request<'public', VerifyEmailBody>) {
    const platform = this.sessionTransport.getPlatform(headers);
    const session = await this.verifyEmailUseCase.execute({ ...body, userAgent: userAgent(headers) });

    return this.sessionTransport.respond(session, platform);
  }
}
