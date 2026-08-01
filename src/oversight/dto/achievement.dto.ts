// ============================================================
// achievement.dto.ts
// DTOs des routes /candidacies/:candidacyId/achievements/*.
// ============================================================
import { IsString, IsOptional, IsUUID, IsNotEmpty, IsUrl } from 'class-validator';
import { Achievement } from '../entities/achievement.entity';

export class CreateAchievementDto {
    @IsUUID()
    @IsNotEmpty()
    categoryId!: string;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUrl({}, { message: "L'URL de la preuve est invalide." })
    @IsOptional()
    proofUrl?: string;

    @IsString()
    @IsOptional()
    proofSnapshot?: string;
}

export class UpdateAchievementDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUrl({}, { message: "L'URL de la preuve est invalide." })
    @IsOptional()
    proofUrl?: string;

    @IsString()
    @IsOptional()
    proofSnapshot?: string;
}

export interface ListAchievementsQuery {
    page?: number;
    limit?: number;
    categoryId?: string;
    /** pending = ni approuvée ni rejetée */
    status?: 'pending' | 'approved' | 'rejected';
}

export interface PaginatedAchievements {
    data: Achievement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
