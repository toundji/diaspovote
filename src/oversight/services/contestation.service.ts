// ============================================================
// contestation.service.ts
// Un citoyen conteste une réalisation vérifiée (uniquement si elle
// est approuvée — pas de sens à contester une réalisation en attente
// ou déjà rejetée). La commission résout (trace dans AuditLog) ;
// une décision sur l'Achievement lui-même passe par AchievementService.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';

import { Contestation } from '../entities/contestation.entity';
import { Achievement } from '../entities/achievement.entity';
import { AuditLogService } from './audit-log.service';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateContestationDto, ListContestationsQuery, PaginatedContestations } from '../dto/contestation.dto';

@Injectable()
export class ContestationService {
    constructor(
        @InjectRepository(Contestation) private readonly contestationRepo: Repository<Contestation>,
        @InjectRepository(Achievement) private readonly achievementRepo: Repository<Achievement>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async create(achievementId: string, reporterId: string, dto: CreateContestationDto): Promise<Contestation> {
        const achievement = await this.achievementRepo.findOne({ where: { id: achievementId } });
        if (!achievement) throw new ApiErrorNotFoundById('achievements', achievementId);
        if (!achievement.approvedAt) {
            throw new ApiError('Seule une réalisation approuvée peut être contestée.');
        }

        const contestation = this.contestationRepo.create({
            achievementId,
            reporterId,
            reason: dto.reason,
        });
        return this.contestationRepo.save(contestation);
    }

    async getById(id: string): Promise<Contestation> {
        const contestation = await this.contestationRepo.findOne({ where: { id } });
        if (!contestation) throw new ApiErrorNotFoundById('contestations', id);
        return contestation;
    }

    async list(achievementId: string, query: ListContestationsQuery): Promise<PaginatedContestations> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const [data, total] = await this.contestationRepo.findAndCount({
            where: this.buildWhere(achievementId, query.resolved),
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async resolve(id: string, resolverId: string): Promise<Contestation> {
        const contestation = await this.getById(id);
        if (contestation.resolvedAt) {
            throw new ApiError('Cette contestation a déjà été résolue.');
        }

        contestation.resolvedAt = new Date();
        contestation.resolvedById = resolverId;
        const saved = await this.contestationRepo.save(contestation);

        await this.auditLogService.record(resolverId, 'contestation.resolve', 'contestation', id);
        return saved;
    }

    // ── Helpers ───────────────────────────────────────────────

    private buildWhere(achievementId: string, resolved?: boolean) {
        const where: FindOptionsWhere<Contestation> = { achievementId };
        if (resolved === true) where.resolvedAt = Not(IsNull());
        if (resolved === false) where.resolvedAt = IsNull();
        return where;
    }
}
