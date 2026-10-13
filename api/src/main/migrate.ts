import { z } from 'zod';
import { makeDrizzleClient } from '#infra/database/drizzle/client';
import { runMigrations } from '#infra/database/drizzle/migrate';

// Only DATABASE_URL is needed here, so migrations can run without the app secrets.
const { DATABASE_URL } = z.object({ DATABASE_URL: z.url() }).parse(process.env);
const { db, close } = makeDrizzleClient(DATABASE_URL);

try {
  await runMigrations(db);
  process.stdout.write('Migrations applied\n');
} finally {
  await close();
}
