import { defaultServerConditions, loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const conditions = ['source', ...defaultServerConditions];

// Needs Postgres running (docker compose up -d). Reads TEST_DATABASE_URL from .env when not set.
process.env.TEST_DATABASE_URL ??= loadEnv('test', process.cwd(), '').TEST_DATABASE_URL
  ?? 'postgres://postgres:postgres@localhost:5432/app_test';

export default defineConfig({
  resolve: { conditions },
  ssr: { resolve: { conditions } },
  test: {
    include: ['tests/**/*.integration.spec.ts'],
    globalSetup: ['tests/setup/postgres.ts'],
    // One shared database: files must not run in parallel.
    fileParallelism: false,
  },
});
