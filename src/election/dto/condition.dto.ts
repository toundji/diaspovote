// ============================================================
// condition.dto.ts
// DTOs des routes /elections/:electionId/conditions/*.
// ============================================================
import {
    IsString, IsOptional, IsEnum,
    IsBoolean, IsInt, IsNotEmpty,
} from 'class-validator';
import { ConditionType } from '../entities/election.enum';

export class CreateConditionDto {
    @IsEnum(ConditionType, { message: 'Type de condition invalide.' })
    type!: ConditionType;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isMandatory?: boolean;

    @IsInt()
    @IsOptional()
    position?: number;
}

export class UpdateConditionDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isMandatory?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsInt()
    @IsOptional()
    position?: number;
}

export interface ListConditionsQuery {
    type?: ConditionType;
    /** Par défaut, seules les conditions actives sont retournées côté public. */
    includeInactive?: boolean;
}
