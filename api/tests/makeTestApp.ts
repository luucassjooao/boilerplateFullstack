import { pino } from 'pino';
import { JoseAccessTokenService } from '#infra/auth/JoseAccessTokenService';
import type { Infra } from '#main/composition/infra';
import { makeAppConfig } from '#main/config/AppConfig';
import { loadEnv } from '#main/config/env';
import { buildServer } from '#main/server';

export const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  WEB_ORIGINS: 'http://localhost:5173',
  COOKIE_SECRET: 'test-cookie-secret-with-at-least-32-bytes',
  JWT_SECRET: 'test-jwt-secret-with-at-least-32-bytes!!',
};

export function makeTestConfig(overrides: Record<string, string> = {}) {
  return makeAppConfig(loadEnv({ ...testEnv, ...overrides }));
}

export async function makeTestApp() {
  const config = makeTestConfig();
  const infra: Infra = {
    logger: pino({ level: 'silent' }),
    accessTokenService: new JoseAccessTokenService(config.jwt),
    close: async () => {},
  };

  const app = await buildServer({ config, infra });

  return { app, config, infra };
}
