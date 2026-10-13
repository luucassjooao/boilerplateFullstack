import { Controller } from '#application/contracts/Controller';
import type { OAuthTransactionCookie } from '#application/controllers/auth/OAuthTransactionCookie';
import { authorizeQuerySchema } from '#application/controllers/auth/schemas/oauthSchemas';
import type { StartOAuthUseCase } from '#application/usecases/auth/StartOAuthUseCase';

export class OAuthAuthorizeController extends Controller {
  constructor(
    private readonly startOAuthUseCase: StartOAuthUseCase,
    private readonly transactionCookie: OAuthTransactionCookie,
  ) {
    super();
  }

  protected override async handle({ params, queryParams }: Controller.Request): Promise<Controller.Response> {
    const { redirectTo } = authorizeQuerySchema.parse(queryParams);
    const { authorizationUrl, transaction, usesFormPost } = this.startOAuthUseCase.execute({
      provider: params.provider,
      redirectTo,
    });

    return {
      statusCode: 302,
      redirectTo: authorizationUrl.toString(),
      cookies: [this.transactionCookie.create(transaction, usesFormPost)],
    };
  }
}
