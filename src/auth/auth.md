# Mémoire — module `auth/`

Journal des décisions et changements concernant `auth/` **et** le template « UNIFIED AUTH » de
base dont il dérive. Toute modification touchant ce module (structure, placement de services,
wiring de module, comportement du template) doit être consignée ici — en plus, le cas échéant,
d'une mise à jour du `CLAUDE.md` racine si la règle d'architecture générale change.

## État actuel

### Contenu de `auth/`

- `controllers/auth.controller.ts` — routes `/auth/*` (register, login, refresh, logout,
  sessions, reset password OTP/lien, PIN, Google).
- `services/auth.service.ts` — orchestrateur : register/login/refresh/logout, Google Firebase
  Auth (`findOrCreateGoogleUser` réécrit **localement**, voir ci-dessous), délègue à
  `SessionService`/`OtpService`/`PasswordService`/`NotificationService`.
- `services/otp.service.ts` — génération/envoi/vérification OTP + rate limiting Redis.
- `services/session.service.ts` — sessions multi-équipements (modèle Telegram :
  `UserDevice` = équipement physique, `UserSession` = session active).
- `services/password.service.ts` — reset password (OTP + lien email), PIN Argon2id.
- `services/notification.service.ts` — FCM (Firebase Admin SDK), désactivé proprement si
  `FIREBASE_SDK` absent.
- `entities/user-device.entity.ts`, `entities/user-session.entity.ts` — entités DB.
- `dto/auth.dto.ts` — DTOs des routes `/auth/*` (register, login, reset, PIN, Google...).

### Ce qui n'est PAS dans `auth/`

- L'entité `User` (source de vérité unique : `users/entities/user.entity.ts`).
- `UserService`/`UserController` (dans `users/`).
- `JwtUserInfo`/`AuthApiRequest` (dans `shared/auth.type.dto.ts` — utilisés par
  `core/middleware` et `users/controllers`, qui ne peuvent pas dépendre de `auth/`).

### Wiring du module (`auth.module.ts`)

```ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDevice, UserSession]), // import de la CLASSE User
    MailModule,                                                 // (users/entities), pas du module
  ],
  controllers: [AuthController],
  providers: [AuthService, NotificationService, OtpService, SessionService, PasswordService],
  exports: [SessionService, PasswordService],
})
```

**Règle de dépendance actuelle : `users → auth`, jamais l'inverse.** `AuthModule` n'importe
jamais `UsersModule` — il importe uniquement la **classe** `User` (type + décorateur d'entité)
pour son propre `TypeOrmModule.forFeature`. `UsersModule` importe `AuthModule` pour que
`UserService` consomme `SessionService`/`PasswordService` (`softDeleteMe`, `updateStatus`,
`adminResetPassword`, `hardDelete`). Aucun cycle de modules, aucun `forwardRef()`.

`AuthService.findOrCreateGoogleUser` (Google Firebase Auth) est une méthode **privée** de
`AuthService`, avec son propre `Repository<User>` injecté — elle n'appelle plus
`UserService`. C'est la seule fonction que `auth/` avait empruntée à `users/` ; elle a été
réécrite localement plutôt que de garder une dépendance croisée.

## Historique

### 1. État initial du template (avant toute intervention)

Le template « UNIFIED AUTH » avait `User` dupliqué : une copie complète dans `auth/`
(`entities/user.entity.ts`, `services/user.service.ts`, `controllers/user.controller.ts`,
`dto/user.dto.ts`) **et** une copie dans `users/`. Deux classes `@Entity('users')`
coexistaient → collision de métadonnées TypeORM à l'auto-chargement. `auth/` portait aussi
`SessionService`/`OtpService`/`PasswordService` + `UserDevice`/`UserSession`. `UsersModule`
était un `@Module({})` vide. Des références obsolètes (`UserRole.engineer/agent`,
`ApiClientType.manager`, hérités du template générique avant l'adaptation aux rôles métier
`user`/`candidate`/`admin`/`commission`) cassaient la compilation.

### 2. Nettoyage de la duplication `User` + tentative « tout dans `users/` »

- Suppression des doublons `User` dans `auth/` (entité/service/controller/dto) — `users/`
  devient la seule source de vérité pour `User`.
- Suppression du doublon `users/entities/audit.ts` (→ `shared/audit.ts`).
- `UsersModule` câblé (TypeOrm forFeature, controller, service, exports).
- **Premier essai de placement** : `SessionService`/`OtpService`/`PasswordService` +
  `UserDevice`/`UserSession` déplacés de `auth/` vers `users/`, et `AuthModule` mis à importer
  `UsersModule` (au lieu de son propre wiring `User`), pour respecter la règle générale
  « `auth → users` uniquement ».
- `JwtUserInfo`/`AuthApiRequest` déplacés de `auth/dto/auth.type.dto.ts` vers
  `shared/auth.type.dto.ts` (car `core/middleware` et `users/controllers` en avaient besoin
  sans pouvoir dépendre de `auth/`).
- Correction des références obsolètes `UserRole.engineer/agent`/`ApiClientType.manager` →
  `admin`/`commission` (build cassé sinon).
- Enregistrement de `ElectionsModule` dans `app.module.ts`.

### 3. Retour en arrière — décision finale sur le placement (demande explicite)

Le placement « tout dans `users/` » a été **annulé sur demande explicite** :
`SessionService`/`OtpService`/`PasswordService` + `UserDevice`/`UserSession` reviennent dans
`auth/`. Pour éviter de recréer le cycle `auth ↔ users` (puisque `UserService` a besoin de
`SessionService`/`PasswordService`), la dépendance a été **inversée** plutôt que résolue par
`forwardRef()` :

- `UsersModule` importe `AuthModule` (et non l'inverse).
- `AuthModule` s'enregistre lui-même dans `TypeOrmModule.forFeature([User, UserDevice,
  UserSession])` en import**ant** la classe `User` de `users/entities/` — un import de type/
  décorateur, pas un import du module `UsersModule`.
- `AuthService.findOrCreateGoogleUser` réécrit localement (voir « État actuel » ci-dessus) pour
  qu'`auth/` ne dépende plus d'aucun provider de `users/`.
- `CLAUDE.md` mis à jour : la règle générale est désormais **`users → auth`**, remplaçant
  l'ancienne recommandation `auth → users` pour cette paire de modules.

## Points d'attention pour la suite

- Si un futur besoin réintroduit une dépendance `auth → users` (ex: `AuthService` a de nouveau
  besoin d'une méthode de `UserService`), **ne pas** réimporter `UsersModule` dans `AuthModule`
  — réécrire la fonction localement (comme `findOrCreateGoogleUser`) ou remonter le besoin
  commun dans `shared/`/`utils/`, pour ne jamais recréer le cycle.
- `pinCode` est utilisé par `PasswordService` (`setupPin`/`checkPin`/`removePin`) via des casts
  `as any` — le champ n'existe pas sur `User` de base, il est attendu sur une extension projet
  de l'entité (cf. commentaire du template). Ne pas « corriger » ces casts sans ajouter la
  colonne, ou sans confirmer que le PIN n'est pas utilisé côté web pur.
- `dto/auth.type.dto.ts` dans `auth/` a été supprimé (contenu déplacé vers
  `shared/auth.type.dto.ts`) — ne pas le recréer par erreur en copiant un ancien template.
