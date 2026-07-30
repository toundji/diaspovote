// ============================================================
// action-category.dto.ts
// DTOs des routes /action-categories/*.
// ============================================================
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateActionCategoryDto {
    @IsString()
    @IsNotEmpty()
    label!: string;
}

export class UpdateActionCategoryDto {
    @IsString()
    @IsOptional()
    label?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export interface ListActionCategoriesQuery {
    includeInactive?: boolean;
}
