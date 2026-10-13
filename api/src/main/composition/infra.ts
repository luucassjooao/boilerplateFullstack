import { pino, type DestinationStream, type Logger } from 'pino';
import type { IAccessTokenService } from '#application/contracts/gateways/IAccessTokenService';
import type { IEmailGateway } from '#application/contracts/gateways/IEmailGateway';
import type { IOpaqueTokenService } from '#application/contracts/gateways/IOpaqueTokenService';
import type { IPasswordHasher } from '#application/contracts/gateways/IPasswordHasher';
import type { IAuthIdentitiesRepository } from '#application/contracts/repositories/IAuthIdentitiesRepository';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import type { IVerificationCodesRepository } from '#application/contracts/repositories/IVerificationCodesRepository';
import { Argon2PasswordHasher } from '#infra/auth/Argon2PasswordHasher';
import { CryptoOpaqueTokenService } from '#infra/auth/CryptoOpaqueTokenService';
import { JoseAccessTokenService } from '#infra/auth/JoseAccessTokenService';
import { makeDrizzleClient } from '#infra/database/drizzle/client';
import { DrizzleAuthIdentitiesRepository } from '#infra/database/drizzle/repositories/DrizzleAuthIdentitiesRepository';
import { DrizzleRefreshTokensRepository } from '#infra/database/drizzle/repositories/DrizzleRefreshTokensRepository';
import { DrizzleUsersRepository } from '#infra/database/drizzle/repositories/DrizzleUsersRepository';
import { DrizzleVerificationCodesRepository } from '#infra/database/drizzle/repositories/DrizzleVerificationCodesRepository';
import { ConsoleEmailGateway } from '#infra/email/ConsoleEmailGateway';
import { ResendEmailGateway } from '#infra/email/ResendEmailGateway';
import type { AppConfig } from '#main/config/AppConfig';

/** Every infrastructure singleton the application needs. Swap implementations here only. */
export type Infra = {
  logger: Logger;
  usersRepository: IUsersRepository;
  authIdentitiesRepository: IAuthIdentitiesRepository;
  refreshTokensRepository: IRefreshTokensRepository;
  verificationCodesRepository: IVerificationCodesRepository;
  passwordHasher: IPasswordHasher;
  accessTokenService: IAccessTokenService;
  opaqueTokenService: IOpaqueTokenService;
  emailGateway: IEmailGateway;
  close(): Promise<void>;
};

const SENSITIVE_KEYS = ['password', 'refreshToken', 'accessToken', 'idToken', 'token', 'code', 'nonce'];

export function makeLogger(config: AppConfig, destination?: DestinationStream): Logger {
  return pino({
    level: config.log.level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        ...SENSITIVE_KEYS,
        ...SENSITIVE_KEYS.map((key) => `*.${key}`),
      ],
      censor: '[REDACTED]',
    },
    serializers: {
      // The query string is dropped: OAuth callbacks carry `code` and `state` in it.
      req: (req: { method: string; url: string; ip?: string }) => ({
        method: req.method,
        url: req.url.split('?')[0],
        remoteAddress: req.ip,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      err: pino.stdSerializers.err,
    },
  }, destination);
}

function makeEmailGateway(config: AppConfig, logger: Logger): IEmailGateway {
  if (config.email.provider === 'resend' && config.email.resendApiKey) {
    return new ResendEmailGateway({ apiKey: config.email.resendApiKey, from: config.email.from });
  }

  if (config.env === 'production') {
    logger.warn('EMAIL_PROVIDER=console in production: verification codes will be written to the logs');
  }

  return new ConsoleEmailGateway(logger);
}

export function makeInfra(config: AppConfig): Infra {
  const logger = makeLogger(config);
  const { db, close } = makeDrizzleClient(config.database.url);

  return {
    logger,
    usersRepository: new DrizzleUsersRepository(db),
    authIdentitiesRepository: new DrizzleAuthIdentitiesRepository(db),
    refreshTokensRepository: new DrizzleRefreshTokensRepository(db),
    verificationCodesRepository: new DrizzleVerificationCodesRepository(db),
    passwordHasher: new Argon2PasswordHasher(),
    accessTokenService: new JoseAccessTokenService(config.jwt),
    opaqueTokenService: new CryptoOpaqueTokenService(),
    emailGateway: makeEmailGateway(config, logger),
    close,
  };
}
