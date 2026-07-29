// ============================================================
// election.service.ts
// Logique métier des élections : CRUD + cycle de vie.
// Les transitions d'état (draft→active→closed) sont les invariants
// critiques : elles sont toutes validées ici, jamais dans le controller.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { Election } from '../entities/election.entity';
import { Jurisdiction } from '../entities/jurisdiction.entity';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateElectionDto, ListElectionsQuery, PaginatedElections, UpdateElectionDto } from '../dto/election.dto';
import { ElectionStatus } from '../entities/election.enum';

@Injectable()
export class ElectionService {
    constructor(
        @InjectRepository(Election) private readonly electionRepo: Repository<Election>,
        @InjectRepository(Jurisdiction) private readonly jurisdictionRepo: Repository<Jurisdiction>,
    ) { }

    // ── Création ──────────────────────────────────────────────

    async create(dto: CreateElectionDto): Promise<Election> {
        const jurisdiction = await this.jurisdictionRepo.findOne({ where: { id: dto.jurisdictionId } });
        if (!jurisdiction) throw new ApiErrorNotFoundById('jurisdictions', dto.jurisdictionId);

        // Unicité (year, jurisdiction) — vérif applicative en plus de la contrainte DB
        const exists = await this.electionRepo.findOne({
            where: { year: dto.year, jurisdictionId: dto.jurisdictionId },
        });
        if (exists) {
            throw new ApiError(`Une élection existe déjà pour ${jurisdiction.name} en ${dto.year}.`);
        }

        this.assertWindow(dto.startsAt, dto.endsAt);

        const election = this.electionRepo.create({
            jurisdictionId: dto.jurisdictionId,
            year: dto.year,
            title: dto.title,
            description: dto.description,
            startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
            endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
            status: ElectionStatus.draft,
        });
        return this.electionRepo.save(election);
    }

    // ── Lecture ───────────────────────────────────────────────

    async getById(id: string): Promise<Election> {
        const election = await this.electionRepo.findOne({ where: { id } });
        if (!election) throw new ApiErrorNotFoundById('elections', id);
        return election;
    }

    async list(query: ListElectionsQuery): Promise<PaginatedElections> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<Election> = {};
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId;
        if (query.year) where.year = query.year;
        if (query.status) where.status = query.status;

        const [data, total] = await this.electionRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { year: 'DESC', createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ── Mise à jour (uniquement en draft) ─────────────────────

    async update(id: string, dto: UpdateElectionDto): Promise<Election> {
        const election = await this.getById(id);
        if (election.status !== ElectionStatus.draft) {
            throw new ApiError('Seule une élection en brouillon peut être modifiée.');
        }

        const startsAt = dto.startsAt ? new Date(dto.startsAt) : election.startsAt;
        const endsAt = dto.endsAt ? new Date(dto.endsAt) : election.endsAt;
        this.assertWindow(startsAt, endsAt);

        Object.assign(election, {
            title: dto.title ?? election.title,
            description: dto.description ?? election.description,
            startsAt,
            endsAt,
        });
        return this.electionRepo.save(election);
    }

    // ── Transitions de cycle de vie ───────────────────────────

    /** draft → active. Exige une fenêtre de vote valide. */
    async activate(id: string): Promise<Election> {
        const election = await this.getById(id);
        if (election.status !== ElectionStatus.draft) {
            throw new ApiError('Seule une élection en brouillon peut être activée.');
        }
        if (!election.startsAt || !election.endsAt) {
            throw new ApiError('Définissez la fenêtre de vote (startsAt / endsAt) avant activation.');
        }
        this.assertWindow(election.startsAt, election.endsAt);
        // NB (bloc suivant) : vérifier ici qu'il y a >= 2 candidatures approuvées
        // et que la liste électorale n'est pas vide, une fois ces modules branchés.

        election.status = ElectionStatus.active;
        return this.electionRepo.save(election);
    }

    /** active → closed. */
    async close(id: string): Promise<Election> {
        const election = await this.getById(id);
        if (election.status !== ElectionStatus.active) {
            throw new ApiError('Seule une élection active peut être clôturée.');
        }
        election.status = ElectionStatus.closed;
        return this.electionRepo.save(election);
    }

    /** Publier les résultats — uniquement après clôture. */
    async publishResults(id: string): Promise<Election> {
        const election = await this.getById(id);
        if (election.status !== ElectionStatus.closed) {
            throw new ApiError('Les résultats ne peuvent être publiés qu\'après clôture.');
        }
        election.resultsPublished = true;
        return this.electionRepo.save(election);
    }

    // ── Suppression (uniquement en draft) ─────────────────────

    async remove(id: string): Promise<{ success: boolean }> {
        const election = await this.getById(id);
        if (election.status !== ElectionStatus.draft) {
            throw new ApiError('Seule une élection en brouillon peut être supprimée.');
        }
        await this.electionRepo.softDelete(id);
        return { success: true };
    }

    // ── Helpers ───────────────────────────────────────────────

    private assertWindow(startsAt?: Date | string, endsAt?: Date | string) {
        if (!startsAt || !endsAt) return;
        const start = new Date(startsAt).getTime();
        const end = new Date(endsAt).getTime();
        if (end <= start) {
            throw new ApiError('La fermeture du vote doit être postérieure à l\'ouverture.');
        }
    }
}
