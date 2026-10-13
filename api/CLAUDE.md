# API

Node 24 + Fastify 5 + Drizzle ORM (Postgres) + Zod 4 + Vitest. Auth própria: email+senha com código de verificação, JWT de acesso + refresh token opaco rotativo, OAuth Google/Apple (web e mobile).

## Comandos

```bash
docker compose up -d        # Postgres 18 (porta POSTGRES_PORT)
pnpm db:migrate             # aplica migrations
pnpm dev                    # tsx watch
pnpm lint && pnpm typecheck && pnpm test   # rodar antes de qualquer commit
pnpm test:coverage          # exige 90% em src/application/**
pnpm test:integration       # contratos dos repositórios contra Postgres real
pnpm db:generate            # nova migration depois de mudar o schema
```

## Arquitetura

```
src/
  application/   regra de negócio. NÃO importa infra/ nem main/ (lint bloqueia)
    contracts/   Controller base + interfaces de repositórios e gateways
    controllers/ um controller por rota (schemas zod em schemas/)
    usecases/    um use case por operação; recebem interfaces no construtor
    entities/    classes com namespace X.Attributes; IDs UUIDv7 gerados aqui
    errors/      ErrorCode, ApplicationError (domínio), HttpError (BadRequest...)
    services/    lógica pura reutilizável (VerificationCodeService, OAuthProviders)
  infra/         implementações das interfaces (Drizzle, in-memory, argon2, jose, openid-client, Resend)
  main/          Fastify + composition root (único lugar que liga tudo)
    composition/ infra.ts (singletons), auth.ts, accounts.ts (use cases + controllers com `new`)
    adapters/    fastifyRouteAdapter (Controller → handler) e toErrorResponse
    routes/      registro de rotas por módulo
    config/      env.ts (zod, falha rápido) e AppConfig.ts (objeto tipado)
tests/
  unit/          use cases com in-memory + fakes (makeUnitDeps)
  e2e/           HTTP via app.inject() com makeTestApp()
  contracts/     suítes de contrato dos repositórios (in-memory sempre; Drizzle em test:integration)
  fakes/ factories/
```

Fluxo de uma requisição: rota → `fastifyRouteAdapter` (autentica rotas `private`, monta `Controller.Request`) → `Controller.execute` (valida body com `schema`) → use case → repositórios/gateways (interfaces). Erros sobem até o error handler do `server.ts`.

### Regras

- **Dependências apontam para dentro.** `application/` só conhece interfaces (`IUsersRepository`, `IEmailGateway`...). Instanciação só em `main/composition/`. Sem decorators, sem container de DI.
- **Controller não sabe que é Fastify.** Recebe `{ body, params, queryParams, headers, cookies, signedCookies, userId }` e devolve `{ statusCode, body?, headers?, cookies?, redirectTo? }`. Trocar de framework = escrever outro adapter.
- **Erros**: envelope sempre `{ "error": { "code", "message" } }`. `ZodError` → 400 `VALIDATION` com `[{ field, error }]`. Erro desconhecido → log (pino) + 500. Nunca converter erro genérico em erro de domínio (ex.: falha de banco não vira `INVALID_CREDENTIALS`).
- **Repositórios nomeiam o padrão de acesso** (`findByEmail`, `consume`, `revokeFamily`). Proibido repositório genérico ou query builder vazando. Nenhum tipo do Drizzle sai de `infra/database/drizzle`; mappers convertem linha ↔ entidade.
- **Unicidade e atomicidade são do repositório**: email único via unique index (o use case pode checar antes só por UX); `consume` de refresh token é um `UPDATE ... WHERE used_at IS NULL AND revoked_at IS NULL RETURNING`; escrita em mais de um agregado vira um método (`createWithIdentity`, `linkIdentity`) com transação. Nada de UnitOfWork exposto.
- **Nova implementação de repositório** (Dynamo, Mongo...) só entra se passar nas suítes de `tests/contracts`. Para trocar o banco, mude só `main/composition/infra.ts`.
- **Listagens** (quando surgirem): paginação por cursor opaco (base64), nunca offset.
- **Emails** normalizados (trim + lowercase) na entidade (`User.normalizeEmail`), não no banco.
- **Convenções**: interfaces com prefixo `I`; tipos de entrada/saída no namespace da classe (`SignInUseCase.Input`); um export principal por arquivo, nome do arquivo = nome da classe; `process.env` só em `main/config/env.ts`; logger do Fastify/pino, nunca `console.log`.
- `node:crypto` é permitido em `application/` para primitivas puras (random, hash, HMAC). IO de verdade fica atrás de interface.

## Autenticação (resumo)

- Access token: JWT HS256 (`jose`), 15 min, `sub = userId`.
- Refresh token: 32 bytes aleatórios (base64url), 30 dias; no banco só o SHA-256. Cada login cria uma `family_id`.
- `/auth/refresh` consome o token atomicamente e emite outro na mesma família. Reuso de token já usado: até 30 s → 401 sem revogar (corrida entre abas); depois → revoga a família inteira.
- Sign-out revoga a família; reset de senha revoga todas as famílias do usuário.
- Entrega por plataforma (`X-Client-Platform`): **web** recebe `{ accessToken }` + cookie `refresh_token` (HttpOnly, SameSite=Lax, Path=/auth); **mobile** recebe `{ accessToken, refreshToken }` no body. Rotas que leem o cookie exigem `Origin` em `WEB_ORIGINS` (CSRF). Tudo isso está em `SessionTransport`.
- Códigos de verificação: 6 dígitos (`crypto.randomInt`), HMAC-SHA256 com `CODE_HASH_SECRET`, 15 min, 5 tentativas (contadas atomicamente), novo código invalida o anterior.
- Sign-in de email inexistente roda `verify` contra um hash dummy (tempo constante). Usuário sem senha (só social) recebe `INVALID_CREDENTIALS` e pode criar senha via forgot-password.
- OAuth web: `/auth/oauth/:provider/authorize` gera state + PKCE (S256) + nonce num cookie assinado `oauth_tx` (10 min; `SameSite=None; Secure` para a Apple, que responde com form_post); o callback valida o state, troca o code, valida o id_token (JWKS, iss, aud, exp, nonce), grava o cookie de refresh e redireciona para `WEB_URL/auth/callback`. Nenhum token na URL.
- OAuth mobile: o app envia o id_token nativo para `/auth/oauth/:provider/token`. A Apple recebe o SHA-256 do nonce e a API recebe o nonce bruto.
- Resolução de conta social: identidade conhecida → login; email não verificado pelo provedor → `OAUTH_EMAIL_NOT_VERIFIED`; usuário com mesmo email → vincula e marca verificado; senão cria usuário + identidade.

## Decisões técnicas

- **TypeScript 6.0.x, não 7.** O `typescript-eslint` 8.x exige `typescript >=4.8.4 <6.1.0`. Subir para TS 7 só quando o typescript-eslint suportar.
- **tsconfig sem opções depreciadas no TS 6** (`baseUrl`, `moduleResolution` `node10`/`classic`, `outFile`, `downlevelIteration`, `target` ES5, `module` AMD/UMD/System/None, `esModuleInterop`/`allowSyntheticDefaultImports`/`alwaysStrict` em `false`) e **sem `ignoreDeprecations`**. `"types": ["node"]` é explícito porque no TS 6 o padrão de `types` é `[]`.
- **Subpath imports com a condição `source`.** Aliases `#application/*`, `#infra/*`, `#main/*`, `#shared/*`, `#tests/*` no `package.json`, **sem extensão** no especificador (`import { X } from '#application/usecases/auth/SignInUseCase'`).
  - `source` → `src/**/*.ts`. Ativada em: `tsc` (`customConditions: ["source"]`), `tsx` (`--conditions=source`) e Vitest (`resolve.conditions` **e** `ssr.resolve.conditions`; só o primeiro não basta, porque os testes em Node rodam no ambiente SSR do Vite).
  - `default` → `dist/**/*.js`, usada pelo `node dist/main/index.js` em produção.
  - Prefira sempre o alias. Imports relativos precisam de extensão `.js` (`nodenext`).
  - Atenção: a condição `source` também vale para dependências. Se algum pacote publicar um export `source` apontando para TS não compilado, ele será carregado por `tsc`/`tsx`/Vitest.
- **`vite` instalado explicitamente** como devDependency: o Vitest 5 o declara como peer dependency.
- **`allowBuilds` no `pnpm-workspace.yaml`**: o pnpm 11 bloqueia scripts de instalação por padrão. Só o `esbuild` (usado por tsx/vite) está liberado. Libere novos pacotes com `pnpm approve-builds <pkg>`. O pnpm 11 também aplica um atraso mínimo de release (`minimumReleaseAge`), por isso às vezes instala uma versão alguns dias mais antiga que a `latest`.
- **pnpm fixado** em `packageManager: pnpm@11.4.0`.
- **Driver `pg`** (node-postgres) com `drizzle-orm/node-postgres`. Violação de unicidade detectada pelo código `23505` (desembrulhando `DrizzleQueryError.cause`) e pelo nome da constraint.
- **Migrations** em `src/infra/database/drizzle/migrations` (SQL gerado pelo drizzle-kit). O `build` copia a pasta para `dist/`, e `pnpm db:migrate:prod` aplica a partir de `dist/` sem precisar do drizzle-kit nem dos segredos da app (só `DATABASE_URL`).
- **Providers OAuth com metadata estática** (sem discovery no boot). `openid-client` faz o authorization code grant com PKCE; a assinatura do id_token é sempre validada com `jose` + JWKS do provedor. O `client_secret` da Apple é um JWT ES256 de 5 min gerado a cada troca.
- **`.env`**: carregado pelo Node (`--env-file-if-exists`), sem dotenv. `KEY=` (vazio) conta como não definido.
- **Email**: `EMAIL_PROVIDER=console` escreve o email (com o código) no log, só para dev; em produção a API avisa no boot. `resend` exige `RESEND_API_KEY`.
- **`src/shared/`** existe só como alias reservado; ainda não há código compartilhado.

## Regras de import (garantidas por lint)

- **Camadas**: `src/application/**` não importa `infra/` nem `main/`, nem via alias (`#infra/*`, `#main/*`) nem via caminho relativo (`../infra/...`, `../../main/...`). Implementado com `no-restricted-imports` + `regex`. O formato gitignore (`group`) trata `#` como comentário, por isso não usamos `group`. Não crie subpastas chamadas `infra` ou `main` dentro de `application/`, porque a regex as bloquearia.
- **Schema do Drizzle** (`src/infra/database/drizzle/schema/**`) só importa `drizzle-orm` e caminhos relativos, **nunca `#...`**: o drizzle-kit carrega esses arquivos com o próprio loader, que não resolve subpath imports com condições. O lint bloqueia `#...` nessa pasta.

## Testes

- Unitários (`tests/unit`), e2e HTTP (`tests/e2e`, via `app.inject()` com `makeTestApp()`: in-memory + fakes) e contratos (`tests/contracts`). Ficam em `tests/` porque usam `#infra/*` (in-memory), proibido dentro de `src/application/**`.
- `sut` criado no `beforeEach`; factories em `tests/factories` (`makeUser({ ...override })`); datas com `vi.useFakeTimers()`.
- Os repositórios in-memory copiam entidades na entrada e na saída: um use case que esquece de chamar `update()` falha nos testes também.
- `pnpm test:integration` roda as mesmas suítes de contrato contra o Postgres (`TEST_DATABASE_URL`; o banco é criado e migrado pelo globalSetup). Precisa de `docker compose up -d`.
- O **globalSetup não pode usar `#...`**: ele roda no ambiente interno `__vitest__` do Vite, que ignora `resolve.conditions`.
- Providers OAuth reais são testados com JWKS e token endpoint locais (`jose` gera as chaves; `customFetch` do openid-client). O fluxo contra Google/Apple de verdade não é coberto por testes automatizados.
