import { Controller } from '#application/contracts/Controller';
import type { OAuthTransactionCookie } from '#application/controllers/auth/OAuthTransactionCookie';
import type { SessionTransport } from '#application/controllers/auth/SessionTransport';
import { userAgent } from '#application/controllers/auth/userAgent';
import { ApplicationError } from '#application/errors/application/ApplicationError';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import { HttpError } from '#application/errors/http/HttpError';
import type { CompleteOAuthUseCase } from '#application/usecases/auth/CompleteOAuthUseCase';

/**
 * Provider → API (GET for Google, form_post for Apple) → 302 to the web app.
 * Success sets the refresh cookie; the web page then calls /auth/refresh. No token travels in the URL.
 * Known errors redirect with `?error=CODE`; unexpected ones bubble up (logged, 500).
 */
export class OAuthCallbackController extends Controller {
  constructor(
    private readonly completeOAuthUseCase: CompleteOAuthUseCase,
    private readonly sessionTransport: SessionTransport,
    private readonly transactionCookie: OAuthTransactionCookie,
    private readonly options: { webUrl: string },
  ) {
    super();
  }

  protected override async handle(request: Controller.Request): Promise<Controller.Response> {
    const input: Record<string, unknown> = { ...request.queryParams, ...request.body };
    const transaction = this.transactionCookie.read(request.signedCookies);
    const clearTransaction = this.transactionCookie.clear(request.params.provider === 'apple');

    try {
      if (input.error !== undefined) {
        throw new OAuthFailed(`Provider returned an error: ${String(input.error)}`);
      }

      const { session, redirectTo } = await this.completeOAuthUseCase.execute({
        provider: request.params.provider,
        code: asString(input.code),
        state: asString(input.state),
        transaction,
        name: parseAppleUserName(input.user),
        userAgent: userAgent(request.headers),
      });

      return {
        statusCode: 302,
        redirectTo: this.webCallbackUrl({ redirectTo }),
        cookies: [this.sessionTransport.refreshCookie(session.refreshToken), clearTransaction],
      };
    } catch (error) {
      if (error instanceof ApplicationError || error instanceof HttpError) {
        return {
          statusCode: 302,
          redirectTo: this.webCallbackUrl({ error: error.code }),
          cookies: [clearTransaction],
        };
      }

      throw error;
    }
  }

  private webCallbackUrl(params: Record<string, string>): string {
    const url = new URL('/auth/callback', this.options.webUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Apple posts `user={"name":{"firstName","lastName"},"email"}` on the first sign-in only. */
function parseAppleUserName(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  try {
    const { name } = JSON.parse(raw) as { name?: { firstName?: unknown; lastName?: unknown } };
    const full = [name?.firstName, name?.lastName]
      .filter((part): part is string => typeof part === 'string')
      .join(' ')
      .trim();

    return full || null;
  } catch {
    return null;
  }
}
