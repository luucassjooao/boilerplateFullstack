import type { IOpaqueTokenService } from '#application/contracts/gateways/IOpaqueTokenService';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import { InvalidRefreshToken } from '#application/errors/application/InvalidRefreshToken';
import type { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';

/**
 * Rotates the refresh token. Reuse of an already used token:
 * - within `reuseGraceSeconds` → legit race between tabs/requests: 401, family kept;
 * - after that → probable theft: the whole family is revoked, 401.
 */
export class RefreshSessionUseCase {
  constructor(
    private readonly refreshTokensRepository: IRefreshTokensRepository,
    private readonly opaqueTokenService: IOpaqueTokenService,
    private readonly startSession: StartSessionUseCase,
    private readonly options: RefreshSessionUseCase.Options,
  ) {}

  async execute({ refreshToken, userAgent }: RefreshSessionUseCase.Input): Promise<RefreshSessionUseCase.Output> {
    const tokenHash = this.opaqueTokenService.hash(refreshToken);
    const now = new Date();
    const consumed = await this.refreshTokensRepository.consume(tokenHash, now);

    if (consumed) {
      if (consumed.isExpired(now)) {
        throw new InvalidRefreshToken();
      }

      return this.startSession.execute({ userId: consumed.userId, familyId: consumed.familyId, userAgent });
    }

    const stored = await this.refreshTokensRepository.findByHash(tokenHash);

    if (stored?.usedAt && !stored.revokedAt) {
      const usedSecondsAgo = (now.getTime() - stored.usedAt.getTime()) / 1000;

      if (usedSecondsAgo > this.options.reuseGraceSeconds) {
        await this.refreshTokensRepository.revokeFamily(stored.familyId, now);
      }
    }

    throw new InvalidRefreshToken();
  }
}

export namespace RefreshSessionUseCase {
  export type Options = { reuseGraceSeconds: number };

  export type Input = {
    refreshToken: string;
    userAgent: string | null;
  };

  export type Output = StartSessionUseCase.Output;
}
