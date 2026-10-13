import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { DrizzleDatabase } from '#infra/database/drizzle/client';

// `build` copies this folder to dist, so the same path works from src and dist.
const migrationsFolder = new URL('./migrations', import.meta.url).pathname;

export function runMigrations(db: DrizzleDatabase): Promise<void> {
  return migrate(db, { migrationsFolder });
}
