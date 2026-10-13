# Mobile

App de autenticação em Expo (SDK 57) + React Navigation para a API do repo `api/`: cadastro com código por email, login, recuperação de senha e login nativo com Google e Apple.

Arquitetura e regras: [`CLAUDE.md`](./CLAUDE.md).

## Importante: development build

O app **não roda no Expo Go**: Google Sign-In e Sign in with Apple usam módulos nativos. É preciso um *development build* (`expo-dev-client`):

- **Local**: Xcode (iOS, só macOS) ou Android Studio + SDK. `pnpm ios` / `pnpm android` compilam e instalam no simulador/emulador/dispositivo.
- **Na nuvem (EAS)**: `pnpm dlx eas-cli@latest build --profile development --platform ios|android`, depois instale o build e rode `pnpm dev`.

## Rodando

```bash
pnpm install
cp .env.example .env
pnpm android     # ou pnpm ios (primeira vez: compila o app nativo)
pnpm dev         # nas próximas vezes, só o Metro
```

`EXPO_PUBLIC_API_URL` precisa ser alcançável pelo dispositivo:

- simulador iOS: `http://localhost:3333`;
- emulador Android: `http://10.0.2.2:3333`;
- dispositivo físico: o IP da sua máquina na rede (ex.: `http://192.168.0.10:3333`), com a API escutando em `0.0.0.0` (padrão).

Com `EMAIL_PROVIDER=console` na API, o código de verificação aparece no log da API.

## Variáveis

| Variável | Onde | Para quê |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | bundle | URL da API |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | bundle | client **web** do Google (Android e iOS usam como `webClientId`) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | bundle | client iOS do Google |
| `APP_BUNDLE_ID` | build (`app.config.ts`) | bundle ID iOS e package Android |
| `GOOGLE_IOS_URL_SCHEME` | build (`app.config.ts`) | client ID iOS invertido (`com.googleusercontent.apps.XXXX`) |

`EXPO_PUBLIC_*` vão para o bundle do app: não coloque segredos nelas. Mudou uma variável de build (`APP_BUNDLE_ID`, `GOOGLE_IOS_URL_SCHEME`)? Gere o dev build de novo.

## Login social

As credenciais são criadas como descrito no README da API ("Credenciais OAuth"). Resumo do lado do app:

- **Google**: crie os clients iOS e Android no mesmo projeto do client web. Preencha `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` e `GOOGLE_IOS_URL_SCHEME`. No Android, o SHA-1 do certificado que assina o build precisa estar cadastrado no client Android (o debug keystore local e o da EAS têm SHA-1 diferentes).
- **Apple**: só iOS. O App ID (`APP_BUNDLE_ID`) precisa da capability *Sign in with Apple*, e esse bundle ID vai em `APPLE_BUNDLE_IDS` na API. O botão não aparece no Android.

## Scripts

| Script | O que faz |
|---|---|
| `pnpm ios` / `pnpm android` | compila e instala o dev build |
| `pnpm dev` | Metro para o dev build |
| `pnpm build` | `expo export` (bundles JS) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | jest-expo (controllers e interceptor de refresh) |
