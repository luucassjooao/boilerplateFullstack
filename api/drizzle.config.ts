import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile();
} catch {}

export default defineConfig({
  dialect: 'postgresql',
  // Schema files may only import drizzle-orm and relative paths: drizzle-kit does not resolve `#` subpath imports.
  schema: './src/infra/database/drizzle/schema/index.ts',
  out: './src/infra/database/drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
