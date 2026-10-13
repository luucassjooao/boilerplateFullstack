import type { IAuthIdentitiesRepository } from '#application/contracts/repositories/IAuthIdentitiesRepository';
import type { IRefreshTokensRepository } from '#application/contracts/repositories/IRefreshTokensRepository';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import type { IVerificationCodesRepository } from '#application/contracts/repositories/IVerificationCodesRepository';

/** Repositories of one implementation sharing one (empty) store. */
export type Repositories = {
  users: IUsersRepository;
  authIdentities: IAuthIdentitiesRepository;
  refreshTokens: IRefreshTokensRepository;
  verificationCodes: IVerificationCodesRepository;
};

export type MakeRepositories = () => Promise<Repositories>;
