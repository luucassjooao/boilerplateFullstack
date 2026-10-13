import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import reactPackage from 'react/package.json' with { type: 'json' };
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', '.expo', 'dist', 'coverage', 'ios', 'android'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  // Only these two presets: eslint-plugin-react has rules that crash on ESLint 10 (see CLAUDE.md).
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  {
    languageOptions: {
      globals: { ...globals.es2021, __DEV__: 'readonly' },
    },
    settings: {
      // Explicit version: 'detect' calls context.getFilename(), removed in ESLint 10.
      react: { version: reactPackage.version },
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
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['*.config.{ts,js,mjs}', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.spec.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
);
