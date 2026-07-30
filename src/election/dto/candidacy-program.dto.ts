// ============================================================
// candidacy-program.dto.ts
// DTO de la route /candidacies/:id/program.
// ============================================================
import { IsString, IsNotEmpty } from 'class-validator';

export class UpsertCandidacyProgramDto {
    @IsString()
    @IsNotEmpty()
    content!: string;
}
