// ============================================================
// electoral-roll.service.ts
// Liste électorale d'une élection : inscription, import en masse,
// et statistiques de participation (taux par élection = par année/périmètre).
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ElectoralRoll } from '../entities/electoral-roll.entity';
import { Election } from '../entities/election.entity';
import { Vote } from '../entities/vote.entity';
import { ElectionStatus, JurisdictionType } from '../entities/election.enum';
import { BulkRegisterResult, RollStats } from '../dto/electoral-roll.dto';
import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';

@Injectable()
export class ElectoralRollService {
    constructor(
        @InjectRepository(ElectoralRoll) private readonly rollRepo: Repository<ElectoralRoll>,
        @InjectRepository(Election) private readonly electionRepo: Repository<Election>,
        @InjectRepository(Vote) private readonly voteRepo: Repository<Vote>,
    ) { }

    // ── Inscription unitaire ──────────────────────────────────

    async register(electionId: string, userId: string): Promise<ElectoralRoll> {
        await this.assertElectionOpenForRoll(electionId);

        const exists = await this.rollRepo.findOne({ where: { electionId, userId } });
        if (exists) throw new ApiError('Cet électeur est déjà inscrit sur cette liste.');

        // NB : la validation « userId existe et réside dans le périmètre »
        // se branchera ici une fois la relation User/Jurisdiction finalisée.
        const entry = this.rollRepo.create({ electionId, userId });
        return this.rollRepo.save(entry);
    }

    // ── Import en masse (liste d'amorçage) ────────────────────

    async bulkRegister(electionId: string, userIds: string[]): Promise<BulkRegisterResult> {
        await this.assertElectionOpenForRoll(electionId);

        const unique = [...new Set(userIds)];

        // On écarte ceux déjà inscrits pour ne pas violer l'unicité.
        const existing = await this.rollRepo.find({
            where: { electionId, userId: In(unique) },
            select: { userId: true },
        });
        const already = new Set(existing.map(e => e.userId));
        const toAdd = unique.filter(id => !already.has(id));

        if (toAdd.length) {
            await this.rollRepo.save(toAdd.map(userId => this.rollRepo.create({ electionId, userId })));
        }

        return { added: toAdd.length, skipped: unique.length - toAdd.length };
    }

    // ── Liste ─────────────────────────────────────────────────

    async list(electionId: string, page = 1, limit = 50) {
        await this.getElection(electionId);
        const p = Math.max(1, page);
        const l = Math.min(200, Math.max(1, limit));
        const [data, total] = await this.rollRepo.findAndCount({
            where: { electionId },
            skip: (p - 1) * l,
            take: l,
            order: { registeredAt: 'ASC' },
        });
        return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
    }

    // ── Radiation ─────────────────────────────────────────────

    async remove(electionId: string, userId: string): Promise<{ success: boolean }> {
        await this.assertElectionOpenForRoll(electionId);
        const entry = await this.rollRepo.findOne({ where: { electionId, userId } });
        if (!entry) throw new ApiError('Électeur non inscrit sur cette liste.');
        await this.rollRepo.delete({ electionId, userId });
        return { success: true };
    }

    // ── Statistiques de participation ─────────────────────────

    async stats(electionId: string): Promise<RollStats> {
        await this.getElection(electionId);
        const rollSize = await this.rollRepo.count({ where: { electionId } });
        const voted = await this.voteRepo.count({ where: { electionId } });
        const participationRate = rollSize === 0 ? 0 : voted / rollSize;
        return { rollSize, voted, participationRate };
    }

    /** Utilisé par le VoteService (bloc suivant) : l'électeur est-il éligible ? */
    isRegistered(electionId: string, userId: string): Promise<boolean> {
        return this.rollRepo.exists({ where: { electionId, userId } });
    }

    // ── Helpers ───────────────────────────────────────────────

    private async getElection(electionId: string): Promise<Election> {
        const election = await this.electionRepo.findOne({ where: { id: electionId } });
        if (!election) throw new ApiErrorNotFoundById('elections', electionId);
        return election;
    }

    /** La liste ne se modifie pas sur une élection clôturée. */
    private async assertElectionOpenForRoll(electionId: string): Promise<Election> {
        const election = await this.getElection(electionId);
        if (election.status === ElectionStatus.closed) {
            throw new ApiError('La liste électorale ne peut plus être modifiée : élection clôturée.');
        }
        return election;
    }
}
