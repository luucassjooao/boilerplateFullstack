import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Controller } from '#application/contracts/Controller';
import type { IAccessTokenService } from '#application/contracts/gateways/IAccessTokenService';
import { Unauthorized } from '#application/errors/http/Unauthorized';

function normalizeHeaders(headers: FastifyRequest['headers']): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value]),
  );
}

function unsignCookies(request: FastifyRequest): Record<string, string | undefined> {
  const signed: Record<string, string> = {};

  for (const [name, value] of Object.entries(request.cookies)) {
    if (value === undefined) {
      continue;
    }

    const result = request.unsignCookie(value);

    if (result.valid && result.value !== null) {
      signed[name] = result.value;
    }
  }

  return signed;
}

function getBearerToken(authorization: string | undefined): string | null {
  const [scheme, token] = authorization?.split(' ') ?? [];

  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/**
 * Turns a framework-agnostic Controller into a Fastify handler.
 * Errors are not caught here: they bubble up to the error handler registered in server.ts.
 */
export function makeFastifyRouteAdapter({ accessTokenService }: { accessTokenService: IAccessTokenService }) {
  return function fastifyRouteAdapter<TType extends Controller.Type>(
    controller: Controller<TType, unknown>,
    { type }: { type: TType },
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      let userId: string | null = null;

      if (type === 'private') {
        const token = getBearerToken(request.headers.authorization);
        const payload = token ? await accessTokenService.verify(token) : null;

        if (!payload) {
          throw new Unauthorized();
        }

        userId = payload.userId;
      }

      const response = await controller.execute({
        body: (request.body ?? {}) as Record<string, unknown>,
        params: request.params as Record<string, string | undefined>,
        queryParams: request.query as Record<string, string | undefined>,
        headers: normalizeHeaders(request.headers),
        cookies: request.cookies,
        signedCookies: unsignCookies(request),
        userId: userId as Controller.Request<TType>['userId'],
      });

      for (const cookie of response.cookies ?? []) {
        if ('clear' in cookie) {
          reply.clearCookie(cookie.name, cookie.options);
        } else {
          reply.setCookie(cookie.name, cookie.value, cookie.options);
        }
      }

      if (response.headers) {
        reply.headers(response.headers);
      }

      if (response.redirectTo) {
        return reply.redirect(response.redirectTo, response.statusCode);
      }

      return reply.code(response.statusCode).send(response.body);
    };
  };
}

export type FastifyRouteAdapter = ReturnType<typeof makeFastifyRouteAdapter>;
