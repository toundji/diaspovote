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
  `UserService`), délègue à `SessionService`/`OtpService`/`PasswordService`/`NotificationService`
  (importés depuis `users/`).
- `services/notification.service.ts` — FCM (Firebase Admin SDK), désactivé proprement si
  `FIREBASE_SDK` absent.
- `dto/auth.dto.ts` — DTOs des routes `/auth/*` (register, login, reset, PIN, Google...).
- `dto/auth.type.dto.ts` — `JwtUserInfo` (payload JWT désérialisé) et `AuthApiRequest`
  (extension `Request` Express). Restent ici, **pas** dans `shared/`, car seul `auth/`
  (middleware, guards, controllers d'auth) et rien d'autre n'y touche directement — à
  surveiller si `core/middleware` ou un autre module en dehors de `auth/` en a besoin un jour
  (voir « Points d'attention »).

### Ce qui n'est PAS dans `auth/`

- L'entité `User`, `UserDevice`, `UserSession` (dans `users/entities/`).
- `UserService`, `UserController` (dans `users/`).
- `SessionService`, `PasswordService`, `OtpService` (dans `users/services/`) — **décision du
  projet** : ces trois services vivent dans `users/`, pas dans `auth/`, précisément pour éviter
  le cycle `users → auth → users` (`UserService` en a besoin pour `softDeleteMe`,
  `updateStatus`, `adminResetPassword`, `hardDelete`).

### Wiring du module (`auth.module.ts`)

```ts
@Module({
  imports: [
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, NotificationService],
})
```

**Règle de dépendance : `auth → users` uniquement, jamais l'inverse.** `auth/` orchestre
l'authentification contre l'agrégat `users/` ; `users/` ignore l'existence de `auth/`. Aucun
cycle de modules, aucun `forwardRef()`. `UsersModule` exporte `TypeOrmModule` (pour que
`AuthService` puisse injecter `Repository<User>` sans redéclarer son propre
`TypeOrmModule.forFeature`), `UserService`, `SessionService`, `PasswordService`, `OtpService`.

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
`OtpService`/`PasswordService` + `UserDevice`/`UserSession` étaient dans `auth/`. `UsersModule`
était un `@Module({})` vide. Des références obsolètes (`UserRole.engineer/agent`,
`ApiClientType.manager`, hérités du template générique avant l'adaptation aux rôles métier
DiaspoVote) cassaient la compilation.

### 2. Deux tentatives de placement de Session/Otp/Password, résolues indépendamment en parallèle

Le doublon `User` a été nettoyé (suppression dans `auth/`, `users/` fait foi), et le
placement de `SessionService`/`OtpService`/`PasswordService` + `UserDevice`/`UserSession` a
fait l'objet d'**essais successifs dans deux fils de travail distincts** sur ce dépôt, avant
de converger sur l'état actuel :

- Un essai a testé de tout regrouper dans `users/` puis, sur demande explicite, de tout
  ramener dans `auth/` en inversant le sens de dépendance (`users → auth`, `AuthModule`
  s'enregistrant lui-même dans `TypeOrmModule.forFeature([User, ...])` par import de classe).
- En parallèle, un autre fil de travail (PR *"Refactor: Reorganize auth/users modules &
  implement election domain"*) a tranché dans l'autre sens — **celui retenu et documenté
  ci-dessus** : `SessionService`/`OtpService`/`PasswordService` + `UserDevice`/`UserSession`
  dans `users/`, `AuthModule → UsersModule` (jamais l'inverse) — et a construit `election/`
  et `oversight/` par-dessus cette base.

**Décision finale : c'est cette seconde version (`auth → users`) qui fait foi.** Elle est déjà
la fondation de `election/`/`oversight/` ; ne pas la ré-inverser. Si un besoin futur semble
justifier de redéplacer ces services vers `auth/`, en discuter avant toute action — cela
casserait la direction de dépendance sur laquelle tout le domaine métier repose désormais.

## Points d'attention pour la suite

- **Ne pas réintroduire de dépendance `users → auth`.** Si `auth/` a besoin d'une opération
  déjà présente sur `UserService`, la consommer via `UsersModule` (déjà importé) plutôt que
  de dupliquer — sauf cas comme `findOrCreateGoogleUser`, où la logique est simple et propre
  à `auth/`, où une réécriture locale est préférable à l'ajout d'une méthode `UserService`
  dédiée à un seul appelant.
- `pinCode` est utilisé par `PasswordService` (`setupPin`/`checkPin`/`removePin`, dans
  `users/services/`) via des casts `as any` — le champ n'existe pas sur `User` de base, il
  est attendu sur une extension projet de l'entité. Ne pas « corriger » ces casts sans
  ajouter la colonne, ou sans confirmer que le PIN n'est pas utilisé côté web pur.
- `mail/` et `utils/` ne doivent dépendre d'aucune entité métier (`User` inclus) — cf. règle
  générale dans `CLAUDE.md` (`MailRecipient`/`JwtPayloadUser` comme interfaces structurelles
  locales plutôt qu'un import direct de `User`). Si un changement dans `auth/` ajoute un appel
  à `mail/`ou `utils/api-util.ts`, passer par ces interfaces plutôt que par le type `User`.
