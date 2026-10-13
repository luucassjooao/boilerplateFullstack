import { Controller } from '#application/contracts/Controller';
import { oauthTokenSchema, type OAuthTokenBody } from '#application/controllers/auth/schemas/oauthSchemas';
import type { SessionTransport } from '#application/controllers/auth/SessionTransport';
import { userAgent } from '#application/controllers/auth/userAgent';
import type { OAuthTokenSignInUseCase } from '#application/usecases/auth/OAuthTokenSignInUseCase';

export class OAuthTokenController extends Controller<'public', SessionTransport.Body> {
  protected override readonly schema = oauthTokenSchema;

  constructor(
    private readonly oauthTokenSignInUseCase: OAuthTokenSignInUseCase,
    private readonly sessionTransport: SessionTransport,
  ) {
    super();
  }

  protected override async handle({ body, params, headers }: Controller.Request<'public', OAuthTokenBody>) {
    const platform = this.sessionTransport.getPlatform(headers);
    const session = await this.oauthTokenSignInUseCase.execute({
      provider: params.provider,
      ...body,
      userAgent: userAgent(headers),
    });

    return this.sessionTransport.respond(session, platform);
  }
}
