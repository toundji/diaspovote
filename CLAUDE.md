# CLAUDE.md

Contexte pour les assistants IA travaillant sur **DiaspoVote** (webservices NestJS).
Le socle auth/users/mail est un template universel (JWT double-token, sessions
multi-équipements, PIN Argon2id, OTP, Google Firebase Auth, notifications FCM, mail
asynchrone BullMQ avec relance). Le domaine métier (élections, candidatures, votes,
réalisations) est spécifique à DiaspoVote et suit le diagramme de classe
`diagramme-classe-vote-nestjs.mermaid` à la racine du repo — **source de vérité** pour
les entités du domaine, leurs champs et leurs relations. Toute nouvelle entité/relation
doit d'abord être vérifiée contre ce diagramme (et le diagramme mis à jour si une
décision le fait évoluer).

## Commandes

```bash
npm run start:dev     # dev, watch
npm run build         # nest build
npm run start:prod    # node dist/main
npm run lint          # eslint --fix
npm test              # jest
npm run test:e2e      # jest e2e
npm run migration:run # applique les migrations en attente
npm run seed          # seed idempotent (admin principal pour l'instant)
npm run seed:refresh  # supprime puis recrée l'admin principal
```

### Seed

`src/seeder.ts` réutilise le `DataSource` TypeORM des migrations (`database/data-source.ts`)
— pas de boot Nest complet, pas besoin de Redis/BullMQ pour seeder. Nécessite les
migrations déjà appliquées. Variables `.env` requises : `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD` (`SEED_ADMIN_FIRST_NAME`/`SEED_ADMIN_LAST_NAME` optionnels,
défaut "Admin DiaspoVote"). Mot de passe haché via `apiHashPassword` (bcrypt, même
fonction que `AuthService.register()`) — pas Argon2id, pour rester compatible avec
`apiComparePasswords` au login. `npm run seed` est idempotent (ignore si l'email existe
déjà) ; `--refresh` fait un hard delete puis recrée (nécessaire pour libérer la
contrainte unique sur l'email, un soft-delete ne suffirait pas).

## Architecture

Découpage par responsabilité, avec une **règle de dépendance à sens unique** — c'est
l'invariant le plus important du projet :

```
shared/  ←  database/  ←  core/  ←  { users/, mail/ }  ←  auth/
                                            ↑
                                       election/  ←  oversight/
```

| Dossier      | Rôle                                                                 | Dépend de        |
|--------------|----------------------------------------------------------------------|------------------|
| `shared/`    | Primitives **pures** — aucune DI, aucun `@Module`                     | rien             |
| `database/`  | Config ORM (`base_orm_config.ts`)                                    | shared           |
| `core/`      | Infra Nest : guards, middleware, interceptors, filters, decorators   | shared, database |
| `utils/`     | Helpers sans état : `api-util`, `api-error`, `api-fs`, `redis.config`, `swagger-config` | shared |
| `users/`     | Agrégat utilisateur : `User`, `UserDevice`, `UserSession`, `UserService`, `SessionService`, `PasswordService`, `OtpService`, `UserController` | shared, core, utils, mail |
| `auth/`      | **Flux** d'authentification : `AuthService`, `AuthController`, `NotificationService` (FCM) | users (+ ci-dessus) |
| `mail/`      | Mail asynchrone BullMQ + relance                                     | shared, utils    |
| `election/`  | Processus électoral DiaspoVote : `Jurisdiction`, `Election`, `Condition`, `ElectoralRoll`, `Vote`, `Candidacy`, `CandidacyProgram`, `CampaignPost`. Référence `users/` par id simple (colonne, pas de relation TypeORM) — jamais d'import croisé d'entité. | shared, database, core, utils |
| `oversight/` | Suivi post-élection DiaspoVote : `ActionCategory`, `Achievement`, `Contestation`, `Question`, `AuditLog`. Redevabilité des élus envers les électeurs — fonctionne en continu, pas seulement pendant la fenêtre électorale. Importe `ElectionsModule` pour sa **seule API publique** (`CandidacyService`, ex: vérifier le propriétaire d'une candidature) — aucune relation TypeORM/import d'entité vers `election/` ou `users/`, uniquement des colonnes id (`candidacyId`, `categoryId`, `achievementId`...). | shared, database, core, utils, **election/** |

Contenu de `shared/` : `audit.ts` (entité de base), `common.enum.ts`
(`UserRole`, `UserStatus`, `ApiClientType`, `TokenType`, `DeviceType`, `AbilityEnum`,
`FileStatus`), `media.dto.ts` (DTOs médias/fichiers).

### Règles non négociables

- **Rien n'importe depuis `auth/`** sauf via son API publique. Une primitive partagée
  (enum, classe de base) va dans `shared/` ; une chose DB dans `database/`. Si `core/` ou
  `mail/` tire un symbole de `auth/entities/`, c'est un bug d'architecture.
- **`auth → users` uniquement, jamais l'inverse.** `auth/` orchestre l'authentification
  contre l'agrégat `users/`. `users/` ignore l'existence de `auth/`. Aucun cycle de modules,
  aucun `forwardRef()`. `PasswordService`/`SessionService`/`OtpService` vivent dans `users/`
  (pas dans `auth/`) précisément pour éviter le cycle `users → auth → users`.
- **`mail/` et `utils/` ne dépendent d'aucune entité métier.** Un service qui a juste besoin
  de `{ email, firstName }` type sur une interface structurelle locale (ex. `MailRecipient`
  dans `mail.types.ts`, `JwtPayloadUser` dans `api-util.ts`) plutôt que d'importer `User`.
- **`election/` et `oversight/` référencent `users/` (et entre eux) uniquement par id** (colonne
  `userId`/`electionId`/`candidacyId`... simple, pas de `@ManyToOne`/import d'entité) — évite un
  couplage bidirectionnel entre modules métier et le socle auth/users, et entre modules métier
  eux-mêmes. `oversight/` → `election/` est autorisé **au niveau service** (`oversight/` importe
  `ElectionsModule` et injecte `CandidacyService` pour vérifier la propriété d'une candidature),
  c'est le même principe que `auth/` → `users/` : dépendance à sens unique via l'API publique
  exportée d'un module, jamais via une relation TypeORM ou un import d'entité.
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
                                          valide clé API → req.apikey.{valid,type}, parse UA → req.userDevice, IP)
   → ApiKeyGuard              (req.apikey.valid)
   → RequireClientTypeGuard   (req.apikey.type ∈ @RequireClientType(...) si présent sur la route)
   → RequireAuthGuard         (req.user + jti non blacklisté dans Redis)
   → RequireRoleGuard         (req.user.roles)
   → RequireUserStatusGuard   (req.user.status)
```

### `ApiClientType` — identifier la source de l'appel

`ApiClientType` (mobile, ios, web, web_app, landing, website, **back_office**, swagger) est
déterminé par la clé API envoyée (`getApiClientType()` dans `api-util.ts`), **indépendamment**
du JWT/rôle de l'utilisateur. Deux mécanismes distincts et cumulables :

- `@Roles(...)` + `RequireRoleGuard` → **qui** appelle (rôle du compte connecté).
- `@RequireClientType(...)` + `RequireClientTypeGuard` (`core/decorators/api.decorator.ts`,
  `core/guards/jwt-auth.guard.ts`) → **depuis où** l'appel arrive (quelle clé API/app cliente).

Utile pour verrouiller les routes d'administration à la clé API back-office même si un
JWT admin valide était utilisé ailleurs (défense en profondeur) : voir
`mail/mail.controller.ts` (niveau controller) et les routes admin de
`users/controllers/user.controller.ts` (niveau route, car ce controller mélange routes
`/me` ouvertes à tout client et routes admin réservées au back-office).

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

## Migration users/auth — terminée

L'extraction de `User` hors de `auth/` (section précédente de ce fichier) est **faite** :
doublons supprimés, `UsersModule` câblé (`TypeOrmModule.forFeature([User, UserDevice,
UserSession])`, exporte `TypeOrmModule` + `UserService`/`SessionService`/`PasswordService`/
`OtpService`), `AuthModule` réduit à `AuthService`/`AuthController`/`NotificationService` et
importe `UsersModule`. La décision du point 5 (ancien) a été tranchée : `SessionService`,
`PasswordService`, `OtpService`, `UserDevice`, `UserSession` vivent dans `users/` —
dépendance strictement `auth → users`, aucun `forwardRef()`.

`UserRole.user` a été renommé `UserRole.voter` pour suivre le diagramme de classe
(`voter | candidate | admin | commission`) — migration TypeORM dédiée pour les données
existantes. `User` porte désormais aussi `phone`, `jurisdictionId` et `pinCode` (diagramme).

## Domaine métier — état d'avancement

Suivre `diagramme-classe-vote-nestjs.mermaid` pour l'ordre des clusters : identité →
périmètre géographique → élection/éligibilité → candidature → vote (→ `election/`)
→ réalisations vérifiées → échanges/audit (→ `oversight/`).

`election/` = faire tourner le processus électoral. `oversight/` = redevabilité des élus
après élection (fonctionne en continu, indépendamment du cycle électoral) — module distinct
décidé pour séparer ces deux préoccupations.

### `election/`

- ✅ Périmètre géographique (`Jurisdiction`), élection/éligibilité (`Election`,
  `ElectoralRoll`) — entités + service + controller.
- ✅ Candidature (`Candidacy`, `CandidacyProgram`, `CampaignPost`) — entités + service +
  controller (`/candidacies`). État dérivé de `approvedAt`/`rejectedAt` (pas de colonne
  status), même convention que `Achievement`. Lecture publique (portail vitrine), écriture
  réservée au propriétaire, revue (`approve`/`reject`) réservée à `commission`/`admin`
  **depuis le back-office** (`@RequireClientType(back_office)`).
- ✅ `Condition` — CRUD par élection (`/elections/:electionId/conditions`), lecture publique,
  écriture admin.
- ✅ `Vote` — `/votes` : cast (vérifie élection active + fenêtre startsAt/endsAt, inscription
  sur la liste électorale via `ElectoralRollService.isRegistered`, candidature approuvée et
  rattachée à la même élection, unicité `userId`/`electionId`), vérification de reçu publique
  (`GET /votes/receipt/:receiptCode`), résultats agrégés (`GET /votes/results/:electionId`,
  publics une fois `resultsPublished`, aperçu admin/commission avant). `ElectionService.activate()`
  exige désormais ≥ 2 candidatures approuvées et une liste électorale non vide.

### `oversight/`

- ✅ `ActionCategory` — donnée de référence (`/action-categories`), lecture publique, écriture admin.
- ✅ `Achievement` — `/candidacies/:candidacyId/achievements`. Même convention que `Candidacy`
  (état dérivé de `approvedAt`/`rejectedAt`). Publication réservée aux candidats **approuvés**
  (vérifié via `CandidacyService.getById`), catégorie doit être active. Revue (`approve`/`reject`)
  réservée à commission/admin depuis le back-office ; tracée dans `AuditLog`.
- ✅ `Contestation` — `/achievements/:achievementId/contestations`. Un citoyen conteste
  uniquement une réalisation **approuvée**. Lecture/résolution réservées à commission/admin
  (pas de portail public) ; résolution tracée dans `AuditLog`. La décision sur l'`Achievement`
  contesté (ex: le rejeter) passe par `AchievementService`, pas par `Contestation` elle-même.
- ✅ `Question` — `/candidacies/:candidacyId/questions`. Tout utilisateur authentifié pose une
  question ; le candidat propriétaire répond ; modération (`hide`) réservée à commission/admin
  (tracée dans `AuditLog`). Liste publique des questions non masquées ; le candidat/admin/
  commission voient aussi les masquées.
- ✅ `AuditLog` — écrit uniquement via `AuditLogService.record()` (appelé par `Achievement`/
  `Contestation`/`Question` après une action de modération). Lecture (`GET /audit-log`) réservée
  à commission/admin depuis le back-office — entité métier distincte de l'audit technique
  `createdBy`/`updatedBy` (`core/interceptors/api-audit.ts`), à ne pas confondre.
