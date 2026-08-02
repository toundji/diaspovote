// ============================================================
// campaign-post.service.ts
// Publications de campagne d'un candidat — relation 1-N avec Candidacy.
// Brouillon (publishedAt null) → publish() les rend visibles publiquement.
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';

import { CampaignPost } from '../entities/campaign-post.entity';
import { Candidacy } from '../entities/candidacy.entity';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import {
    CreateCampaignPostDto, ListAllCampaignPostsQuery, ListCampaignPostsQuery,
    PaginatedCampaignPosts, UpdateCampaignPostDto,
} from '../dto/campaign-post.dto';

@Injectable()
export class CampaignPostService {
    constructor(
        @InjectRepository(CampaignPost) private readonly postRepo: Repository<CampaignPost>,
        @InjectRepository(Candidacy) private readonly candidacyRepo: Repository<Candidacy>,
    ) { }

    // ── Création (candidat, sur sa propre candidature) ────────

    async create(candidacyId: string, userId: string, dto: CreateCampaignPostDto): Promise<CampaignPost> {
        await this.assertOwnCandidacy(candidacyId, userId);

        const post = this.postRepo.create({
            candidacyId,
            title: dto.title,
            content: dto.content,
            mediaUrl: dto.mediaUrl,
        });
        return this.postRepo.save(post);
    }

    // ── Lecture ───────────────────────────────────────────────

    async getById(candidacyId: string, id: string): Promise<CampaignPost> {
        const post = await this.postRepo.findOne({ where: { id, candidacyId } });
        if (!post) throw new ApiErrorNotFoundById('campaign_posts', id);
        return post;
    }

    /**
     * `includeUnpublished` n'est honoré que si l'appelant est le propriétaire
     * de la candidature — vérifié par le controller avant l'appel.
     */
    async list(candidacyId: string, query: ListCampaignPostsQuery): Promise<PaginatedCampaignPosts> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where = query.includeUnpublished
            ? { candidacyId }
            : { candidacyId, publishedAt: Not(IsNull()) };

        const [data, total] = await this.postRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { publishedAt: 'DESC', createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Fil d'actualités global — publications publiées, toutes candidatures
     * confondues, restreint aux candidatures approuvées (une candidature en
     * attente ou rejetée n'a pas de visibilité publique, même si son
     * titulaire a publié un post). Filtrable par élection.
     */
    async listAll(query: ListAllCampaignPostsQuery): Promise<PaginatedCampaignPosts> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        let qb = this.postRepo
            .createQueryBuilder('post')
            .innerJoin(Candidacy, 'candidacy', 'candidacy.id = post.candidacyId')
            .where('post.publishedAt IS NOT NULL')
            .andWhere('candidacy.approvedAt IS NOT NULL')
            .andWhere('candidacy.rejectedAt IS NULL')
            .orderBy('post.publishedAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (query.electionId) {
            qb = qb.andWhere('candidacy.electionId = :electionId', { electionId: query.electionId });
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Mise à jour / publication / suppression (propriétaire) ─

    async update(candidacyId: string, id: string, userId: string, dto: UpdateCampaignPostDto): Promise<CampaignPost> {
        await this.assertOwnCandidacy(candidacyId, userId);
        const post = await this.getById(candidacyId, id);

        Object.assign(post, {
            title: dto.title ?? post.title,
            content: dto.content ?? post.content,
            mediaUrl: dto.mediaUrl ?? post.mediaUrl,
        });
        return this.postRepo.save(post);
    }

    async publish(candidacyId: string, id: string, userId: string): Promise<CampaignPost> {
        await this.assertOwnCandidacy(candidacyId, userId);
        const post = await this.getById(candidacyId, id);

        if (!post.publishedAt) {
            post.publishedAt = new Date();
            await this.postRepo.save(post);
        }
        return post;
    }

    async remove(candidacyId: string, id: string, userId: string): Promise<{ success: boolean }> {
        await this.assertOwnCandidacy(candidacyId, userId);
        await this.getById(candidacyId, id);

        await this.postRepo.softDelete(id);
        return { success: true };
    }

    // ── Helpers ───────────────────────────────────────────────

    private async assertOwnCandidacy(candidacyId: string, userId: string): Promise<void> {
        const candidacy = await this.candidacyRepo.findOne({ where: { id: candidacyId } });
        if (!candidacy) throw new ApiErrorNotFoundById('candidacies', candidacyId);
        if (candidacy.userId !== userId) {
            throw new ApiError('Cette candidature ne vous appartient pas.', { code: HttpStatus.FORBIDDEN });
        }
    }
}
