# API

> Documento vivo. A versão completa (arquitetura, fluxos, comandos) é escrita na Fase 6.

## Decisões de tooling

- **TypeScript 6.0.x, não 7.** `typescript-eslint` 8.x exige `typescript <6.1`. Subir para TS 7 só quando o typescript-eslint suportar.
- **Subpath imports** (`#application/*`, `#infra/*`, `#main/*`, `#shared/*`, `#tests/*`) no `package.json`, **sem extensão** no especificador (`import { X } from '#application/usecases/auth/SignInUseCase'`).
  - Condição `development` → `src/**/*.ts` (usada por `tsc` via `customConditions`, por `tsx --conditions=development` e pelo Vitest, que aplica `development` fora de produção).
  - Condição `default` → `dist/**/*.js` (usada pelo `node dist/main/index.js` em produção).
  - Prefira sempre o alias. Imports relativos precisam de extensão `.js` (`nodenext`).
- **Lint de camadas**: `src/application/**` não pode importar `#infra/*` nem `#main/*` (`no-restricted-imports` com `regex`; o padrão gitignore trata `#` como comentário, por isso não usar `group`).
- Testes: `*.spec.ts` em `src/` ou `tests/`. Coverage mínimo de 90% em `src/application/**` (`pnpm test:coverage`).
- Postgres local: `docker compose up -d` (Postgres 18).

## Comandos

- `pnpm dev` · `pnpm build` · `pnpm start`
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:coverage`
