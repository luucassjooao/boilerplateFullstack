import type { FastifyInstance } from 'fastify';
import { HealthController } from '#application/controllers/health/HealthController';
import type { FastifyRouteAdapter } from '#main/adapters/fastifyRouteAdapter';

export function registerHealthRoutes(app: FastifyInstance, adapt: FastifyRouteAdapter) {
  app.get('/health', adapt(new HealthController(), { type: 'public' }));
}
