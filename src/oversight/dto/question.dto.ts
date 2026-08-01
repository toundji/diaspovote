// ============================================================
// question.dto.ts
// DTOs des routes /candidacies/:candidacyId/questions/*.
// ============================================================
import { IsString, IsNotEmpty } from 'class-validator';
import { Question } from '../entities/question.entity';

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty()
    content!: string;
}

export class AnswerQuestionDto {
    @IsString()
    @IsNotEmpty()
    answer!: string;
}

export interface ListQuestionsQuery {
    page?: number;
    limit?: number;
    /** N'est honoré que si l'appelant est le candidat ou un admin/commission. */
    includeHidden?: boolean;
}

export interface PaginatedQuestions {
    data: Question[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
