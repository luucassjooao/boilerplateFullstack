# Boilerplate fullstack

Três projetos independentes num repositório só:

| Pasta | O que é | Stack |
|---|---|---|
| [`api/`](./api) | API de autenticação | Node 24, Fastify 5, Drizzle (Postgres), Zod, Vitest |
| [`web/`](./web) | App web | Vite, React 19, React Router, TanStack Query, shadcn/ui |
| [`mobile/`](./mobile) | App mobile | Expo SDK 57, React Navigation, TanStack Query |

Auth própria: email+senha com código por email, refresh token rotativo com detecção de reuso, login com Google e Apple (web e mobile).

Cada pasta tem suas próprias dependências, scripts, testes e README. Não há workspace pnpm na raiz: rode os comandos dentro de cada pasta.

## Começando

```bash
cd api && pnpm install && cp .env.example .env && docker compose up -d && pnpm db:migrate && pnpm dev
cd web && pnpm install && cp .env.example .env && pnpm dev
cd mobile && pnpm install && cp .env.example .env && pnpm android   # exige development build
```

Detalhes em [`api/README.md`](./api/README.md), [`web/README.md`](./web/README.md) e [`mobile/README.md`](./mobile/README.md).
