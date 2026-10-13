import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool } from 'pg';

/**
 * Vitest globalSetup: creates the test database if needed and applies migrations.
 * No `#` imports here: globalSetup runs in Vitest's internal Vite environment, which ignores the `source` condition.
 */
export default async function setup() {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  const database = url.pathname.slice(1);
  const adminUrl = new URL(url);

  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });

  await admin.connect();

  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);

    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${database.replaceAll('"', '""')}"`);
    }
  } finally {
    await admin.end();
  }

  const pool = new Pool({ connectionString: url.toString() });

  try {
    await migrate(drizzle(pool), { migrationsFolder: 'src/infra/database/drizzle/migrations' });
  } finally {
    await pool.end();
  }
}
