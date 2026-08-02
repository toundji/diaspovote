// ============================================================
// university.dto.ts
// DTOs des routes /universities/*.
// ============================================================
import { IsString, IsOptional, IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';

export class CreateUniversityDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    city!: string;

    @IsUUID()
    @IsOptional()
    jurisdictionId?: string;
}

export class UpdateUniversityDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsUUID()
    @IsOptional()
    jurisdictionId?: string;

    /** Détache l'université de son périmètre géographique. Ignoré si jurisdictionId est fourni. */
    @IsBoolean()
    @IsOptional()
    clearJurisdiction?: boolean;
}

export interface ListUniversitiesQuery {
    jurisdictionId?: string;
}
