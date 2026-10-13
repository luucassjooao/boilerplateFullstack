import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type DrizzleDatabase = NodePgDatabase;

export function makeDrizzleClient(connectionString: string) {
  const pool = new Pool({ connectionString });

  return {
    db: drizzle(pool),
    close: () => pool.end(),
  };
}
