import { sql } from 'drizzle-orm';
import { afterAll, describe } from 'vitest';
import { makeDrizzleClient } from '#infra/database/drizzle/client';
import { DrizzleAuthIdentitiesRepository } from '#infra/database/drizzle/repositories/DrizzleAuthIdentitiesRepository';
import { DrizzleRefreshTokensRepository } from '#infra/database/drizzle/repositories/DrizzleRefreshTokensRepository';
import { DrizzleUsersRepository } from '#infra/database/drizzle/repositories/DrizzleUsersRepository';
import { DrizzleVerificationCodesRepository } from '#infra/database/drizzle/repositories/DrizzleVerificationCodesRepository';
import { runAllContracts } from '#tests/contracts/runAllContracts';

const { db, close } = makeDrizzleClient(process.env.TEST_DATABASE_URL!);

afterAll(close);

describe('drizzle repositories (Postgres)', () => {
  runAllContracts(async () => {
    await db.execute(sql`TRUNCATE users, auth_identities, refresh_tokens, verification_codes CASCADE`);

    return {
      users: new DrizzleUsersRepository(db),
      authIdentities: new DrizzleAuthIdentitiesRepository(db),
      refreshTokens: new DrizzleRefreshTokensRepository(db),
      verificationCodes: new DrizzleVerificationCodesRepository(db),
    };
  });
});
