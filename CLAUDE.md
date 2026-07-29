# CLAUDE.md

Contexte pour les assistants IA travaillant sur ce template (ou un projet qui en dérive).
NestJS universel : un seul backend pour mobile (Flutter) **et** web. Couvre JWT double-token,
sessions multi-équipements, PIN (Argon2id), OTP, Google Firebase Auth, notifications FCM,
mail asynchrone (BullMQ) avec relance.

## Commandes

```bash
npm run start:dev     # dev, watch
npm run build         # nest build
npm run start:prod    # node dist/main
npm run lint          # eslint --fix
npm test              # jest
npm run test:e2e      # jest e2e
```

## Architecture

Découpage par responsabilité, avec une **règle de dépendance à sens unique** — c'est
l'invariant le plus important du projet :

```
shared/  ←  database/  ←  core/  ←  { users/, mail/ }  ←  auth/
```

| Dossier      | Rôle                                                                 | Dépend de        |
|--------------|----------------------------------------------------------------------|------------------|
| `shared/`    | Primitives **pures** — aucune DI, aucun `@Module`                     | rien             |
| `database/`  | Config ORM (`base_orm_config.ts`)                                    | shared           |
| `core/`      | Infra Nest : guards, middleware, interceptors, filters, decorators   | shared, database |
| `utils/`     | Helpers sans état : `api-util`, `api-error`, `api-fs`, `redis.config`, `swagger-config` | shared |
| `users/`     | Agrégat utilisateur : `User`, `UserService`, `UserController`, `user.dto` + sessions & credentials | shared, core, utils, mail |
| `auth/`      | **Flux** d'authentification : `AuthService`, `AuthController`, `OtpService`, `NotificationService` | users (+ ci-dessus) |
| `mail/`      | Mail asynchrone BullMQ + relance                                     | shared, utils    |

Contenu de `shared/` : `audit.ts` (entité de base), `common.enum.ts`
(`UserRole`, `UserStatus`, `ApiClientType`, `TokenType`, `DeviceType`, `AbilityEnum`,
`FileStatus`), `media.dto.ts` (DTOs médias/fichiers).

### Règles non négociables

- **Rien n'importe depuis `auth/`** sauf via son API publique. Une primitive partagée
  (enum, classe de base) va dans `shared/` ; une chose DB dans `database/`. Si `core/` ou
  `mail/` tire un symbole de `auth/entities/`, c'est un bug d'architecture.
- **`auth → users` uniquement, jamais l'inverse.** `auth/` orchestre l'authentification
  contre l'agrégat `users/`. `users/` ignore l'existence de `auth/`. Aucun cycle de modules,
  aucun `forwardRef()`.
- **Un seul système de hash** : Argon2id via `PasswordService`. Ne jamais réintroduire de
  `bcrypt` / `hashSync` libre dans les utils.
- **Un fichier = une responsabilité.** Pas de fichier util fourre-tout. Le filesystem va dans
  `utils/api-fs.ts`, la crypto/JWT dans `api-util.ts`, les erreurs dans `api-error.ts`.
- `shared/` reste **pur** : classes/enums/DTOs sans injection, jamais de `@Module` ni de provider.

## Conventions

### Entités

Toute entité étend `Audit` (`shared/audit.ts`) → id `uuid` (`@PrimaryGeneratedColumn('uuid')`)
- timestamps d'audit. Chaque entité déclare `static entityName` et `static entityCode` (ex.
`'01'` pour `users`). Un `code` lisible est généré en `@BeforeInsert` : `entityCode + Date.now()`.
Chaque projet **étend** `User` avec ses propres colonnes — il ne le réécrit pas depuis `auth/`.

### Tokens

Double JWT. Payload access :
`{ sub, email, roles, type: 'access', jti, dfp }`. `dfp` = device fingerprint
`SHA-256(userId + deviceName + os + deviceType)`, déterministe → logout ciblé par équipement.
Le refresh permet de régénérer sans re-login.

### Sessions multi-équipements

Modèle inspiré de Telegram. Séparation stricte `UserDevice` (l'appareil physique) /
`UserSession` (une session active). `GET /auth/sessions` liste les équipements connectés.

### PIN

Argon2id (pas AES). Deux scénarios : équipement connu (cas 99 %) vs nouveau téléphone /
réinstallation (re-vérification).

### Erreurs

Format de réponse uniforme :

```json
{ "statusCode": 401, "msg": "...", "customCode": 1005, "url": "...", "timestamp": "..." }
```

Validation → champ `validations: { field: [msg] }`. 500 → `errorId` (uuid) pour retrouver le log.
Le champ `detail` n'apparaît **que** dans les logs serveur, jamais côté client.
Convention `customCode` : `1xxx` = Auth, `2xxx` = User, `3xxx` = Métier (défini par projet).

### Guards & middleware (ordre)

```
Requête → ApiDeserializationMiddleware  (vérifie JWT sans DB → req.user + dfp,
                                          valide clé API, parse UA → req.userDevice, IP)
   → ApiKeyGuard          (req.apikey.valid)
   → RequireAuthGuard     (req.user + jti non blacklisté dans Redis)
   → RequireRoleGuard     (req.user.roles)
   → RequireUserStatusGuard (req.user.status)
```

### Redis (rate-limiting & révocation)

Clés : `att:{op}:{userId}` (tentatives), `lock:{op}:{userId}` (verrou), `otp:{op}:{userId}`
(code, TTL = durée OTP), `jti:{jti}` (access token révoqué au logout). Toujours indexé sur
`userId` (immuable) — sauf `login` qui utilise l'email (userId inconnu avant la DB).

### Mail

`MailService.sendXxx()` → `mailQueue.add()` → worker BullMQ → `mailerService.sendMail()`.
Retry auto 3× (backoff 5s/25s/125s). Épuisé → `MailFailedJob` persisté en `pending`.
Routes admin `/mail/failed` pour relance manuelle.

### Firebase

`FIREBASE_SDK` (JSON) en `.env`. Google Auth : le front envoie l'`idToken` Firebase, le back
le vérifie via Admin SDK (find-or-create ; compte Google → `status: active`, `password: NULL`).
FCM pour les notifs mobile. Si `FIREBASE_SDK` absent → service désactivé proprement
(`initialized = false`), pas de crash.

## État de migration — à finaliser

Le template est **à mi-refonte** (extraction de `User` hors de `auth/`). Étapes restantes :

1. **Supprimer les doublons `User` dans `auth/`** : `auth/entities/user.entity.ts`,
   `auth/services/user.service.ts`, `auth/controllers/user.controller.ts`, `auth/dto/user.dto.ts`.
   `users/` fait foi.
2. **Supprimer `users/entities/audit.ts`** (doublon) — `shared/audit.ts` fait foi.
3. **Câbler `UsersModule`** (actuellement `@Module({})` vide) : déclarer `User` (TypeOrm
   forFeature), `UserService`, `UserController` ; **exporter `UserService`**.
4. **`AuthModule`** : importer `UsersModule`, retirer de son propre wiring `User` /
   `UserController` / `UserService`.
5. **Décision à confirmer** — placement de `SessionService` + `PasswordService` +
   entités `UserDevice`/`UserSession`. Recommandation : les déplacer dans `users/` (ils
   font partie de l'agrégat utilisateur), ce qui rend la dépendance strictement `auth → users`
   et **élimine le cycle**. Alternative : les laisser dans `auth/` et accepter un
   `forwardRef()` entre les deux modules (déconseillé).
