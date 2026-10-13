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
      secure: env.COOKIE_SECURE,
    },
    database: {
      url: env.DATABASE_URL,
    },
    auth: {
      codeHashSecret: env.CODE_HASH_SECRET,
      refreshTokenTtlSeconds: 30 * 24 * 60 * 60,
      refreshTokenReuseGraceSeconds: 30,
      verificationCodeTtlSeconds: 15 * 60,
      verificationCodeMaxAttempts: 5,
    },
    email: {
      provider: env.EMAIL_PROVIDER,
      from: env.EMAIL_FROM,
      resendApiKey: env.RESEND_API_KEY,
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
