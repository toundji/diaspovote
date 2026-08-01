// ============================================================
// candidacy.dto.ts
// DTOs des routes /candidacies/*.
// ============================================================
import { IsString, IsOptional, IsUUID, IsNotEmpty, IsUrl } from 'class-validator';
import { Candidacy } from '../entities/candidacy.entity';

export class CreateCandidacyDto {
    @IsUUID()
    @IsNotEmpty()
    electionId!: string;

    @IsString()
    @IsNotEmpty()
    position!: string;

    @IsUrl({}, { message: "L'URL de la photo est invalide." })
    @IsOptional()
    photoUrl?: string;
}

/**
 * Création par un admin/commission depuis le back-office, pour un utilisateur
 * qui n'est pas l'appelant (ex: candidat sans accès à l'appli). Purement
 * additive : ne remplace pas `submit()` (candidat authentifié sur soi-même),
 * délègue à la même logique via `CandidacyService.submit(dto.userId, dto)`.
 */
export class CreateCandidacyAdminDto extends CreateCandidacyDto {
    @IsUUID()
    @IsNotEmpty()
    userId!: string;
}

export class UpdateCandidacyDto {
    @IsString()
    @IsOptional()
    position?: string;

    @IsUrl({}, { message: "L'URL de la photo est invalide." })
    @IsOptional()
    photoUrl?: string;
}

export interface ListCandidaciesQuery {
    page?: number;
    limit?: number;
    electionId?: string;
    userId?: string;
    /** pending = ni approuvée ni rejetée */
    status?: 'pending' | 'approved' | 'rejected';
}

export interface PaginatedCandidacies {
    data: Candidacy[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
