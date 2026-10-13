import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyBaseLogger } from 'fastify';
import { NotFound } from '#application/errors/http/NotFound';
import { makeFastifyRouteAdapter } from '#main/adapters/fastifyRouteAdapter';
import { internalServerErrorResponse, toErrorResponse } from '#main/adapters/toErrorResponse';
import { makeAccountsModule } from '#main/composition/accounts';
import { makeAuthModule } from '#main/composition/auth';
import type { Infra } from '#main/composition/infra';
import type { AppConfig } from '#main/config/AppConfig';
import { registerAccountsRoutes } from '#main/routes/accounts';
import { registerAuthRoutes } from '#main/routes/auth';
import { registerHealthRoutes } from '#main/routes/health';

export async function buildServer({ config, infra }: { config: AppConfig; infra: Infra }) {
  const app = Fastify({
    // Typed as Fastify's base logger so route modules can take a plain FastifyInstance.
    loggerInstance: infra.logger as FastifyBaseLogger,
    trustProxy: config.server.trustProxy,
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: [...config.web.origins],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform'],
  });
  await app.register(cookie, { secret: config.cookies.secret });
  await app.register(rateLimit, { global: true, max: 100, timeWindow: '1 minute' });

  app.setErrorHandler((error, request, reply) => {
    const response = toErrorResponse(error);

    if (!response) {
      request.log.error({ err: error }, 'Unhandled error');

      return reply.code(internalServerErrorResponse.statusCode).send(internalServerErrorResponse.body);
    }

    return reply.code(response.statusCode).send(response.body);
  });

  app.setNotFoundHandler((request, reply) => {
    const response = toErrorResponse(new NotFound(`Route ${request.method} ${request.url.split('?')[0]} not found`));

    return reply.code(404).send(response?.body);
  });

  app.addHook('onClose', () => infra.close());

  const adapt = makeFastifyRouteAdapter(infra);

  registerHealthRoutes(app, adapt);
  registerAuthRoutes(app, adapt, makeAuthModule(config, infra));
  registerAccountsRoutes(app, adapt, makeAccountsModule(infra));

  return app;
}
