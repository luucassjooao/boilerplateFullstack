import { v7 as uuidv7 } from 'uuid';
import type { IAccessTokenService } from '#application/contracts/gateways/IAccessTokenService';
import type { IOpaqueTokenService } from '#application/contracts/gateways/IOpaqueTokenService';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import { RefreshToken } from '#application/entities/RefreshToken';

/** Issues an access token + a refresh token. Without `familyId` a new family (login) is started. */
export class StartSessionUseCase {
  constructor(
    private readonly refreshTokensRepository: IRefreshTokensRepository,
    private readonly accessTokenService: IAccessTokenService,
    private readonly opaqueTokenService: IOpaqueTokenService,
    private readonly options: StartSessionUseCase.Options,
  ) {}

  async execute({ userId, familyId, userAgent }: StartSessionUseCase.Input): Promise<StartSessionUseCase.Output> {
    const { token, hash } = this.opaqueTokenService.generate();
    const now = new Date();

    await this.refreshTokensRepository.create(new RefreshToken({
      userId,
      familyId: familyId ?? uuidv7(),
      tokenHash: hash,
      expiresAt: new Date(now.getTime() + this.options.refreshTokenTtlSeconds * 1000),
      createdAt: now,
      userAgent,
    }));

    const accessToken = await this.accessTokenService.sign({ userId });

    return { accessToken, refreshToken: token };
  }
}

export namespace StartSessionUseCase {
  export type Options = { refreshTokenTtlSeconds: number };

  export type Input = {
    userId: string;
    familyId?: string;
    userAgent: string | null;
  };

  export type Output = {
    accessToken: string;
    refreshToken: string;
  };
}
