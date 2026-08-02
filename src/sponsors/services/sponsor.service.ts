// ============================================================
// sponsor.service.ts
// Sponsors du portail : soumission publique (sans compte) ou création
// directe par l'admin (auto-approuvée), revue admin/commission,
// upload du logo, visibilité contrôlée par isActive.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';

import { Sponsor } from '../entities/sponsor.entity';
import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { ApiFsUtils } from 'src/utils/api-fs';
import { ImageDto } from 'src/shared/media.dto';
import {
    CreateSponsorAdminDto, CreateSponsorDto, ListSponsorsQuery,
    PaginatedSponsors, PublicSponsor, UpdateSponsorDto,
} from '../dto/sponsor.dto';

@Injectable()
export class SponsorService {
    constructor(
        @InjectRepository(Sponsor) private readonly sponsorRepo: Repository<Sponsor>,
    ) { }

    // ── Soumission ────────────────────────────────────────────

    async submit(dto: CreateSponsorDto): Promise<Sponsor> {
        const sponsor = this.sponsorRepo.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            message: dto.message,
        });
        return this.sponsorRepo.save(sponsor);
    }

    /** Additif au formulaire public — auto-approuvée (l'admin est déjà l'autorité). */
    async submitByAdmin(adminId: string, dto: CreateSponsorAdminDto): Promise<Sponsor> {
        const sponsor = this.sponsorRepo.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            message: dto.message,
            amount: dto.amount !== undefined ? dto.amount.toFixed(2) : undefined,
            currency: dto.currency?.toUpperCase(),
            websiteUrl: dto.websiteUrl,
            approvedAt: new Date(),
            reviewedById: adminId,
        });
        return this.sponsorRepo.save(sponsor);
    }

    // ── Lecture ───────────────────────────────────────────────

    /** Accueil public — uniquement approuvés + actifs, jamais email/phone/message. */
    async listPublic(): Promise<PublicSponsor[]> {
        return this.sponsorRepo.find({
            where: { approvedAt: Not(IsNull()), isActive: true },
            select: { id: true, name: true, logoUrl: true, websiteUrl: true },
            order: { createdAt: 'DESC' },
        });
    }

    async listAdmin(query: ListSponsorsQuery): Promise<PaginatedSponsors> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<Sponsor> = {};
        if (query.status === 'pending') {
            where.approvedAt = IsNull();
            where.rejectedAt = IsNull();
        } else if (query.status === 'approved') {
            where.approvedAt = Not(IsNull());
        } else if (query.status === 'rejected') {
            where.rejectedAt = Not(IsNull());
        }

        const [data, total] = await this.sponsorRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getById(id: string): Promise<Sponsor> {
        const sponsor = await this.sponsorRepo.findOne({ where: { id } });
        if (!sponsor) throw new ApiErrorNotFoundById('sponsors', id);
        return sponsor;
    }

    // ── Mise à jour (admin) ────────────────────────────────────

    async update(id: string, dto: UpdateSponsorDto): Promise<Sponsor> {
        const sponsor = await this.getById(id);
        Object.assign(sponsor, {
            name: dto.name ?? sponsor.name,
            email: dto.email ?? sponsor.email,
            phone: dto.phone ?? sponsor.phone,
            message: dto.message ?? sponsor.message,
            websiteUrl: dto.websiteUrl ?? sponsor.websiteUrl,
            isActive: dto.isActive ?? sponsor.isActive,
        });

        if (dto.amount !== undefined) {
            sponsor.amount = dto.amount.toFixed(2);
            sponsor.currency = dto.currency!.toUpperCase();
        }

        return this.sponsorRepo.save(sponsor);
    }

    async uploadLogo(id: string, body: ImageDto): Promise<Sponsor> {
        const sponsor = await this.getById(id);
        const image = body.image;
        if (!image) throw new ApiError('Le logo est requis.');

        const dir = ApiFsUtils.createDir('sponsors');
        const key = `${Date.now()}${Math.ceil(Math.random() * 100)}`;
        let path = `${dir}/logo_${key}.${image['fileType']['ext']}`;
        ApiFsUtils.saveFile(image.path, path);
        path = `${process.env.API_ADDRESS}/${path}`;
        sponsor.logoUrl = ApiFsUtils.pathToUrl(path);

        return this.sponsorRepo.save(sponsor);
    }

    // ── Revue (commission / admin, back-office) ───────────────

    async approve(id: string, reviewerId: string): Promise<Sponsor> {
        const sponsor = await this.getById(id);
        this.assertPending(sponsor);

        sponsor.approvedAt = new Date();
        sponsor.reviewedById = reviewerId;
        return this.sponsorRepo.save(sponsor);
    }

    async reject(id: string, reviewerId: string): Promise<Sponsor> {
        const sponsor = await this.getById(id);
        this.assertPending(sponsor);

        sponsor.rejectedAt = new Date();
        sponsor.reviewedById = reviewerId;
        return this.sponsorRepo.save(sponsor);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        await this.getById(id);
        await this.sponsorRepo.softDelete(id);
        return { success: true };
    }

    // ── Helpers ───────────────────────────────────────────────

    private assertPending(sponsor: Sponsor): void {
        if (sponsor.approvedAt || sponsor.rejectedAt) {
            throw new ApiError('Cette demande a déjà été traitée.');
        }
    }
}
