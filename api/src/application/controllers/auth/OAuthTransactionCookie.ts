import type { Controller } from '#application/contracts/Controller';
import { oauthTransactionSchema } from '#application/controllers/auth/schemas/oauthSchemas';
import type { StartOAuthUseCase } from '#application/usecases/auth/StartOAuthUseCase';

/** Short-lived signed cookie carrying state, PKCE verifier and nonce between authorize and callback. */
export class OAuthTransactionCookie {
  static readonly NAME = 'oauth_tx';

  constructor(private readonly options: { secureCookies: boolean }) {}

  create(transaction: StartOAuthUseCase.Transaction, usesFormPost: boolean): Controller.Cookie {
    return {
      name: OAuthTransactionCookie.NAME,
      value: JSON.stringify(transaction),
      options: { ...this.cookieOptions(usesFormPost), maxAge: 10 * 60, signed: true },
    };
  }

  /** Expects the signature to be already checked (Controller.Request.signedCookies). */
  read(signedCookies: Controller.Request['signedCookies']): StartOAuthUseCase.Transaction | null {
    try {
      return oauthTransactionSchema.parse(JSON.parse(signedCookies[OAuthTransactionCookie.NAME] ?? ''));
    } catch {
      return null;
    }
  }

  clear(usesFormPost: boolean): Controller.Cookie {
    return { name: OAuthTransactionCookie.NAME, clear: true, options: this.cookieOptions(usesFormPost) };
  }

  private cookieOptions(usesFormPost: boolean): Controller.CookieOptions {
    // A form_post callback is a cross-site POST: only SameSite=None (which requires Secure) cookies go along.
    return usesFormPost
      ? { httpOnly: true, path: '/auth/oauth', sameSite: 'none', secure: true }
      : { httpOnly: true, path: '/auth/oauth', sameSite: 'lax', secure: this.options.secureCookies };
  }
}
