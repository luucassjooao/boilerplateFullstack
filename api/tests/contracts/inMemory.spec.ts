import { describe } from 'vitest';
import { InMemoryAuthIdentitiesRepository } from '#infra/database/in-memory/InMemoryAuthIdentitiesRepository';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';
import { InMemoryRefreshTokensRepository } from '#infra/database/in-memory/InMemoryRefreshTokensRepository';
import { InMemoryUsersRepository } from '#infra/database/in-memory/InMemoryUsersRepository';
import { InMemoryVerificationCodesRepository } from '#infra/database/in-memory/InMemoryVerificationCodesRepository';
import { runAllContracts } from '#tests/contracts/runAllContracts';

describe('in-memory repositories', () => {
  runAllContracts(async () => {
    const database = new InMemoryDatabase();

    return {
      users: new InMemoryUsersRepository(database),
      authIdentities: new InMemoryAuthIdentitiesRepository(database),
      refreshTokens: new InMemoryRefreshTokensRepository(database),
      verificationCodes: new InMemoryVerificationCodesRepository(database),
    };
  });
});
