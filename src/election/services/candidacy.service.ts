// ============================================================
// candidacy.service.ts
// Candidature : soumission par le candidat + revue par la commission.
// État dérivé (approvedAt/rejectedAt) — jamais de colonne status,
// toutes les transitions sont validées ici.
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull, Not } from 'typeorm';

import { Candidacy } from '../entities/candidacy.entity';
import { Election } from '../entities/election.entity';
import { Position } from '../entities/position.entity';
import { ElectionStatus } from '../entities/election.enum';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateCandidacyDto, ListCandidaciesQuery, PaginatedCandidacies, UpdateCandidacyDto } from '../dto/candidacy.dto';

@Injectable()
export class CandidacyService {
    constructor(
        @InjectRepository(Candidacy) private readonly candidacyRepo: Repository<Candidacy>,
        @InjectRepository(Election) private readonly electionRepo: Repository<Election>,
        @InjectRepository(Position) private readonly positionRepo: Repository<Position>,
    ) { }

    // ── Soumission ────────────────────────────────────────────

    async submit(userId: string, dto: CreateCandidacyDto): Promise<Candidacy> {
        const election = await this.electionRepo.findOne({ where: { id: dto.electionId } });
        if (!election) throw new ApiErrorNotFoundById('elections', dto.electionId);

        if (election.status === ElectionStatus.closed) {
            throw new ApiError('Cette élection est clôturée, aucune candidature ne peut être soumise.');
        }

        await this.assertActivePosition(dto.positionId);

        const exists = await this.candidacyRepo.findOne({
            where: { userId, electionId: dto.electionId },
        });
        if (exists) {
            throw new ApiError('Vous avez déjà une candidature pour cette élection.');
        }

        const candidacy = this.candidacyRepo.create({
            userId,
            electionId: dto.electionId,
            positionId: dto.positionId,
            photoUrl: dto.photoUrl,
        });
        return this.candidacyRepo.save(candidacy);
    }

    // ── Lecture ───────────────────────────────────────────────

    async getById(id: string): Promise<Candidacy> {
        const candidacy = await this.candidacyRepo.findOne({ where: { id } });
        if (!candidacy) throw new ApiErrorNotFoundById('candidacies', id);
        return candidacy;
    }

    async list(query: ListCandidaciesQuery): Promise<PaginatedCandidacies> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<Candidacy> = {};
        if (query.electionId) where.electionId = query.electionId;
        if (query.userId) where.userId = query.userId;

        if (query.status === 'pending') {
            where.approvedAt = IsNull();
            where.rejectedAt = IsNull();
        } else if (query.status === 'approved') {
            where.approvedAt = Not(IsNull());
        } else if (query.status === 'rejected') {
            where.rejectedAt = Not(IsNull());
        }

        const [data, total] = await this.candidacyRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Mise à jour (candidat, uniquement en attente) ─────────

    async update(id: string, userId: string, dto: UpdateCandidacyDto): Promise<Candidacy> {
        const candidacy = await this.getById(id);
        this.assertOwner(candidacy, userId);
        this.assertPending(candidacy);

        if (dto.positionId) await this.assertActivePosition(dto.positionId);

        Object.assign(candidacy, {
            positionId: dto.positionId ?? candidacy.positionId,
            photoUrl: dto.photoUrl ?? candidacy.photoUrl,
        });
        return this.candidacyRepo.save(candidacy);
    }

    // ── Retrait (candidat, uniquement en attente) ─────────────

    async withdraw(id: string, userId: string): Promise<{ success: boolean }> {
        const candidacy = await this.getById(id);
        this.assertOwner(candidacy, userId);
        this.assertPending(candidacy);

        await this.candidacyRepo.softDelete(id);
        return { success: true };
    }

    // ── Revue (commission / admin) ────────────────────────────

    async approve(id: string, reviewerId: string): Promise<Candidacy> {
        const candidacy = await this.getById(id);
        this.assertPending(candidacy);

        candidacy.approvedAt = new Date();
        candidacy.reviewedById = reviewerId;
        return this.candidacyRepo.save(candidacy);
    }

    async reject(id: string, reviewerId: string): Promise<Candidacy> {
        const candidacy = await this.getById(id);
        this.assertPending(candidacy);

        candidacy.rejectedAt = new Date();
        candidacy.reviewedById = reviewerId;
        return this.candidacyRepo.save(candidacy);
    }

    // ── Helpers ───────────────────────────────────────────────

    private assertOwner(candidacy: Candidacy, userId: string): void {
        if (candidacy.userId !== userId) {
            throw new ApiError('Cette candidature ne vous appartient pas.', { code: HttpStatus.FORBIDDEN });
        }
    }

    private assertPending(candidacy: Candidacy): void {
        if (candidacy.approvedAt || candidacy.rejectedAt) {
            throw new ApiError('Cette candidature a déjà été traitée.');
        }
    }

    private async assertActivePosition(positionId: string): Promise<void> {
        const position = await this.positionRepo.findOne({ where: { id: positionId } });
        if (!position) throw new ApiErrorNotFoundById('positions', positionId);
        if (!position.isActive) {
            throw new ApiError('Ce poste n\'est plus disponible.');
        }
    }
}
