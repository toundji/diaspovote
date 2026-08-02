// ============================================================
// position.dto.ts
// DTOs des routes /positions/*.
// feeAmount/feeCurrency : les deux sont fournis ensemble ou aucun des
// deux (ValidateIf croisé) — un poste sans frais est gratuit.
// ============================================================
import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsNumber, IsPositive, Length, ValidateIf } from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @IsNotEmpty()
    label!: string;

    @ValidateIf((o: CreatePositionDto) => o.feeCurrency !== undefined || o.feeAmount !== undefined)
    @IsNumber()
    @IsPositive()
    feeAmount?: number;

    @ValidateIf((o: CreatePositionDto) => o.feeAmount !== undefined || o.feeCurrency !== undefined)
    @IsString()
    @Length(3, 3, { message: 'La devise doit être un code ISO 4217 à 3 lettres (ex: XOF, EUR).' })
    feeCurrency?: string;
}

export class UpdatePositionDto {
    @IsString()
    @IsOptional()
    label?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ValidateIf((o: UpdatePositionDto) => o.feeCurrency !== undefined || o.feeAmount !== undefined)
    @IsNumber()
    @IsPositive()
    feeAmount?: number;

    @ValidateIf((o: UpdatePositionDto) => o.feeAmount !== undefined || o.feeCurrency !== undefined)
    @IsString()
    @Length(3, 3, { message: 'La devise doit être un code ISO 4217 à 3 lettres (ex: XOF, EUR).' })
    feeCurrency?: string;

    /** Repasse le poste en gratuit (efface feeAmount/feeCurrency). Ignoré si feeAmount est fourni. */
    @IsBoolean()
    @IsOptional()
    clearFee?: boolean;
}

export interface ListPositionsQuery {
    includeInactive?: boolean;
}
