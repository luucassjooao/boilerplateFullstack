import { pino, type DestinationStream, type Logger } from 'pino';
import type { IAccessTokenService } from '#application/contracts/gateways/IAccessTokenService';
import { JoseAccessTokenService } from '#infra/auth/JoseAccessTokenService';
import type { AppConfig } from '#main/config/AppConfig';

export type Infra = {
  logger: Logger;
  accessTokenService: IAccessTokenService;
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

export function makeInfra(config: AppConfig): Infra {
  return {
    logger: makeLogger(config),
    accessTokenService: new JoseAccessTokenService(config.jwt),
    close: async () => {},
  };
}
