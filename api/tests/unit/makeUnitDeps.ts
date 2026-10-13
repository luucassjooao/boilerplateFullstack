import { VerificationCodeService } from '#application/services/VerificationCodeService';
import { ConsumeVerificationCodeUseCase } from '#application/usecases/auth/ConsumeVerificationCodeUseCase';
import { SendVerificationCodeUseCase } from '#application/usecases/auth/SendVerificationCodeUseCase';
import { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';
import { CryptoOpaqueTokenService } from '#infra/auth/CryptoOpaqueTokenService';
import { JoseAccessTokenService } from '#infra/auth/JoseAccessTokenService';
import { InMemoryAuthIdentitiesRepository } from '#infra/database/in-memory/InMemoryAuthIdentitiesRepository';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';
import { InMemoryRefreshTokensRepository } from '#infra/database/in-memory/InMemoryRefreshTokensRepository';
import { InMemoryUsersRepository } from '#infra/database/in-memory/InMemoryUsersRepository';
import { InMemoryVerificationCodesRepository } from '#infra/database/in-memory/InMemoryVerificationCodesRepository';
import { verificationCodeEmail } from '#infra/email/templates/verificationCodeEmail';
import { FakeEmailGateway } from '#tests/fakes/FakeEmailGateway';
import { FakePasswordHasher } from '#tests/fakes/FakePasswordHasher';

export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

/** In-memory repositories + fakes, wired like production. */
export function makeUnitDeps() {
  const database = new InMemoryDatabase();
  const usersRepository = new InMemoryUsersRepository(database);
  const authIdentitiesRepository = new InMemoryAuthIdentitiesRepository(database);
  const refreshTokensRepository = new InMemoryRefreshTokensRepository(database);
  const verificationCodesRepository = new InMemoryVerificationCodesRepository(database);
  const passwordHasher = new FakePasswordHasher();
  const emailGateway = new FakeEmailGateway();
  const opaqueTokenService = new CryptoOpaqueTokenService();
  const accessTokenService = new JoseAccessTokenService({
    secret: 'unit-test-secret-with-at-least-32-bytes!',
    issuer: 'api',
    audience: 'app',
    expiresInSeconds: 900,
  });
  const verificationCodeService = new VerificationCodeService('unit-test-code-secret-with-32-bytes!!');

  const startSession = new StartSessionUseCase(
    refreshTokensRepository,
    accessTokenService,
    opaqueTokenService,
    { refreshTokenTtlSeconds: REFRESH_TTL_SECONDS },
  );
  const sendVerificationCode = new SendVerificationCodeUseCase(
    verificationCodesRepository,
    verificationCodeService,
    emailGateway,
    { verificationCode: verificationCodeEmail },
    { ttlSeconds: 15 * 60 },
  );
  const consumeVerificationCode = new ConsumeVerificationCodeUseCase(
    verificationCodesRepository,
    verificationCodeService,
    { maxAttempts: 5 },
  );

  return {
    database,
    usersRepository,
    authIdentitiesRepository,
    refreshTokensRepository,
    verificationCodesRepository,
    passwordHasher,
    emailGateway,
    opaqueTokenService,
    accessTokenService,
    verificationCodeService,
    startSession,
    sendVerificationCode,
    consumeVerificationCode,
  };
}

export type UnitDeps = ReturnType<typeof makeUnitDeps>;
