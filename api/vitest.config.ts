import { defineConfig } from 'vitest/config';

export default defineConfig({
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
