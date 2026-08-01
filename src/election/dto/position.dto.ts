// ============================================================
// position.dto.ts
// DTOs des routes /positions/*.
// ============================================================
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    label!: string;
}

export class UpdatePositionDto {
    @IsString()
    @IsOptional()
    label?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export interface ListPositionsQuery {
    includeInactive?: boolean;
}
