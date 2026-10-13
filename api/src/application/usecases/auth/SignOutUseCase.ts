import type { IOpaqueTokenService } from '#application/contracts/gateways/IOpaqueTokenService';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';

/** Revokes the family of the given refresh token. Unknown tokens are ignored. */
export class SignOutUseCase {
  constructor(
    private readonly refreshTokensRepository: IRefreshTokensRepository,
    private readonly opaqueTokenService: IOpaqueTokenService,
  ) {}

  async execute({ refreshToken }: SignOutUseCase.Input): Promise<void> {
    const stored = await this.refreshTokensRepository.findByHash(this.opaqueTokenService.hash(refreshToken));

    if (stored && !stored.revokedAt) {
      await this.refreshTokensRepository.revokeFamily(stored.familyId, new Date());
    }
  }
}

export namespace SignOutUseCase {
  export type Input = { refreshToken: string };
}
