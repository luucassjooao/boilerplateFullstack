# Boilerplate fullstack

Monorepo **só de git**: `api/`, `web/` e `mobile/` são projetos independentes (cada um com `package.json`, lockfile, `pnpm-workspace.yaml`, lint, testes e `CLAUDE.md` próprios). Não existe workspace na raiz nem pacote compartilhado. Leia o `CLAUDE.md` da pasta em que for trabalhar e rode os comandos dentro dela.

- O spec original previa 3 repositórios; eles foram unidos aqui com o histórico preservado (cada repo reescrito para a própria pasta).
- **Hooks git** ficam em `.husky/` na raiz (há um git só). O `prepare` de cada pacote é `cd .. && husky`, então `pnpm install` em qualquer pasta instala os hooks.
  - `pre-commit`: roda o `lint-staged` de cada pacote que tem arquivos staged (cada um com seu ESLint).
  - `commit-msg`: commitlint (conventional commits) do primeiro pacote instalado.
- Antes de commitar mudanças num pacote: `pnpm lint && pnpm typecheck && pnpm test` dentro dele.
