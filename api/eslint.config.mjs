import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'src/infra/database/drizzle/migrations'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'no-empty': 'off',
      'arrow-spacing': ['error', { before: true, after: true }],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'eol-last': ['error', 'always'],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-duplicate-imports': 'error',
      'no-console': 'warn',
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'interface',
        format: ['PascalCase'],
        custom: { regex: '^I[A-Z]', match: true },
      }],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/application/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            regex: '^#(infra|main)/',
            message: 'application/ não pode depender de infra/ nem de main/.',
          },
          {
            regex: '^\\.{1,2}/(.*/)?(infra|main)(/|$)',
            message: 'application/ não pode depender de infra/ nem de main/.',
          },
        ],
      }],
    },
  },
  {
    files: ['src/infra/database/drizzle/schema/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '^#',
          message: 'Schema do Drizzle só importa drizzle-orm e caminhos relativos (drizzle-kit não resolve subpath imports).',
        }],
      }],
    },
  },
);
