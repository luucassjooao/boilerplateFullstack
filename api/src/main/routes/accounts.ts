import type { FastifyInstance } from 'fastify';
import type { FastifyRouteAdapter } from '#main/adapters/fastifyRouteAdapter';
import type { AccountsModule } from '#main/composition/accounts';

export function registerAccountsRoutes(app: FastifyInstance, adapt: FastifyRouteAdapter, { controllers }: AccountsModule) {
  app.get('/me', adapt(controllers.getMe, { type: 'private' }));
}
