import { Controller } from '#application/contracts/Controller';
import { refreshTokenSchema, type RefreshTokenBody } from '#application/controllers/auth/schemas/refreshTokenSchema';
import type { SessionTransport } from '#application/controllers/auth/SessionTransport';
import type { SignOutUseCase } from '#application/usecases/auth/SignOutUseCase';

export class SignOutController extends Controller {
  protected override readonly schema = refreshTokenSchema;

  constructor(
    private readonly signOutUseCase: SignOutUseCase,
    private readonly sessionTransport: SessionTransport,
  ) {
    super();
  }

  protected override async handle(request: Controller.Request<'public', RefreshTokenBody>): Promise<Controller.Response> {
    const refreshToken = this.sessionTransport.readRefreshToken(request);

    if (refreshToken) {
      await this.signOutUseCase.execute({ refreshToken });
    }

    return { statusCode: 204, cookies: [this.sessionTransport.clearRefreshCookie()] };
  }
}
