# Unified Auth — Template NestJS

Base universelle pour tous les projets backend NestJS.  
Inclut : authentification complète, sessions multi-équipements, PIN code, OTP, mail asynchrone, Redis, BullMQ, TypeORM, Firebase FCM.

---

## Stack

| Couche | Technologie |
|--------|------------|
| Framework | NestJS 11 |
| Base de données | MySQL / MariaDB (TypeORM) |
| Cache / Rate-limit | Redis (ioredis) |
| Queues | BullMQ |
| Auth | JWT (access 15min + refresh 7j glissant) |
| Sessions | Multi-équipements style Telegram (deviceFingerprint) |
| Mail | @nestjs-modules/mailer + Handlebars + BullMQ |
| Notifications push | Firebase Admin SDK (optionnel) |
| Crypto | AES-256-GCM + Argon2id + SHA-256 |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI |

---

## Installation

### 1. Cloner et configurer

```bash
cp .env.example .env
# Remplir .env avec vos valeurs (voir section Variables d'environnement)
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Packages inclus (déjà dans package.json)

| Package | Rôle |
|---------|------|
| `@nestjs/common` `@nestjs/core` `@nestjs/platform-express` | NestJS core |
| `@nestjs/jwt` | Signature / vérification JWT |
| `@nestjs/typeorm` `typeorm` `mysql2` | ORM + driver MySQL |
| `@nestjs/bullmq` `bullmq` | Queues Redis asynchrones |
| `@nestjs-modules/ioredis` `ioredis` | Client Redis (guards, rate-limit) |
| `@nestjs-modules/mailer` `nodemailer` `handlebars` `hbs` | Envoi SMTP + templates |
| `@nestjs/swagger` | Documentation OpenAPI |
| `@nestjs/schedule` | Cron jobs (nettoyage sessions) |
| `@nestjs/config` | Variables d'environnement |
| `@nestjs/event-emitter` | Événements internes |
| `nestjs-cls` | Context local storage (audit trail) |
| `argon2` | Hachage PIN (Argon2id) |
| `bcrypt` | Hachage mot de passe |
| `class-validator` `class-transformer` | Validation DTOs |
| `firebase-admin` | Push notifications FCM (optionnel) |
| `node-device-detector` | Parsing User-Agent (device fingerprint) |
| `request-ip` | Extraction IP client |
| `date-fns` | Manipulation dates |
| `dotenv` | Chargement .env |

Si tu copies uniquement les fichiers source sans le `package.json`, installe tout avec cette commande :

```bash
npm install \
  @nestjs/common @nestjs/core @nestjs/platform-express \
  @nestjs/jwt @nestjs/typeorm @nestjs/bullmq \
  @nestjs/swagger @nestjs/schedule @nestjs/config \
  @nestjs/event-emitter @nestjs/axios \
  @nestjs-modules/ioredis @nestjs-modules/mailer \
  typeorm mysql2 \
  bullmq ioredis \
  nodemailer handlebars hbs \
  nestjs-cls \
  argon2 bcrypt \
  class-validator class-transformer \
  firebase-admin \
  node-device-detector \
  request-ip \
  date-fns dotenv \
  rxjs reflect-metadata \
  express-basic-auth \
  @bull-board/express @bull-board/nestjs
```

```bash
npm install -D \
  @nestjs/cli @nestjs/schematics @nestjs/testing \
  @swc/cli @swc/core \
  @types/bcrypt @types/express @types/jest \
  @types/node @types/nodemailer @types/supertest \
  eslint eslint-config-prettier eslint-plugin-prettier \
  globals typescript typescript-eslint \
  jest ts-jest ts-loader ts-node \
  tsconfig-paths source-map-support \
  prettier supertest
```

### 4. Démarrer en développement

```bash
npm run dev
# ou
npm run start:dev
```

### 5. Build production

```bash
npm run build
npm run start:prod
```

---

## Structure

```
src/
├── common/
│   ├── controllers/
│   │   ├── auth.controller.ts      # Routes /auth/*
│   │   └── user.controller.ts      # Routes /users/*
│   ├── dto/
│   │   ├── auth.dto.ts             # DTOs HTTP auth (class-validator)
│   │   ├── auth.type.dto.ts        # Types partagés (JwtUserInfo, AuthApiRequest)
│   │   └── user.dto.ts             # DTOs HTTP user
│   ├── entities/
│   │   ├── audit.ts                # Entité de base (id, createdAt, updatedBy...)
│   │   ├── common.enum.ts          # UserRole, UserStatus, TokenType...
│   │   ├── user.entity.ts          # Entité User
│   │   ├── user-device.entity.ts   # Équipements connectés
│   │   └── user-session.entity.ts  # Sessions actives par équipement
│   ├── guards/
│   │   ├── api.decorator.ts        # @Public, @Roles, @NoKey, @AuthUser, @AuditInfo
│   │   └── jwt-auth.guard.ts       # ApiKeyGuard, RequireAuthGuard, RequireRoleGuard...
│   ├── middleware/
│   │   └── api-middleware.ts       # Désérialisation JWT + API key (HTTP + WebSocket)
│   └── services/
│       ├── auth.service.ts         # Login, register, logout, refresh, confirm email
│       ├── notification.service.ts # Firebase FCM (topics + push)
│       ├── otp.service.ts          # Génération / vérification OTP + rate limiting
│       ├── password.service.ts     # Reset password, PIN, liens sécurisés
│       ├── session.service.ts      # Sessions multi-équipements + cron nettoyage
│       └── user.service.ts         # Profil, CRUD admin
├── database/
│   └── base_orm_config.ts          # Configuration TypeORM
├── mail/
│   ├── entities/
│   │   └── mail-failed.entity.ts   # Emails échoués (relance manuelle)
│   ├── templates/
│   │   ├── layouts/main.hbs        # Layout Handlebars principal
│   │   ├── confirm-email.hbs
│   │   ├── reset-password.hbs
│   │   ├── reset-pin.hbs
│   │   └── reset-link.hbs
│   ├── mail-failed.service.ts      # Sauvegarde / relance / abandon emails échoués
│   ├── mail.controller.ts          # Routes admin /mail/failed/*
│   ├── mail.module.ts
│   ├── mail.processor.ts           # Worker BullMQ (onJobFailed + onJobCompleted)
│   ├── mail.service.ts             # Mise en queue des emails
│   └── mail.types.ts               # Types MailJob, MailJobType
├── utils/
│   ├── api-audit.ts                # UserAuditInterceptor + UserAuditSubscriber (CLS)
│   ├── api-error-filter.ts         # ExceptionFilter global (format uniforme + errorId)
│   ├── api-error.ts                # ApiError, ApiErrorDb, AppValidationError, codes
│   ├── api-util.ts                 # Crypto, JWT payload, device fingerprint, API key
│   ├── redis.config.ts             # Clés Redis + profils rate-limiting par opération
│   └── swagger-config.ts           # Configuration OpenAPI
├── app.module.ts                   # Module racine
├── app.controller.ts               # GET / → statut API
├── app.service.ts
└── main.ts                         # Bootstrap + CORS + ValidationPipe + Swagger
```

---

## Variables d'environnement

Créer `.env` à la racine à partir du modèle :

```env
# ── App ──────────────────────────────────────────────────────
APP_NAME=MonApp
APP_TAGLINE=Votre tagline
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# ── Base de données (MySQL) ───────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=mon_projet

# ── Redis ─────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_PREFIX=mon_projet

# ── JWT ───────────────────────────────────────────────────────
JWT_SECRET=changez_moi_en_production
JWT_REFRESH_SECRET=changez_moi_aussi
JWT_TOKEN_EXPIRES_IN=15m
# Générer : openssl rand -hex 32

# ── Crypto (AES-256-GCM) ──────────────────────────────────────
CRYPTO_KEY=64_caractères_hex
# Générer : openssl rand -hex 32

# ── API Keys (par type de client) ────────────────────────────
API_KEY_HEADER_NAME=x-api-key
API_KEY_WEB=votre_cle_web
API_KEY_BACK_OFFICE=votre_cle_back_office
API_KEY_SWAGGER=votre_cle_swagger

# ── Mail (SMTP) ───────────────────────────────────────────────
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=user@example.com
MAIL_PASS=secret
MAIL_FROM=noreply@example.com

# ── Firebase FCM (optionnel — mobile uniquement) ──────────────
# Générer : Firebase Console → Paramètres → Comptes de service → Nouvelle clé privée
FIREBASE_SDK={"type":"service_account","project_id":"..."}
FCM_ICON_URL=https://example.com/icon.png

# ── Swagger ───────────────────────────────────────────────────
DOC_PASSWORD=admin
```

---

## Codes d'erreur custom

Tous les codes sont définis dans `utils/api-error.ts`.

### Format de réponse d'erreur

```json
{
  "statusCode": 401,
  "msg": "Access denied. Token expired.",
  "customCode": 1005,
  "url": "/auth/me",
  "timestamp": "2026-06-06T14:32:00.000Z"
}
```

Pour les erreurs 500, un `errorId` est ajouté pour retrouver le log :
```json
{
  "statusCode": 500,
  "msg": "An error occurred. Please try again or contact support.",
  "errorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "url": "/auth/register",
  "timestamp": "2026-06-06T14:32:00.000Z"
}
```

### Table des codes

| Code | Nom | Description |
|------|-----|-------------|
| 1001 | `AUTH_API_KEY_MISSING` | Clé API absente |
| 1002 | `AUTH_API_KEY_INVALID` | Clé API non reconnue |
| 1003 | `AUTH_TOKEN_MISSING` | JWT absent |
| 1004 | `AUTH_TOKEN_INVALID` | JWT malformé |
| 1005 | `AUTH_TOKEN_EXPIRED` | JWT expiré |
| 1006 | `AUTH_TOKEN_REVOKED` | JWT blacklisté (logout) |
| 1007 | `AUTH_CREDENTIALS_INVALID` | Email ou mot de passe incorrect |
| 1008 | `AUTH_EMAIL_EXISTS` | Email déjà utilisé |
| 1009 | `AUTH_EMAIL_NOT_FOUND` | Aucun compte avec cet email |
| 1010 | `AUTH_EMAIL_NOT_VERIFIED` | Compte non confirmé |
| 1011 | `AUTH_OTP_INVALID` | Code OTP incorrect |
| 1012 | `AUTH_OTP_EXPIRED` | Code OTP expiré |
| 1013 | `AUTH_PIN_INVALID` | PIN incorrect |
| 1014 | `AUTH_PIN_NOT_CONFIGURED` | PIN non configuré |
| 1015 | `AUTH_ACCOUNT_BLOCKED` | Compte bloqué |
| 1016 | `AUTH_ACCOUNT_DELETED` | Compte supprimé |
| 1017 | `AUTH_TOO_MANY_ATTEMPTS` | Trop de tentatives |
| 1018 | `AUTH_ACCESS_DENIED` | Rôle insuffisant |
| 1019 | `AUTH_ADMIN_REQUIRED` | Réservé aux admins |
| 2001 | `USER_NOT_FOUND` | Utilisateur introuvable |
| 2002 | `USER_UPDATE_EMPTY` | Aucun champ valide à mettre à jour |
| 3xxx | `BUSINESS_*` | **À définir selon le projet** |

---

## Routes disponibles

Voir la documentation complète sur `/docs` après démarrage.

### Auth `/auth`

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` | Inscription |
| POST | `/auth/login` | Login email + password |
| POST | `/auth/login-pin` | Login par PIN (mobile) |
| POST | `/auth/refresh` | Renouveler les tokens |
| POST | `/auth/logout` | Déconnecter l'équipement courant |
| POST | `/auth/logout-all` | Déconnecter tous les équipements |
| POST | `/auth/confirm-email` | Confirmer email via OTP |
| POST | `/auth/send-reset-otp` | Envoyer OTP reset password |
| POST | `/auth/confirm-reset-otp` | Vérifier OTP → obtenir tempToken |
| POST | `/auth/reset-password` | Appliquer nouveau mot de passe (via tempToken) |
| POST | `/auth/send-reset-link` | Envoyer lien reset (web) |
| POST | `/auth/reset-from-link` | Appliquer nouveau mot de passe (via lien) |
| POST | `/auth/setup-pin` | Configurer le PIN (mobile) |
| POST | `/auth/reset-pin` | Réinitialiser le PIN via OTP |
| PUT | `/auth/update-password` | Changer le mot de passe (connecté) |
| GET | `/auth/sessions` | Lister les équipements connectés |
| DELETE | `/auth/sessions/:id` | Révoquer un équipement |

### User `/users`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users/me` | Profil de l'utilisateur connecté |
| PATCH | `/users/me` | Mettre à jour son profil |
| GET | `/users` | [Admin] Lister les utilisateurs |
| GET | `/users/:id` | [Admin] Voir un utilisateur |
| PATCH | `/users/:id/status` | [Admin] Modifier le statut |
| PATCH | `/users/:id/roles` | [Admin] Modifier les rôles |
| POST | `/users/:id/reset-password` | [Admin] Reset password |

### Mail `/mail`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/mail/failed` | [Admin] Lister les emails échoués |
| POST | `/mail/failed/:id/retry` | [Admin] Relancer un email échoué |
| DELETE | `/mail/failed/:id` | [Admin] Abandonner un email échoué |

---

## Intégrer dans un nouveau projet

### 1. Copier le template

```bash
cp -r unified-auth/ mon-projet/
cd mon-projet
npm install
```

### 2. Configurer `.env`

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 3. Ajouter vos entités

Étendre `User` ou créer vos propres entités héritant de `Audit` :

```ts
// src/mon-module/entities/mon-entite.entity.ts
import { Audit } from '../../common/entities/audit';

@Entity('ma_table')
export class MonEntite extends Audit {
    @Column()
    monChamp!: string;
}
```

### 4. Ajouter vos codes d'erreur métier

Dans `utils/api-error.ts`, décommenter et adapter la section 3xxx :

```ts
// ── Métier (3xxx) — spécifiques à ce projet ──────────────────
BUSINESS_MONTANT_TROP_FAIBLE: 3001,
BUSINESS_TELEPHONE_INVALIDE:  3002,
```

### 5. Créer votre module métier

```ts
@Module({
    imports: [
        TypeOrmModule.forFeature([MonEntite]),
        CommonModule, // donne accès à UserService, AuthService...
    ],
    controllers: [MonController],
    providers: [MonService],
})
export class MonModule {}
```

### 6. Enregistrer dans `app.module.ts`

```ts
imports: [
    // ...
    CommonModule,
    MailModule,
    MonModule, // ← ajouter ici
],
```

---

## Sécurité — checklist avant mise en production

- [ ] Changer `JWT_SECRET` et `JWT_REFRESH_SECRET` (minimum 64 caractères aléatoires)
- [ ] Changer `CRYPTO_KEY` (`openssl rand -hex 32`)
- [ ] Configurer `CORS_ORIGIN` avec le domaine exact (pas `*`)
- [ ] Mettre `NODE_ENV=production` (désactive Swagger)
- [ ] Configurer Redis avec mot de passe
- [ ] Activer SSL sur la base de données
- [ ] Révoquer et regénérer les clés Firebase si elles ont été exposées
- [ ] Ne jamais committer `.env` dans Git

---

## Générer les secrets

```bash
# JWT_SECRET et JWT_REFRESH_SECRET
openssl rand -base64 64

# CRYPTO_KEY (AES-256-GCM)
openssl rand -hex 32

# API keys
openssl rand -hex 24
```
