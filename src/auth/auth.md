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
  Auth (`findOrCreateGoogleUser` **privé**, avec son propre `Repository<User>` — n'appelle pas
  `UserService`), délègue à `SessionService`/`OtpService`/`PasswordService`/`NotificationService`.
- `services/otp.service.ts` — génération/envoi/vérification OTP + rate limiting Redis.
- `services/session.service.ts` — sessions multi-équipements (modèle Telegram :
  `UserDevice` = équipement physique, `UserSession` = session active).
- `services/password.service.ts` — reset password (OTP + lien email), PIN Argon2id
  (`pinCode` est une colonne typée sur `User`, plus besoin de casts `as any`).
- `services/notification.service.ts` — FCM (Firebase Admin SDK), désactivé proprement si
  `FIREBASE_SDK` absent.
- `entities/user-device.entity.ts`, `entities/user-session.entity.ts` — entités DB.
- `dto/auth.dto.ts` — DTOs des routes `/auth/*` (register, login, reset, PIN, Google...).
- `dto/auth.type.dto.ts` — `JwtUserInfo`/`AuthApiRequest`, consommés (import de type
  uniquement, aucune implication DI/module) par `core/middleware` et
  `users/controllers/user.controller.ts`.

### Ce qui n'est PAS dans `auth/`

- L'entité `User` (source de vérité unique : `users/entities/user.entity.ts`).
- `UserService`, `UserController` (dans `users/`).

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

**Règle de dépendance : `users → auth`, jamais l'inverse.** `AuthModule` n'importe jamais
`UsersModule` — il importe uniquement la **classe** `User` (type + décorateur d'entité) pour
son propre `TypeOrmModule.forFeature`. `UsersModule` importe `AuthModule` pour que
`UserService` consomme `SessionService`/`PasswordService` (`softDeleteMe`, `updateStatus`,
`adminResetPassword`, `hardDelete`). Aucun cycle de modules, aucun `forwardRef()`.

`AuthService.findOrCreateGoogleUser` (Google Firebase Auth) est une méthode **privée** de
`AuthService`, avec son propre `Repository<User>` injecté — elle n'appelle pas `UserService`.
C'est la seule logique de type « recherche/création d'utilisateur » dont `auth/` a besoin ;
plutôt que d'exposer une méthode `UserService` dédiée à ce seul appelant, elle est réécrite
localement dans `AuthService`.

## Historique

### 1. État initial du template (avant toute intervention)

Le template « UNIFIED AUTH » avait `User` dupliqué : une copie complète dans `auth/`
(`entities/user.entity.ts`, `services/user.service.ts`, `controllers/user.controller.ts`,
`dto/user.dto.ts`) **et** une copie dans `users/`. Deux classes `@Entity('users')`
coexistaient → collision de métadonnées TypeORM à l'auto-chargement. `SessionService`/
`OtpService`/`PasswordService` + `UserDevice`/`UserSession` étaient déjà dans `auth/` à ce
stade. `UsersModule` était un `@Module({})` vide. Des références obsolètes
(`UserRole.engineer/agent`, `ApiClientType.manager`, hérités du template générique avant
l'adaptation aux rôles métier DiaspoVote) cassaient la compilation.

### 2. Étape intermédiaire — Session/Otp/Password déplacés vers `users/`

Le doublon `User` a été nettoyé (suppression dans `auth/`, `users/` fait foi). Dans un premier
temps, `SessionService`/`OtpService`/`PasswordService` + `UserDevice`/`UserSession` ont été
déplacés dans `users/`, avec `AuthModule → UsersModule` (`auth → users`). `election/` et
`oversight/` ont été construits par-dessus cette base — sans en dépendre directement, puisqu'ils
ne référencent `users/` que par id (colonnes `userId`...), donc non affectés par le changement
de direction qui suit.

### 3. Retour en arrière définitif — décision finale sur le placement

**Décision explicite : `SessionService`/`OtpService`/`PasswordService` + `UserDevice`/
`UserSession` reviennent dans `auth/`.** Pour éviter de recréer le cycle `auth ↔ users`
(`UserService` a besoin de `SessionService`/`PasswordService`), la dépendance de module est
**inversée** plutôt que résolue par `forwardRef()` :

- `UsersModule` importe `AuthModule` (et non l'inverse).
- `AuthModule` s'enregistre lui-même dans `TypeOrmModule.forFeature([User, UserDevice,
  UserSession])` en import**ant** la classe `User` de `users/entities/` — un import de
  type/décorateur, pas un import du module `UsersModule`.
- `CLAUDE.md` mis à jour : la règle générale est **`users → auth`**, remplaçant la version
  intermédiaire `auth → users` du point 2.

**Cette version fait foi.** Ne pas la ré-inverser sans discussion explicite — le placement de
ces services a déjà changé de sens deux fois.

## Points d'attention pour la suite

- **Ne pas réintroduire de dépendance `auth → users`.** Si `auth/` a besoin d'une opération
  déjà présente sur `UserService`, ne pas importer `UsersModule` dans `AuthModule` — réécrire
  la logique localement (comme `findOrCreateGoogleUser`) ou remonter le besoin commun dans
  `shared/`/`utils/`.
- `pinCode` est une colonne typée sur `User` (`string | null`) — les anciens casts `as any`
  dans `PasswordService` ont disparu, ne pas les réintroduire.
- `UserRole.user` a été renommé `UserRole.voter` (suit le diagramme de classe DiaspoVote) —
  toute référence à `UserRole.user` dans du code ou de la doc plus ancienne est obsolète.
- `mail/` et `utils/` ne doivent dépendre d'aucune entité métier (`User` inclus) — cf. règle
  générale dans `CLAUDE.md` (`MailRecipient`/`JwtPayloadUser` comme interfaces structurelles
  locales plutôt qu'un import direct de `User`). Si un changement dans `auth/` ajoute un appel
  à `mail/` ou `utils/api-util.ts`, passer par ces interfaces plutôt que par le type `User`.
