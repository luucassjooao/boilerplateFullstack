# Web

App web de autenticação (Vite + React 19 + React Router + TanStack Query + shadcn/ui) para a API do repo `api/`: cadastro com código por email, login, recuperação de senha e login com Google/Apple.

Arquitetura e regras: [`CLAUDE.md`](./CLAUDE.md).

## Rodando

Pré-requisito: a API rodando (veja o README da API), com `WEB_ORIGINS` e `WEB_URL` apontando para `http://localhost:5173`.

```bash
pnpm install
cp .env.example .env     # VITE_API_URL=http://localhost:3333
pnpm dev                 # http://localhost:5173
```

Com `EMAIL_PROVIDER=console` na API, o código de verificação aparece no log da API.

## Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | servidor de desenvolvimento |
| `pnpm build` | typecheck + build de produção em `dist/` |
| `pnpm preview` | serve o build |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Vitest (controllers e interceptor de refresh) |

## Como a sessão funciona

- O access token fica só em memória; o refresh token é um cookie httpOnly da API (`SameSite=Lax`, `Path=/auth`).
- Ao abrir o app, ele chama `/auth/refresh` uma vez (splash enquanto isso).
- Requests que tomam 401 compartilham um único refresh (e as abas se revezam via Web Locks); se o refresh falhar, o usuário é deslogado.

Em produção, web e API precisam estar no **mesmo site** (ex.: `app.suaempresa.com` e `api.suaempresa.com`) para o cookie de refresh ser enviado.

## Login social

Os botões levam para `API/auth/oauth/:provider/authorize`. A API faz o fluxo com o provedor e volta para `/auth/callback`, que conclui o login. As credenciais são configuradas na API (veja "Credenciais OAuth" no README da API).

## Adicionando componentes shadcn

```bash
pnpm dlx shadcn@latest add dialog --yes < /dev/null
pnpm lint --fix
```

Se o arquivo gerado importar `cn` de `"cn"`, troque por `@app/lib/utils` (veja o CLAUDE.md).
