# Mobile

Expo SDK 57 (React Native 0.86) + React Navigation native-stack + TanStack Query + axios + React Hook Form + Zod 4 + expo-secure-store. Consome a API do repo `api/`.

**Exige development build** (`expo-dev-client`), não roda no Expo Go: o Google Sign-In e o Sign in with Apple usam código nativo.

## Comandos

```bash
pnpm ios | pnpm android                    # compila o dev build e instala (expo run:*)
pnpm dev                                   # Metro para um dev build já instalado
pnpm lint && pnpm typecheck && pnpm test   # rodar antes de qualquer commit
pnpm expo install <pacote>                 # SEMPRE para libs Expo/RN: resolve a versão compatível com o SDK
pnpm dlx expo-doctor                       # diagnóstico de dependências/config
```

## Estrutura

```
src/
  App.tsx                    providers + splash
  app/                       lógica sem UI
    config/env.ts            zod sobre process.env.EXPO_PUBLIC_*
    contexts/AuthContext/    AuthProvider (boot + sessão), useAuth
    hooks/queries/ mutations/ app/   useMe, useSignIn..., useSocialSignIn
    lib/                     AuthTokensManager (secure-store), queryClient, errorMessages
    navigation/              index (NavigationContainer), RootStack, AuthStack, AppStack, types
    services/                Service (axios + interceptors), AuthService, AccountsService
  ui/
    components/<Nome>/       index.tsx + styles.ts (AppText, Button, Input, FormGroup, FormInput, Screen, SocialSignInButtons)
    screens/<Tela>/          index.tsx (só render) + styles.ts + use<Tela>Controller.ts + schema.ts
    styles/theme/            cores, espaçamentos, tamanhos
    styles/utils/createVariants.ts   variantes estilo cva para StyleSheet
  test/                      setup (mock do secure-store) e helpers
```

Aliases: `@app/*`, `@ui/*`, `@test/*` (tsconfig `paths`, que o Metro lê sozinho; Jest via `moduleNameMapper`).

## Regras

- **Tela**: `index.tsx` só renderiza; lógica no `useXController.ts`; validação em `schema.ts`. Inputs com `FormInput` (RHF `Controller`, já que RN não tem `register`). Nunca valores padrão de credenciais.
- **Navegação**: `RootStack` renderiza `AuthStack` ou `AppStack` conforme `signedIn`. Login/logout troca o stack inteiro; os controllers não navegam depois de iniciar a sessão. Params tipados em `navigation/types.ts`.
- **Tokens**: refresh token no Keychain/Keystore via `expo-secure-store` (nunca AsyncStorage); access token só em memória (`AuthTokensManager`).
- Header `X-Client-Platform: mobile`; refresh e sign-out mandam `refreshToken` no body.
- **Interceptor single-flight** igual ao web (sem `navigator.locks`): 401s concorrentes compartilham um único refresh; o novo refresh token é persistido antes de liberar os requests; só requests autenticados disparam refresh; falha → limpa tokens e `onSessionExpired`. Estado em variáveis de módulo (não campos estáticos).
- **Boot**: `SplashScreen.preventAutoHideAsync()` no `App.tsx`; o `AuthProvider` faz um `/auth/refresh` (se houver token salvo) e esconde o splash quando resolve.
- **Login social** (`useSocialSignIn`):
  - Google: `@react-native-google-signin/google-signin` → `idToken` → `POST /auth/oauth/google/token`. `webClientId` = client **web** do Google Cloud (no Android o `aud` do idToken é sempre o client web).
  - Apple: `expo-apple-authentication`, só iOS (o botão some no Android). O app gera um nonce aleatório, manda o SHA-256 para a Apple e o nonce bruto para a API, junto com o nome (que a Apple só entrega no primeiro login).
  - Cancelamento pelo usuário não mostra erro.
- **Erros da API**: mensagens em pt-BR por `error.code` em `app/lib/errorMessages.ts`, exibidas com `Alert`.
- **Variáveis `EXPO_PUBLIC_*`** precisam ser lidas como `process.env.EXPO_PUBLIC_X` (acesso estático): o Expo só substitui acessos estáticos no bundle. Por isso o `env.ts` monta o objeto campo a campo. Elas vão para o bundle: nunca coloque segredos.
- **`app.config.ts`** lê variáveis de build (`APP_BUNDLE_ID`, `GOOGLE_IOS_URL_SCHEME`) com `||`, porque `KEY=` no `.env` é string vazia.
- Visual neutro (`ui/styles/theme`): a identidade visual é do projeto.

## Decisões técnicas

- **React Navigation, não Expo Router** (decisão do projeto). O template do Expo trazia um `AGENTS.md` mandando usar Expo Router; foi removido.
- **TypeScript 6.0.x** (o próprio template do SDK 57 já usa), estendendo `expo/tsconfig.base` (sem opções depreciadas).
- **ESLint 10 + eslint-plugin-react restrito a `recommended` + `jsx-runtime`**, com `settings.react.version` explícito. Mesmo motivo do web: algumas regras do plugin quebram no ESLint 10, e o aviso de peer é esperado. Não habilite outras regras do plugin sem testar.
- **Testes com jest-expo** (padrão oficial do Expo) + `@testing-library/react-native` 14:
  - na RNTL 14 o `renderHook` é assíncrono (`await renderController(...)`);
  - variáveis usadas dentro de `jest.mock()` precisam do prefixo `mock`;
  - o `QueryClient` de teste usa `gcTime: Infinity`, senão os timers de garbage collection (5 min) impedem o Jest de terminar;
  - depois de um submit, espere um tick dentro do `act` (o react-query notifica no tick seguinte).
- `commitlint.config.mjs` (não `.js`): o `package.json` do Expo não é ESM.
- pnpm 11 fixado em `packageManager`.
