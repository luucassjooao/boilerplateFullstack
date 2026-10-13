import { Controller } from '#application/contracts/Controller';
import { refreshTokenSchema, type RefreshTokenBody } from '#application/controllers/auth/schemas/refreshTokenSchema';
import type { SessionTransport } from '#application/controllers/auth/SessionTransport';
import { userAgent } from '#application/controllers/auth/userAgent';
import { InvalidRefreshToken } from '#application/errors/application/InvalidRefreshToken';
import type { RefreshSessionUseCase } from '#application/usecases/auth/RefreshSessionUseCase';

export class RefreshSessionController extends Controller<'public', SessionTransport.Body> {
  protected override readonly schema = refreshTokenSchema;

  constructor(
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly sessionTransport: SessionTransport,
  ) {
    super();
  }

  protected override async handle(request: Controller.Request<'public', RefreshTokenBody>) {
    const refreshToken = this.sessionTransport.readRefreshToken(request);

    if (!refreshToken) {
      throw new InvalidRefreshToken();
    }

    const session = await this.refreshSessionUseCase.execute({ refreshToken, userAgent: userAgent(request.headers) });

    return this.sessionTransport.respond(session, this.sessionTransport.getPlatform(request.headers));
  }
}
