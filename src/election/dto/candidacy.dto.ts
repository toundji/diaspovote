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
