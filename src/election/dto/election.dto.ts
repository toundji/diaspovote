// ============================================================
// election.dto.ts
// DTOs des routes /elections/*.
// ============================================================
import {
    IsString, IsOptional, IsInt, IsUUID,
    IsDateString, IsNotEmpty, Min, IsEnum,
} from 'class-validator';
import { Election } from '../entities/election.entity';
import { ElectionStatus } from '../entities/election.enum';

export class CreateElectionDto {
    @IsUUID()
    @IsNotEmpty()
    jurisdictionId!: string;

    @IsInt()
    @Min(2020)
    year!: number;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    /** Ouverture du vote (ISO 8601). Optionnel à la création (draft). */
    @IsDateString()
    @IsOptional()
    startsAt?: string;

    /** Fermeture du vote (ISO 8601). */
    @IsDateString()
    @IsOptional()
    endsAt?: string;
}

export class UpdateElectionDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    @IsOptional()
    startsAt?: string;

    @IsDateString()
    @IsOptional()
    endsAt?: string;
}

export interface ListElectionsQuery {
    page?: number;
    limit?: number;
    jurisdictionId?: string;
    year?: number;
    status?: ElectionStatus;
}

export interface PaginatedElections {
    data: Election[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
