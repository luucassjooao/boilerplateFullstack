import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

const conditions = ['source', ...defaultServerConditions];

export default defineConfig({
  resolve: { conditions },
  ssr: { resolve: { conditions } },
  test: {
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/application/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
