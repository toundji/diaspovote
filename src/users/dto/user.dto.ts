// ============================================================
// UNIFIED AUTH — user.dto.ts
// DTOs des routes /users/*.
// ============================================================

import {
    IsString, IsOptional, IsEnum, IsEmail,
    IsArray, IsUrl, MinLength, IsNotEmpty,
} from 'class-validator';
import { User } from '../entities/user.entity';
import { UserStatus, UserRole } from 'src/shared/common.enum';

// ── Profil personnel ──────────────────────────────────────────

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsUrl({}, { message: "L'URL de l'avatar est invalide." })
    @IsOptional()
    profile?: string;
}

// ── Admin ─────────────────────────────────────────────────────

export class AdminCreateUserDto {
    @IsEmail({}, { message: 'Email invalide.' })
    email!: string;

    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
    password!: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    /** URL directe (choix "coller une URL"). Pour un upload de fichier, voir POST /users/:id/profile/image après création. */
    @IsUrl({}, { message: "L'URL de l'avatar est invalide." })
    @IsOptional()
    profile?: string;

    /** Défaut : [voter] si omis. */
    @IsArray()
    @IsEnum(UserRole, { each: true, message: 'Un ou plusieurs rôles sont invalides.' })
    @IsOptional()
    roles?: UserRole[];

    /** Défaut : active — un compte créé par un admin n'a pas besoin de re-vérifier son email. */
    @IsEnum(UserStatus, { message: 'Statut invalide.' })
    @IsOptional()
    status?: UserStatus;
}

export class AdminResetPasswordDto {
    /** userId ou email */
    @IsString()
    @IsNotEmpty()
    userIdOrEmail!: string;

    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
    newPassword!: string;
}

export class AdminUpdateStatusDto {
    @IsEnum(UserStatus, { message: 'Statut invalide.' })
    status!: UserStatus;
}

export class AdminUpdateRolesDto {
    @IsArray()
    @IsEnum(UserRole, { each: true, message: 'Un ou plusieurs rôles sont invalides.' })
    roles!: UserRole[];
}

// ── Pagination / filtres ──────────────────────────────────────

export interface ListUsersQuery {
    /** Numéro de page, commence à 1 (défaut: 1) */
    page?: number;
    /** Nombre d'éléments par page (défaut: 20, max: 100) */
    limit?: number;
    /** Filtrer par statut */
    status?: UserStatus;
    /** Filtrer par rôle */
    role?: UserRole;
    /** Recherche libre sur email, firstName, lastName */
    search?: string;
}

export interface PaginatedUsers {
    data: Partial<User>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}