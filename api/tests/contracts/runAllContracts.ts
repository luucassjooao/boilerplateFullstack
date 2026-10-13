import { runAuthIdentitiesRepositoryContract } from '#tests/contracts/AuthIdentitiesRepository.contract';
import { runRefreshTokensRepositoryContract } from '#tests/contracts/RefreshTokensRepository.contract';
import type { MakeRepositories } from '#tests/contracts/Repositories';
import { runUsersRepositoryContract } from '#tests/contracts/UsersRepository.contract';
import { runVerificationCodesRepositoryContract } from '#tests/contracts/VerificationCodesRepository.contract';

export function runAllContracts(makeRepositories: MakeRepositories) {
  runUsersRepositoryContract(makeRepositories);
  runAuthIdentitiesRepositoryContract(makeRepositories);
  runRefreshTokensRepositoryContract(makeRepositories);
  runVerificationCodesRepositoryContract(makeRepositories);
}
