# Web

Vite 8 + React 19 + React Router 8 (modo data, `createBrowserRouter`, não framework) + TanStack Query + axios + React Hook Form + Zod 4 + Tailwind 4 + shadcn/ui + sonner + lucide. Consome a API do repo `api/`.

## Comandos

```bash
pnpm dev                                   # http://localhost:5173 (VITE_API_URL em .env)
pnpm lint && pnpm typecheck && pnpm test   # rodar antes de qualquer commit
pnpm build                                 # typecheck + build
```

## Estrutura

```
src/
  app/                       lógica sem UI
    config/env.ts            zod sobre import.meta.env (falha rápido)
    contexts/AuthContext/    AuthProvider (boot + sessão), useAuth
    hooks/queries/           useMe ...
    hooks/mutations/         useSignIn, useSignUp ... (finas sobre os services)
    lib/                     accessTokenStore (memória), queryClient, errorMessages, safeRedirect, utils (cn)
    services/                Service (axios + interceptors), AuthService, AccountsService
  ui/
    components/              FormField, OAuthButtons, SplashScreen, ErrorBoundary
    components/ui/           componentes shadcn (gerados; ajuste à vontade)
    layouts/                 AuthLayout, AppLayout (Suspense das rotas lazy)
    pages/<Page>/            index.tsx (só render) + use<Page>Controller.ts (lógica) + schema.ts (zod)
  router/                    rotas lazy + AuthGuard
  test/                      setup e helpers de teste
```

Aliases: `@app/*`, `@ui/*`, `@router/*`, `@test/*` (tsconfig `paths` + `resolve.alias` do Vite).

## Regras

- **Página**: `index.tsx` só renderiza; lógica no `useXController.ts`; validação em `schema.ts` (zod + RHF). Nunca valores padrão de credenciais nos formulários.
- **Services** são classes com métodos estáticos que estendem `Service`; tipos de payload/response no namespace do service (`AuthService.SignInPayload`). Chame sempre como `AuthService.signIn(...)` (não passe o método solto: ele usa `this`).
- **Tokens**: access token **só em memória** (`accessTokenStore`), refresh token **só no cookie httpOnly** da API. Nada de `localStorage`.
- Todo request vai com `withCredentials: true` e `X-Client-Platform: web` (configurado no `Service`).
- **Boot**: o `AuthProvider` chama `/auth/refresh` uma vez e mostra o splash até resolver. Sucesso → logado (e prefetch de `/me`); falha → deslogado. Isso também fecha o OAuth web: a página `/auth/callback` carrega já com o cookie novo, e o boot faz o refresh.
- **Interceptor single-flight** (`Service.ts`):
  - Todos os 401 concorrentes compartilham uma única promise de refresh; cada request é refeito uma vez.
  - Entre abas, o refresh é serializado com `navigator.locks.request('auth-refresh', ...)`: duas abas nunca mandam o mesmo cookie rotativo ao mesmo tempo.
  - Só faz refresh para requests autenticados (com `Authorization`). Um 401 do sign-in é credencial errada, não token expirado. Nunca faz refresh da própria `/auth/refresh`.
  - Falha no refresh → limpa o token, chama `onSessionExpired` (o AuthProvider faz signOut local + `queryClient.clear()`).
  - O estado do single-flight fica em variáveis de módulo, não em campos estáticos: `this.x = ...` num método estático chamado por uma subclasse criaria uma cópia por subclasse.
- **Navegação pós-login**: quem redireciona é o `AuthGuard` (rotas públicas mandam usuários logados para `?redirectTo=`). Os controllers só iniciam a sessão.
- **`redirectTo`** passa sempre por `safeRedirect` (mesma regra da API: só caminho relativo, sem `//`, `\` ou caracteres de controle).
- **Erros da API**: mensagens em pt-BR por `error.code` num único arquivo, `app/lib/errorMessages.ts`.
- **Login social**: `<a href>` para `API/auth/oauth/:provider/authorize?redirectTo=...` (navegação de página inteira).
- `ErrorBoundary` global e listener `vite:preloadError` → reload (no máximo uma vez por minuto, para não entrar em loop). Integração com Sentry fica para o projeto.
- Visual neutro (tema padrão do shadcn): a identidade visual é do projeto.

## Decisões técnicas

- **TypeScript 6.0.x** (typescript-eslint exige `<6.1`), sem opções depreciadas e sem `ignoreDeprecations`. Dois tsconfigs: `tsconfig.app.json` (src, DOM) e `tsconfig.node.json` (configs).
- **ESLint 10 + eslint-plugin-react restrito a `recommended` + `jsx-runtime`.** O eslint-plugin-react 7.37.5 (sem release desde abr/2025) declara peer `eslint <=9`, e o ESLint 9 está fora de suporte. Algumas regras do plugin quebram no ESLint 10 (chamam `context.getSourceCode()`/`getFilename()`, removidos); as dos dois presets usados funcionam (testado). Por isso:
  - não habilite `react.configs.flat.all` nem regras fora desses presets sem testar;
  - `settings.react.version` é lido do `react/package.json`, porque `'detect'` chama `getFilename()`;
  - o aviso de peer é liberado explicitamente em `pnpm-workspace.yaml` (`peerDependencyRules`).
  - Alternativa se o plugin quebrar de vez: `@eslint-react/eslint-plugin`.
- **shadcn**: `components.json` com os aliases do projeto. O `shadcn init` trava esperando input; o tema (`src/index.css`) e o `cn` foram escritos à mão. `pnpm dlx shadcn@latest add <componente> --yes < /dev/null` funciona; depois troque `from "cn"` por `from "@app/lib/utils"` se aparecer, remova `"use client"` e rode `pnpm lint --fix`. O `sonner` gerado foi simplificado (sem `next-themes`).
- **Testes**: Vitest + jsdom + Testing Library. Controllers testados com `renderController` (router em memória + react-query + AuthContext fake); interceptor testado trocando o `adapter` do axios.
- pnpm 11 fixado em `packageManager`; `allowBuilds` libera só o esbuild.
