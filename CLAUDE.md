# CLAUDE.md

Contexte pour les assistants IA travaillant sur ce template (ou un projet qui en dérive).
NestJS universel : un seul backend pour mobile (Flutter) **et** web. Couvre JWT double-token,
sessions multi-équipements, PIN (Argon2id), OTP, Google Firebase Auth, notifications FCM,
mail asynchrone (BullMQ) avec relance.

> **Projet dérivé actif — Plateforme électorale de la diaspora béninoise en Russie.**
> Digitalise l'élection du président de la diaspora. Élections **annuelles** et **par
> périmètre géographique** (états/oblasts comme Moscou, et éventuellement la fédération).
> Trois publics : votants (rôle `user`), candidats (`candidate`), organisation (`admin` +
> `commission` observatrice). Voir la section « Domaine métier » plus bas.

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
shared/ ← database/ ← core/ ← { users/, mail/ } ← auth/ ← elections/ ← candidates/ ← votes/
```

| Dossier        | Rôle                                                                 | Dépend de              |
|----------------|----------------------------------------------------------------------|------------------------|
| `shared/`      | Primitives **pures** — aucune DI, aucun `@Module`                    | rien                   |
| `database/`    | Config ORM (`base_orm_config.ts`)                                    | shared                 |
| `core/`        | Infra Nest : guards, middleware, interceptors, filters, decorators  | shared, database       |
| `utils/`       | Helpers sans état : `api-util`, `api-error`, `api-fs`, `redis.config`, `swagger-config` | shared |
| `users/`       | Agrégat utilisateur : `User`, `UserService`, `UserController`, `user.dto` + sessions & credentials | shared, core, utils, mail |
| `auth/`        | **Flux** d'authentification : `AuthService`, `AuthController`, `OtpService`, `NotificationService` | users (+ ci-dessus) |
| `mail/`        | Mail asynchrone BullMQ + relance                                    | shared, utils          |
| `elections/`   | Cœur électoral : `Jurisdiction`, `Election`, `Condition`, `ElectoralRoll`, `Vote` (entité) | shared, core, utils, users |
| `candidates/`  | Candidatures & campagne : `Candidacy`, `CandidacyProgram`, `CampaignPost`, `Question`, `ActionCategory`, `Achievement`, `Contestation` | elections, users, shared, core |
| `votes/`       | **Flux de vote** + calcul des résultats (a besoin d'`Election` ET de `Candidacy`) | elections, candidates |

### Règles non négociables

- **Rien n'importe depuis `auth/`** sauf via son API publique. Une primitive partagée
  (enum, classe de base) va dans `shared/` ; une chose DB dans `database/`. Si `core/` ou
  `mail/` tire un symbole de `auth/entities/`, c'est un bug d'architecture.
- **`auth → users` uniquement, jamais l'inverse.** `auth/` orchestre l'authentification
  contre l'agrégat `users/`. `users/` ignore l'existence de `auth/`. Aucun cycle de modules,
  aucun `forwardRef()`.
- **Sens unique côté métier aussi.** `candidates → elections`, jamais l'inverse : `elections/`
  n'importe **jamais** rien de `candidates/`. `Candidacy` référence `Election` (autorisé) ;
  l'inverse (`Vote` qui a besoin de valider une `Candidacy`) ne se fait **pas** dans
  `elections/` — c'est le rôle de `votes/`, qui dépend des deux. Voir « Placement du vote ».
- **Un seul système de hash** : Argon2id via `PasswordService`. Ne jamais réintroduire de
  `bcrypt` / `hashSync` libre dans les utils.
- **Un fichier = une responsabilité.** Pas de fichier util fourre-tout. Le filesystem va dans
  `utils/api-fs.ts`, la crypto/JWT dans `api-util.ts`, les erreurs dans `api-error.ts`.
- `shared/` reste **pur** : classes/enums/DTOs sans injection, jamais de `@Module` ni de provider.

Contenu de `shared/` : `audit.ts` (entité de base), `common.enum.ts`
(`UserRole`, `UserStatus`, `ApiClientType`, `TokenType`, `DeviceType`, `AbilityEnum`,
`FileStatus`), `election.enum.ts` (`ElectionStatus`, `JurisdictionType`, `ConditionType`),
`media.dto.ts` (DTOs médias/fichiers).

## Conventions

### Entités

Toute entité étend `Audit` (`shared/audit.ts`) → id `uuid` (`@PrimaryGeneratedColumn('uuid')`)

- timestamps d'audit. Chaque entité déclare `static entityName` et `static entityCode` (ex.
`'01'` pour `users`). Un `code` lisible est généré en `@BeforeInsert` : `entityCode + Date.now()`.
Chaque projet **étend** `User` avec ses propres colonnes — il ne le réécrit pas depuis `auth/`.
Les entités sont **auto-chargées** par glob (`**/*.entity.ts`) : aucun registre manuel, mais
attention aux doublons de classe (voir « État de migration »).

**Registre des `entityCode`** (unicité obligatoire) :

| Code | Entité            | Module       | Code | Entité           | Module        |
|------|-------------------|--------------|------|------------------|---------------|
| `01` | User              | users        | `20` | Candidacy        | candidates    |
| `10` | Jurisdiction      | elections    | `21` | CandidacyProgram | candidates    |
| `11` | Election          | elections    | `22` | CampaignPost     | candidates    |
| `12` | Condition         | elections    | `23` | Question         | candidates    |
| `13` | ElectoralRoll     | elections    | `30` | ActionCategory   | candidates    |
| `14` | Vote              | elections*   | `31` | Achievement      | candidates    |
| `40` | AuditLog          | (transversal)| `32` | Contestation     | candidates    |

\* L'entité `Vote` (table) est portée par `elections/` ; le **flux** de vote vit dans `votes/`.

### Pattern « timestamps nullables plutôt que `status` »

Pour les états à deux/trois positions simples, **ne pas** créer d'enum de statut : utiliser des
colonnes `Date` nullables dont la présence encode l'état. On gagne le *quand* gratuitement, ce
qui sert directement l'audit. Exemples adoptés :

- `Question` : `answeredAt` + `hiddenAt` (les deux `null` ⇒ en attente).
- `Candidacy`, `Achievement` : `approvedAt` + `rejectedAt`.
- `Contestation` : `resolvedAt`.

On **garde un enum** uniquement pour une vraie machine à états : `Election.status`
(`draft`/`active`/`closed`). Contrainte applicative à respecter : ne jamais renseigner deux
timestamps mutuellement exclusifs (ex. `approvedAt` **et** `rejectedAt`).

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
Convention `customCode` : `1xxx` = Auth, `2xxx` = User, `3xxx` = Métier. Sous-allocation métier
recommandée : `30xx` élections, `31xx` candidatures, `32xx` votes, `33xx` réalisations.

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

## Domaine métier — plateforme électorale

### Rôles (`UserRole`, colonne MySQL `set`)

`user` (votant, **valeur par défaut**), `candidate`, `admin`, `commission`. Un utilisateur peut
cumuler des rôles (ex. `[user, commission]`). La `commission` est un observateur en lecture seule
— pilier de légitimité : elle voit les logs et valide, mais ne décide pas du résultat.

### Enums métier (`shared/election.enum.ts`)

- `ElectionStatus` : `draft` → `active` → `closed` (machine à états, gardée dans `ElectionService`).
- `JurisdictionType` : `federation`, `state` (hiérarchie via `Jurisdiction.parentId`).
- `ConditionType` : `candidate`, `voter`, `campaign` (discriminant de l'entité unique `Condition`).

### Invariants métier (non négociables)

- **Élection = (année, périmètre).** `UNIQUE(year, jurisdictionId)`. Plusieurs scrutins la même
  année (Moscou 2026, fédération 2026…) coexistent sans collision.
- **Taux de participation scopé par élection.** `rate = votes(election) / roll(election)`.
  Comme `ElectoralRoll` est **refait à chaque édition**, le dénominateur est propre à l'année
  *et* au périmètre. Ne jamais calculer un taux global tous scrutins confondus.
- **Une voix par personne et par élection.** `Vote UNIQUE(userId, electionId)`.
- **Vote traçable (choix assumé du projet).** `Vote` lie `userId` + `candidacyId` ; un
  `receiptCode` permet à l'électeur de vérifier sa voix. Le *secret vis-à-vis des tiers* est une
  affaire de **contrôle d'accès**, pas de modèle : verrouiller qui peut lire ce lien.
- **Transitions d'état dans le service, jamais le controller.** Modif/suppression d'élection
  uniquement en `draft` ; résultats publiables uniquement après `closed` ; liste électorale
  verrouillée dès `closed`.
- **Réalisations : publiées et vérifiées, jamais notées.** `Achievement` n'a **aucun score/point**.
  La commission valide l'authenticité (preuve, ex. lien vidéo + `proofSnapshot` archivé), elle
  n'attribue pas de valeur. L'affichage met en avant le parcours, pas un classement chiffré.
- **`Condition` : une seule entité, discriminée par `type`.** Ne pas créer d'entités séparées
  candidat/votant/campagne tant qu'elles partagent la même forme.

### Placement du vote (résout le cycle elections ↔ candidates)

`Candidacy` dépend d'`Election` (`candidates → elections`). Le flux de vote a besoin des deux
(valider que la candidature est approuvée **et** rattachée à l'élection). Pour préserver le sens
unique : le **`VoteService`** (émission du vote + résultats) vit dans `votes/`, qui importe
`ElectionsModule` et `CandidatesModule`. `elections/` reste ignorant de `candidates/`.
L'`ElectoralRollService` expose déjà `isRegistered(electionId, userId)` comme point d'entrée
d'éligibilité pour ce flux.

## État de migration — à finaliser

Le template est **à mi-refonte** (extraction de `User` hors de `auth/`). Étapes restantes :

1. **Supprimer les doublons `User` dans `auth/`** : `auth/entities/user.entity.ts`,
   `auth/services/user.service.ts`, `auth/controllers/user.controller.ts`, `auth/dto/user.dto.ts`.
   `users/` fait foi. ⚠️ Tant que deux classes `@Entity('users')` coexistent, l'auto-chargement
   par glob provoque une **collision de métadonnées TypeORM** — à régler avant d'injecter un
   `Repository<User>` dans `elections/` (validation « l'électeur existe et réside dans le périmètre »).
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

### Adaptations projet à ne pas oublier

- `UserRole` a été **remplacé** par les valeurs métier (`user`/`candidate`/`admin`/`commission`).
  Les `@Roles(UserRole.manager | engineer | …)` hérités du template doivent être remplacés par
  `admin` / `commission`.
- Enregistrer `ElectionsModule` (puis `CandidatesModule`, `VotesModule`) dans les `imports` de
  `app.module.ts`.

## État d'avancement du domaine métier

- ✅ `elections/` — entités (Jurisdiction, Election, Condition, ElectoralRoll, Vote), CRUD +
  cycle de vie de l'élection, CRUD Jurisdiction, gestion `ElectoralRoll` (inscription, import en
  masse, radiation, liste, stats de participation).
- ⏳ `candidates/` — à créer (Candidacy, CandidacyProgram, CampaignPost, Question, ActionCategory,
  Achievement, Contestation).
- ⏳ `votes/` — flux d'émission du vote + calcul des résultats (après `candidates/`).
- ⏳ `AuditLog` (transversal, append-only) — journal d'intégrité des événements sensibles
  (vote émis, candidature validée, roll importé, scrutin ouvert/fermé). Complète l'intercepteur
  technique existant, ne le remplace pas.
