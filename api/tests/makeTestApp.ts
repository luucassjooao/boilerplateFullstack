import { pino } from 'pino';
import { Argon2PasswordHasher } from '#infra/auth/Argon2PasswordHasher';
import { CryptoOpaqueTokenService } from '#infra/auth/CryptoOpaqueTokenService';
import { JoseAccessTokenService } from '#infra/auth/JoseAccessTokenService';
import { InMemoryAuthIdentitiesRepository } from '#infra/database/in-memory/InMemoryAuthIdentitiesRepository';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';
import { InMemoryRefreshTokensRepository } from '#infra/database/in-memory/InMemoryRefreshTokensRepository';
import { InMemoryUsersRepository } from '#infra/database/in-memory/InMemoryUsersRepository';
import { InMemoryVerificationCodesRepository } from '#infra/database/in-memory/InMemoryVerificationCodesRepository';
import type { Infra } from '#main/composition/infra';
import { makeAppConfig } from '#main/config/AppConfig';
import { loadEnv } from '#main/config/env';
import { buildServer } from '#main/server';
import { FakeEmailGateway } from '#tests/fakes/FakeEmailGateway';
import { FakeOAuthProvider } from '#tests/fakes/FakeOAuthProvider';

export const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  WEB_ORIGINS: 'http://localhost:5173',
  COOKIE_SECRET: 'test-cookie-secret-with-at-least-32-bytes',
  COOKIE_SECURE: 'false',
  JWT_SECRET: 'test-jwt-secret-with-at-least-32-bytes!!',
  DATABASE_URL: 'postgres://unused:unused@localhost:5432/unused',
  CODE_HASH_SECRET: 'test-code-hash-secret-with-at-least-32-bytes',
  API_URL: 'http://api.test',
  WEB_URL: 'http://localhost:5173',
};

export function makeTestConfig(overrides: Record<string, string> = {}) {
  return makeAppConfig(loadEnv({ ...testEnv, ...overrides }));
}

/** Composition for tests: same wiring as production, with in-memory repositories and fakes. */
export function makeTestInfra(config = makeTestConfig()) {
  const database = new InMemoryDatabase();
  const emailGateway = new FakeEmailGateway();
  const oauth = { google: new FakeOAuthProvider('google'), apple: new FakeOAuthProvider('apple', true) };
  const infra: Infra = {
    logger: pino({ level: 'silent' }),
    usersRepository: new InMemoryUsersRepository(database),
    authIdentitiesRepository: new InMemoryAuthIdentitiesRepository(database),
    refreshTokensRepository: new InMemoryRefreshTokensRepository(database),
    verificationCodesRepository: new InMemoryVerificationCodesRepository(database),
    passwordHasher: new Argon2PasswordHasher(),
    accessTokenService: new JoseAccessTokenService(config.jwt),
    opaqueTokenService: new CryptoOpaqueTokenService(),
    emailGateway,
    oauthProviders: oauth,
    close: async () => {},
  };

  return { infra, database, emailGateway, oauth };
}

export async function makeTestApp() {
  const config = makeTestConfig();
  const { infra, database, emailGateway, oauth } = makeTestInfra(config);
  const app = await buildServer({ config, infra });

  return { app, config, infra, database, emailGateway, oauth };
}
