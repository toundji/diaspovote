// ============================================================
// question.service.ts
// Un citoyen pose une question publique à un candidat, qui y répond.
// La modération (hide) est réservée à admin/commission.
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';

import { Question } from '../entities/question.entity';
import { CandidacyService } from 'src/election/services/candidacy.service';
import { AuditLogService } from './audit-log.service';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { AnswerQuestionDto, CreateQuestionDto, ListQuestionsQuery, PaginatedQuestions } from '../dto/question.dto';

@Injectable()
export class QuestionService {
    constructor(
        @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
        private readonly candidacyService: CandidacyService,
        private readonly auditLogService: AuditLogService,
    ) { }

    // ── Poser une question ────────────────────────────────────

    async create(candidacyId: string, authorId: string, dto: CreateQuestionDto): Promise<Question> {
        // Vérifie que la candidature existe (lève ApiErrorNotFoundById sinon).
        await this.candidacyService.getById(candidacyId);

        const question = this.questionRepo.create({
            candidacyId,
            authorId,
            content: dto.content,
        });
        return this.questionRepo.save(question);
    }

    // ── Lecture ───────────────────────────────────────────────

    async getById(candidacyId: string, id: string): Promise<Question> {
        const question = await this.questionRepo.findOne({ where: { id, candidacyId } });
        if (!question) throw new ApiErrorNotFoundById('questions', id);
        return question;
    }

    /**
     * `includeHidden` n'est honoré que si l'appelant est le candidat
     * ou un admin/commission — vérifié par le controller avant l'appel.
     */
    async list(candidacyId: string, query: ListQuestionsQuery): Promise<PaginatedQuestions> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<Question> = query.includeHidden
            ? { candidacyId }
            : { candidacyId, hiddenAt: IsNull() };

        const [data, total] = await this.questionRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Répondre (candidat propriétaire) ──────────────────────

    async answer(candidacyId: string, id: string, userId: string, dto: AnswerQuestionDto): Promise<Question> {
        const candidacy = await this.candidacyService.getById(candidacyId);
        if (candidacy.userId !== userId) {
            throw new ApiError('Cette candidature ne vous appartient pas.', { code: HttpStatus.FORBIDDEN });
        }

        const question = await this.getById(candidacyId, id);
        question.answer = dto.answer;
        question.answeredAt = new Date();
        return this.questionRepo.save(question);
    }

    // ── Modération (admin / commission) ───────────────────────

    async hide(candidacyId: string, id: string, moderatorId: string): Promise<Question> {
        const question = await this.getById(candidacyId, id);
        if (!question.hiddenAt) {
            question.hiddenAt = new Date();
            await this.questionRepo.save(question);
            await this.auditLogService.record(moderatorId, 'question.hide', 'question', id);
        }
        return question;
    }
}
