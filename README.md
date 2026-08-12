# KAMGOKO ITSM — Frontend

Console opérationnelle Next.js du système de tickets télécom. Ce dossier est un dépôt Git autonome : il ne partage ni historique, ni hooks, ni pipeline avec le backend parent.

## Architecture

- App Router et composants serveur par défaut.
- BFF même origine sous `/api/v1/**` ; les JWT restent dans des cookies HttpOnly.
- Mutations protégées par contrôle Origin/Host et jeton CSRF lié à la session.
- Socket.IO même origine, namespace `/ws`, authentifié par le cookie access.
- TanStack Query pour l’état serveur interactif ; l’URL porte filtres et pagination.
- Le contrat TypeScript est généré depuis le snapshot OpenAPI backend.

## Démarrage local

Copier `.env.example` vers `.env.local`, adapter les origines, puis :

```bash
pnpm install
pnpm contract:generate
pnpm dev
```

## Comptes de démonstration

### Login local (`AUTH_PROVIDER=local`)

| Email | Mot de passe | Rôle |
| ----- | ------------ | ---- |
| `admin@telecom.local` | `Admin@1234` | ADMINISTRATOR |
| `supervisor@telecom.local` | `Super@1234` | SUPERVISOR |
| `agent-cc1@telecom.local` | `Agent@1234` | CUSTOMER_SERVICE_AGENT |

### SSO Keycloak (`AUTH_PROVIDER=keycloak`)

La page de login est redirigée vers Keycloak (`http://localhost:8081`, port 8081 car 8080 est utilisé par PhotoVault) :

| Email | Mot de passe | Rôle |
| ----- | ------------ | ---- |
| `admin@telecom.local` | `Admin@1234` | ADMINISTRATOR |
| `supervisor@telecom.local` | `Super@1234` | SUPERVISOR |
| `agent.<ROLE>.<1..15>@telecom.local` | `Telecom@2026!` | 105 comptes seed (`make keycloak-seed`) |

Console admin Keycloak : `http://localhost:8081/admin` — `admin` / `Admin@1234`.

En développement, le cookie access utilise `access_token`, identique au défaut du gateway Nest, et les autres cookies utilisent le préfixe `itsm-`. En production, les trois noms doivent commencer par `__Host-`, être `Secure`, `Path=/` et sans `Domain`. Définir aussi `AUTH_CSRF_SECRET` avec au moins 32 caractères.

Le BFF et le backend Nest doivent recevoir exactement le même nom de cookie access :

Frontend/BFF :

```dotenv
AUTH_ACCESS_COOKIE_NAME=__Host-access-token
```

Backend Nest :

```dotenv
AUTH_ACCESS_COOKIE_NAME=__Host-access-token
```

Le proxy edge transmet à Nest les en-têtes `Origin` et `Cookie` fournis par le navigateur. Il ne doit jamais reconstruire `Origin` à partir de son propre host, sinon une origine hostile pourrait être transformée en origine autorisée avant la validation WebSocket.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Les E2E visent une instance réelle avec `PLAYWRIGHT_BASE_URL`; ils ne simulent pas le happy path métier. Le hook pre-commit exécute lint, typage et tests unitaires.

## Contrat backend

`contracts/openapi.json` est le snapshot immuable publié depuis le commit backend validé. `pnpm contract:generate` régénère `src/lib/api/schema.d.ts` depuis ce fichier versionné et `pnpm contract:check` bloque la CI si le client généré dérive. Une mise à niveau du contrat remplace explicitement le snapshot dans le même commit frontend.

Le job Playwright cible obligatoirement l'environnement GitHub `integration`. Il démarre le frontend du SHA contrôlé et exige `E2E_BACKEND_URL` ainsi que les secrets de comptes E2E ; une configuration absente ou une matrice critique en échec bloque la livraison.
