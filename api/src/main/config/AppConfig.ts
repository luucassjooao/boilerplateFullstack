import type { Env } from '#main/config/env';

export function makeAppConfig(env: Env) {
  return {
    env: env.NODE_ENV,
    server: {
      host: env.HOST,
      port: env.PORT,
      trustProxy: env.TRUST_PROXY,
    },
    log: {
      level: env.LOG_LEVEL,
    },
    web: {
      origins: env.WEB_ORIGINS,
    },
    cookies: {
      secret: env.COOKIE_SECRET,
    },
    jwt: {
      secret: env.JWT_SECRET,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresInSeconds: 15 * 60,
    },
  } as const;
}

export type AppConfig = ReturnType<typeof makeAppConfig>;
