# API

API de autenticação em Node 24 + Fastify 5 + Drizzle (Postgres), com arquitetura em camadas e auth própria: email+senha com código de verificação, refresh token rotativo com detecção de reuso, e login social Google/Apple (web e mobile).

Arquitetura, regras e decisões: [`CLAUDE.md`](./CLAUDE.md).

## Requisitos

- Node 24+ e pnpm 11 (`corepack enable`)
- Docker (Postgres local)

## Rodando

```bash
pnpm install
cp .env.example .env          # ajuste os segredos
docker compose up -d          # Postgres 18 (porta em POSTGRES_PORT)
pnpm db:migrate
pnpm dev                      # http://localhost:3333
```

Com `EMAIL_PROVIDER=console`, os códigos de verificação aparecem no log da API.

## Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | servidor com reload (`tsx watch`) |
| `pnpm build` / `pnpm start` | compila para `dist/` (copia as migrations) e roda |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` | unitários + e2e HTTP + contratos in-memory |
| `pnpm test:coverage` | idem, exige 90% em `src/application/**` |
| `pnpm test:integration` | contratos dos repositórios contra Postgres real (`TEST_DATABASE_URL`) |
| `pnpm db:generate` | gera migration a partir do schema Drizzle |
| `pnpm db:migrate` / `db:migrate:prod` | aplica migrations (src / dist) |
| `pnpm db:studio` | Drizzle Studio |

## Credenciais OAuth

Cada provedor só é ativado quando **todas** as suas variáveis estão preenchidas. Sem elas, as rotas `/auth/oauth/:provider/*` respondem 400.

### Google

1. Em [console.cloud.google.com](https://console.cloud.google.com), crie (ou escolha) um projeto.
2. **Google Auth Platform → Branding/Audience**: configure a tela de consentimento (tipo *External*). Enquanto estiver em *Testing*, adicione seus emails em *Test users*. Escopos: `openid`, `email`, `profile`.
3. **Clients → Create client → Web application**:
   - *Authorized redirect URIs*: `API_URL/auth/oauth/google/callback` (ex.: `http://localhost:3333/auth/oauth/google/callback`; o Google aceita `http://localhost`).
   - Copie para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
4. **Mobile** (para o login nativo do app):
   - Crie um client **iOS** (bundle ID do app) e um **Android** (package name + SHA-1 do certificado de assinatura: `cd android && ./gradlew signingReport`, ou o SHA-1 da EAS/Play).
   - Coloque os client IDs em `GOOGLE_MOBILE_CLIENT_IDS`.
   - No app, o `webClientId` do Google Sign-In é o `GOOGLE_CLIENT_ID` (web). No Android, o `aud` do id_token é o client web, por isso ele também é aceito.

### Apple

Requer conta paga no [Apple Developer Program](https://developer.apple.com/account).

1. **Certificates, Identifiers & Profiles → Identifiers → App IDs**: no App ID do app iOS, habilite *Sign in with Apple*. O bundle ID vai em `APPLE_BUNDLE_IDS` (login nativo).
2. **Identifiers → Services IDs → +**: crie um Services ID (ex.: `com.suaempresa.web`), habilite *Sign in with Apple* e clique em *Configure*:
   - *Primary App ID*: o App ID acima.
   - *Domains*: o domínio da API (ex.: `api.suaempresa.com`).
   - *Return URLs*: `https://api.suaempresa.com/auth/oauth/apple/callback`.
   - O Services ID vai em `APPLE_SERVICES_ID`.
3. **Keys → +**: crie uma chave com *Sign in with Apple* (vinculada ao Primary App ID) e baixe o `.p8` (só é possível baixar uma vez).
   - `APPLE_KEY_ID`: o Key ID.
   - `APPLE_TEAM_ID`: o Team ID (canto superior direito / *Membership*).
   - `APPLE_PRIVATE_KEY`: o conteúdo do `.p8`, em uma linha com `\n` no lugar das quebras: `awk 'NF {printf "%s\\n", $0}' AuthKey_XXXX.p8`.
4. **Emails para o relay privado**: se o usuário escolher "ocultar meu email", a Apple entrega um endereço `@privaterelay.appleid.com`. Para seus emails chegarem, registre o domínio/remetente de envio em *Services → Sign in with Apple for Email Communication*.

Observações sobre a Apple:

- A Apple **não aceita `localhost` nem HTTP** nas Return URLs. Em desenvolvimento, exponha a API por um túnel HTTPS (ex.: `cloudflared tunnel --url http://localhost:3333`) e use essa URL em `API_URL` e na Return URL.
- O callback web da Apple é um `POST` cross-site (`response_mode=form_post`), por isso o cookie temporário `oauth_tx` é `SameSite=None; Secure` e a API precisa estar em HTTPS.
- O cookie de refresh é `SameSite=Lax`, então o web e a API precisam estar no **mesmo site** (ex.: `app.suaempresa.com` e `api.suaempresa.com`). Com a API num túnel e o web em `localhost`, o fluxo web da Apple não fecha. Teste o fluxo web da Apple em um ambiente com domínio.
- Nome e email só chegam no **primeiro** login. A API salva o nome na criação da conta (vindo do form_post no web, ou do campo `name` enviado pelo app no mobile).
- Nonce: a Apple recebe o SHA-256 do nonce e a API recebe o nonce bruto (no mobile, o app envia o bruto para a API e o hash para a Apple).
- Este boilerplate testa os providers com JWKS e token endpoint locais. O fluxo contra os servidores reais da Apple (incluindo o envio de PKCE, que a Apple pode ignorar) precisa ser validado no seu ambiente.
