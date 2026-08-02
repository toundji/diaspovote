// ============================================================
// sponsor.dto.ts
// DTOs des routes /sponsors/*.
// amount/currency : les deux sont fournis ensemble ou aucun des deux
// (ValidateIf croisé), jamais via le formulaire public.
// ============================================================
import {
    IsString, IsOptional, IsBoolean, IsNotEmpty,
    IsEmail, IsNumber, IsPositive, IsUrl, Length, ValidateIf,
} from 'class-validator';
import { Sponsor } from '../entities/sponsor.entity';

/** Formulaire public "Devenir sponsor" — aucun compte requis. */
export class CreateSponsorDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsEmail({}, { message: "L'email est invalide." })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    message?: string;
}

/**
 * Création directe par l'admin/commission depuis le back-office —
 * additif au formulaire public ci-dessus, auto-approuvée (pas de second
 * regard nécessaire sur son propre enregistrement).
 */
export class CreateSponsorAdminDto extends CreateSponsorDto {
    @ValidateIf((o: CreateSponsorAdminDto) => o.currency !== undefined || o.amount !== undefined)
    @IsNumber()
    @IsPositive()
    amount?: number;

    @ValidateIf((o: CreateSponsorAdminDto) => o.amount !== undefined || o.currency !== undefined)
    @IsString()
    @Length(3, 3, { message: 'La devise doit être un code ISO 4217 à 3 lettres (ex: XOF, EUR).' })
    currency?: string;

    @IsUrl({}, { message: "L'URL du site est invalide." })
    @IsOptional()
    websiteUrl?: string;
}

export class UpdateSponsorDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail({}, { message: "L'email est invalide." })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    message?: string;

    @ValidateIf((o: UpdateSponsorDto) => o.currency !== undefined || o.amount !== undefined)
    @IsNumber()
    @IsPositive()
    amount?: number;

    @ValidateIf((o: UpdateSponsorDto) => o.amount !== undefined || o.currency !== undefined)
    @IsString()
    @Length(3, 3, { message: 'La devise doit être un code ISO 4217 à 3 lettres (ex: XOF, EUR).' })
    currency?: string;

    @IsUrl({}, { message: "L'URL du site est invalide." })
    @IsOptional()
    websiteUrl?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export interface ListSponsorsQuery {
    page?: number;
    limit?: number;
    /** pending = ni approuvé ni rejeté */
    status?: 'pending' | 'approved' | 'rejected';
}

export interface PaginatedSponsors {
    data: Sponsor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Projection publique — jamais email/phone/message (contact du sponsor). */
export interface PublicSponsor {
    id: string;
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
}
