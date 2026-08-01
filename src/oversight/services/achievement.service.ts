// ============================================================
// achievement.service.ts
// Réalisation vérifiée publiée par un candidat (redevabilité).
// Dépend de CandidacyService (election/, exportée) pour vérifier la
// propriété de la candidature — pas d'entité/relation TypeORM
// croisée, juste un appel à l'API publique du module election/.
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';

import { Achievement } from '../entities/achievement.entity';
import { CandidacyService } from 'src/election/services/candidacy.service';
import { ActionCategoryService } from './action-category.service';
import { AuditLogService } from './audit-log.service';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateAchievementDto, ListAchievementsQuery, PaginatedAchievements, UpdateAchievementDto } from '../dto/achievement.dto';

@Injectable()
export class AchievementService {
    constructor(
        @InjectRepository(Achievement) private readonly achievementRepo: Repository<Achievement>,
        private readonly candidacyService: CandidacyService,
        private readonly categoryService: ActionCategoryService,
        private readonly auditLogService: AuditLogService,
    ) { }

    // ── Publication ────────────────────────────────────────────

    async create(candidacyId: string, userId: string, dto: CreateAchievementDto): Promise<Achievement> {
        const candidacy = await this.candidacyService.getById(candidacyId);
        this.assertOwner(candidacy.userId, userId);
        if (!candidacy.approvedAt || candidacy.rejectedAt) {
            throw new ApiError('Seul un candidat approuvé peut publier une réalisation vérifiée.');
        }

        const category = await this.categoryService.getById(dto.categoryId);
        if (!category.isActive) {
            throw new ApiError('Cette catégorie de réalisation n\'est plus active.');
        }

        const achievement = this.achievementRepo.create({
            candidacyId,
            categoryId: dto.categoryId,
            title: dto.title,
            description: dto.description,
            proofUrl: dto.proofUrl,
            proofSnapshot: dto.proofSnapshot,
        });
        return this.achievementRepo.save(achievement);
    }

    // ── Lecture ───────────────────────────────────────────────

    async getById(id: string): Promise<Achievement> {
        const achievement = await this.achievementRepo.findOne({ where: { id } });
        if (!achievement) throw new ApiErrorNotFoundById('achievements', id);
        return achievement;
    }

    async list(candidacyId: string, query: ListAchievementsQuery): Promise<PaginatedAchievements> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<Achievement> = { candidacyId };
        if (query.categoryId) where.categoryId = query.categoryId;

        if (query.status === 'pending') {
            where.approvedAt = IsNull();
            where.rejectedAt = IsNull();
        } else if (query.status === 'approved') {
            where.approvedAt = Not(IsNull());
        } else if (query.status === 'rejected') {
            where.rejectedAt = Not(IsNull());
        }

        const [data, total] = await this.achievementRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Mise à jour / retrait (propriétaire, uniquement en attente) ─

    async update(id: string, userId: string, dto: UpdateAchievementDto): Promise<Achievement> {
        const achievement = await this.getById(id);
        await this.assertOwnCandidacy(achievement.candidacyId, userId);
        this.assertPending(achievement);

        Object.assign(achievement, {
            title: dto.title ?? achievement.title,
            description: dto.description ?? achievement.description,
            proofUrl: dto.proofUrl ?? achievement.proofUrl,
            proofSnapshot: dto.proofSnapshot ?? achievement.proofSnapshot,
        });
        return this.achievementRepo.save(achievement);
    }

    async withdraw(id: string, userId: string): Promise<{ success: boolean }> {
        const achievement = await this.getById(id);
        await this.assertOwnCandidacy(achievement.candidacyId, userId);
        this.assertPending(achievement);

        await this.achievementRepo.softDelete(id);
        return { success: true };
    }

    // ── Revue (commission / admin) ────────────────────────────

    async approve(id: string, reviewerId: string): Promise<Achievement> {
        const achievement = await this.getById(id);
        this.assertPending(achievement);

        achievement.approvedAt = new Date();
        achievement.reviewedById = reviewerId;
        const saved = await this.achievementRepo.save(achievement);

        await this.auditLogService.record(reviewerId, 'achievement.approve', 'achievement', id);
        return saved;
    }

    async reject(id: string, reviewerId: string): Promise<Achievement> {
        const achievement = await this.getById(id);
        this.assertPending(achievement);

        achievement.rejectedAt = new Date();
        achievement.reviewedById = reviewerId;
        const saved = await this.achievementRepo.save(achievement);

        await this.auditLogService.record(reviewerId, 'achievement.reject', 'achievement', id);
        return saved;
    }

    // ── Helpers ───────────────────────────────────────────────

    private assertOwner(candidacyOwnerId: string, userId: string): void {
        if (candidacyOwnerId !== userId) {
            throw new ApiError('Cette candidature ne vous appartient pas.', { code: HttpStatus.FORBIDDEN });
        }
    }

    private async assertOwnCandidacy(candidacyId: string, userId: string): Promise<void> {
        const candidacy = await this.candidacyService.getById(candidacyId);
        this.assertOwner(candidacy.userId, userId);
    }

    private assertPending(achievement: Achievement): void {
        if (achievement.approvedAt || achievement.rejectedAt) {
            throw new ApiError('Cette réalisation a déjà été traitée.');
        }
    }
}
