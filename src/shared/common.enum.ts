// ============================================================
// common.enum.ts
// Enums d'infrastructure / authentification (fournis par le template).
// ⚠️ SEUL changement projet : les valeurs de UserRole ci-dessous.
// ============================================================

/**
 * Rôles applicatifs. Colonne MySQL de type SET → un utilisateur
 * peut cumuler plusieurs rôles (ex: [user, commission]).
 */
export enum UserRole {
    user = 'user',
    candidate = 'candidate',
    admin = 'admin',
    commission = 'commission',
}

export enum UserStatus {
    active = 'active',
    unverified = 'unverified',
    disabled = 'disabled',
    blocked = 'blocked',
    deleted = 'deleted',
}

export enum ApiClientType {
    web = 'web',
    back_office = 'back_office',
    swagger = 'swagger',
}

export enum TokenType {
    access = 'access',
    refresh = 'refresh',
}

export enum DeviceType {
    mobile = 'mobile',
    desktop = 'desktop',
    tablet = 'tablet',
    unknown = 'unknown',
}

export enum AbilityEnum {
    create = 'create',
    edit = 'edit',
    view = 'view',
    owner = 'owner',
    list = 'list',
    delete = 'delete',
}

export enum FileStatus {
    using = 'using',
    deleted = 'deleted',
    unused = 'unused',
}
