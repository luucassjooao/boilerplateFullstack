# API

> Documento vivo. A versão completa (arquitetura, fluxos, comandos) é escrita na Fase 6.

## Decisões técnicas

- **TypeScript 6.0.x, não 7.** O `typescript-eslint` 8.x exige `typescript >=4.8.4 <6.1.0`. Subir para TS 7 só quando o typescript-eslint suportar.
- **tsconfig sem opções depreciadas no TS 6** (`baseUrl`, `moduleResolution` `node10`/`classic`, `outFile`, `downlevelIteration`, `target` ES5, `module` AMD/UMD/System/None, `esModuleInterop`/`allowSyntheticDefaultImports`/`alwaysStrict` em `false`) e **sem `ignoreDeprecations`**. `"types": ["node"]` é explícito porque no TS 6 o padrão de `types` é `[]`.
- **Subpath imports com a condição `source`.** Aliases `#application/*`, `#infra/*`, `#main/*`, `#shared/*`, `#tests/*` no `package.json`, **sem extensão** no especificador (`import { X } from '#application/usecases/auth/SignInUseCase'`).
  - `source` → `src/**/*.ts`. Ativada em: `tsc` (`customConditions: ["source"]`), `tsx` (`--conditions=source`) e Vitest (`resolve.conditions` **e** `ssr.resolve.conditions`; só o primeiro não basta, porque os testes em Node rodam no ambiente SSR do Vite).
  - `default` → `dist/**/*.js`, usada pelo `node dist/main/index.js` em produção.
  - Prefira sempre o alias. Imports relativos precisam de extensão `.js` (`nodenext`).
- **`vite` instalado explicitamente** como devDependency: o Vitest 5 o declara como peer dependency.
- **`allowBuilds` no `pnpm-workspace.yaml`**: o pnpm 11 bloqueia scripts de instalação por padrão. Só o `esbuild` (usado por tsx/vite) está liberado. Libere novos pacotes com `pnpm approve-builds <pkg>`.
- **pnpm fixado** em `packageManager: pnpm@11.4.0`.

## Regras de import (garantidas por lint)

- **Camadas**: `src/application/**` não importa `infra/` nem `main/`, nem via alias (`#infra/*`, `#main/*`) nem via caminho relativo (`../infra/...`, `../../main/...`). Implementado com `no-restricted-imports` + `regex`. O formato gitignore (`group`) trata `#` como comentário, por isso não usamos `group`. Não crie subpastas chamadas `infra` ou `main` dentro de `application/`, porque a regex as bloquearia.
- **Schema do Drizzle** (`src/infra/database/drizzle/schema/**`) só importa `drizzle-orm` e caminhos relativos, **nunca `#...`**: o drizzle-kit carrega esses arquivos com o próprio loader, que não resolve subpath imports com condições. O lint bloqueia `#...` nessa pasta.

## Outros

- Testes: `*.spec.ts` em `src/` ou `tests/`. Coverage mínimo de 90% em `src/application/**` (`pnpm test:coverage`).
- Postgres local: `docker compose up -d` (Postgres 18).

## Comandos

- `pnpm dev` · `pnpm build` · `pnpm start`
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:coverage`
