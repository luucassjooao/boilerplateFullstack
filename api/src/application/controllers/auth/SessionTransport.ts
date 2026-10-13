import type { Controller } from '#application/contracts/Controller';
import { BadRequest } from '#application/errors/http/BadRequest';
import { Forbidden } from '#application/errors/http/Forbidden';
import type { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';

/**
 * How a session travels per platform (header `X-Client-Platform`):
 * - web: `{ accessToken }` + httpOnly `refresh_token` cookie (Path=/auth);
 * - mobile: `{ accessToken, refreshToken }` in the body.
 */
export class SessionTransport {
  static readonly COOKIE_NAME = 'refresh_token';

  constructor(private readonly options: SessionTransport.Options) {}

  getPlatform(headers: Controller.Request['headers']): SessionTransport.Platform {
    const platform = headers['x-client-platform'];

    if (platform !== 'web' && platform !== 'mobile') {
      throw new BadRequest('Header X-Client-Platform must be "web" or "mobile"');
    }

    return platform;
  }

  /** CSRF protection for routes that read the cookie. */
  assertTrustedOrigin(headers: Controller.Request['headers']): void {
    const origin = headers.origin;

    if (!origin || !this.options.allowedOrigins.includes(origin)) {
      throw new Forbidden('Origin not allowed');
    }
  }

  /** Reads the refresh token for the platform. Web requests are origin-checked first. */
  readRefreshToken(request: Controller.Request<'public', { refreshToken?: string }>): string | null {
    if (this.getPlatform(request.headers) === 'web') {
      this.assertTrustedOrigin(request.headers);

      return request.cookies[SessionTransport.COOKIE_NAME] ?? null;
    }

    return request.body.refreshToken ?? null;
  }

  respond(
    session: StartSessionUseCase.Output,
    platform: SessionTransport.Platform,
  ): Controller.Response<SessionTransport.Body> {
    if (platform === 'mobile') {
      return { statusCode: 200, body: session };
    }

    return {
      statusCode: 200,
      body: { accessToken: session.accessToken },
      cookies: [this.refreshCookie(session.refreshToken)],
    };
  }

  refreshCookie(refreshToken: string): Controller.Cookie {
    return {
      name: SessionTransport.COOKIE_NAME,
      value: refreshToken,
      options: { ...this.cookieOptions(), maxAge: this.options.refreshTokenTtlSeconds },
    };
  }

  clearRefreshCookie(): Controller.Cookie {
    return { name: SessionTransport.COOKIE_NAME, clear: true, options: this.cookieOptions() };
  }

  private cookieOptions(): Controller.CookieOptions {
    return { httpOnly: true, secure: this.options.secureCookies, sameSite: 'lax', path: '/auth' };
  }
}

export namespace SessionTransport {
  export type Platform = 'web' | 'mobile';

  export type Body = { accessToken: string; refreshToken?: string };

  export type Options = {
    allowedOrigins: readonly string[];
    secureCookies: boolean;
    refreshTokenTtlSeconds: number;
  };
}
