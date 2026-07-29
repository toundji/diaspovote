// ============================================================
// jurisdiction.dto.ts
// DTOs des routes /jurisdictions/*.
// ============================================================
import { IsString, IsOptional, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { JurisdictionType } from 'src/shared/election.enum';

export class CreateJurisdictionDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsEnum(JurisdictionType, { message: 'Type de périmètre invalide.' })
    type!: JurisdictionType;

    /** Parent (ex: la fédération d'un état). Null pour la racine. */
    @IsUUID()
    @IsOptional()
    parentId?: string;
}

export class UpdateJurisdictionDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsUUID()
    @IsOptional()
    parentId?: string;
}

export interface ListJurisdictionsQuery {
    type?: JurisdictionType;
    parentId?: string;
}
