import type { FastifyInstance } from 'fastify';
import type { FastifyRouteAdapter } from '#main/adapters/fastifyRouteAdapter';
import type { AuthModule } from '#main/composition/auth';

/** Stricter per-IP limit on routes that are brute-force or spam targets. */
const strict = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

export function registerAuthRoutes(app: FastifyInstance, adapt: FastifyRouteAdapter, { controllers }: AuthModule) {
  const pub = { type: 'public' } as const;

  app.post('/auth/sign-up', strict, adapt(controllers.signUp, pub));
  app.post('/auth/verify-email', strict, adapt(controllers.verifyEmail, pub));
  app.post('/auth/verify-email/resend', strict, adapt(controllers.resendVerificationEmail, pub));
  app.post('/auth/sign-in', strict, adapt(controllers.signIn, pub));
  app.post('/auth/refresh', adapt(controllers.refresh, pub));
  app.post('/auth/sign-out', adapt(controllers.signOut, pub));
  app.post('/auth/forgot-password', strict, adapt(controllers.forgotPassword, pub));
  app.post('/auth/reset-password', strict, adapt(controllers.resetPassword, pub));

  app.get('/auth/oauth/:provider/authorize', adapt(controllers.oauthAuthorize, pub));
  // GET for Google, form_post for Apple.
  app.get('/auth/oauth/:provider/callback', adapt(controllers.oauthCallback, pub));
  app.post('/auth/oauth/:provider/callback', adapt(controllers.oauthCallback, pub));
  app.post('/auth/oauth/:provider/token', strict, adapt(controllers.oauthToken, pub));
}
