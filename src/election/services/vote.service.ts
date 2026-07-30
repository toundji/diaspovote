// ============================================================
// vote.service.ts
// Expression du vote : un électeur choisit une candidature approuvée
// dans une élection active, pour laquelle il est inscrit sur la
// liste électorale. Unicité (userId, electionId) appliquée en DB
// (contrainte) et vérifiée ici pour un message d'erreur clair.
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vote } from '../entities/vote.entity';
import { Election } from '../entities/election.entity';
import { Candidacy } from '../entities/candidacy.entity';
import { ElectionStatus } from '../entities/election.enum';
import { ElectoralRollService } from './electoral-roll.service';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { CandidacyResult, CastVoteDto, ElectionResults, HasVotedResult, VoteReceipt } from '../dto/vote.dto';

@Injectable()
export class VoteService {
    constructor(
        @InjectRepository(Vote) private readonly voteRepo: Repository<Vote>,
        @InjectRepository(Election) private readonly electionRepo: Repository<Election>,
        @InjectRepository(Candidacy) private readonly candidacyRepo: Repository<Candidacy>,
        private readonly electoralRollService: ElectoralRollService,
    ) { }

    // ── Voter ─────────────────────────────────────────────────

    async cast(userId: string, dto: CastVoteDto): Promise<VoteReceipt> {
        const election = await this.electionRepo.findOne({ where: { id: dto.electionId } });
        if (!election) throw new ApiErrorNotFoundById('elections', dto.electionId);
        this.assertVotingOpen(election);

        const isEligible = await this.electoralRollService.isRegistered(dto.electionId, userId);
        if (!isEligible) {
            throw new ApiError("Vous n'êtes pas inscrit sur la liste électorale de cette élection.", {
                code: HttpStatus.FORBIDDEN,
            });
        }

        const candidacy = await this.candidacyRepo.findOne({ where: { id: dto.candidacyId } });
        if (!candidacy) throw new ApiErrorNotFoundById('candidacies', dto.candidacyId);
        if (candidacy.electionId !== dto.electionId) {
            throw new ApiError("Cette candidature n'appartient pas à cette élection.");
        }
        if (!candidacy.approvedAt || candidacy.rejectedAt) {
            throw new ApiError("Cette candidature n'a pas été approuvée par la commission.");
        }

        const already = await this.voteRepo.findOne({
            where: { userId, electionId: dto.electionId },
        });
        if (already) {
            throw new ApiError('Vous avez déjà voté pour cette élection.');
        }

        const vote = this.voteRepo.create({
            userId,
            electionId: dto.electionId,
            candidacyId: dto.candidacyId,
        });
        const saved = await this.voteRepo.save(vote);

        return {
            receiptCode: saved.receiptCode,
            electionId: saved.electionId,
            candidacyId: saved.candidacyId,
            castAt: saved.createdAt!,
        };
    }

    // ── Vérification du reçu (publique — pas d'identité liée) ──

    async verifyReceipt(receiptCode: string): Promise<VoteReceipt> {
        const vote = await this.voteRepo.findOne({ where: { receiptCode } });
        if (!vote) throw new ApiError('Reçu introuvable.', { code: HttpStatus.NOT_FOUND });

        return {
            receiptCode: vote.receiptCode,
            electionId: vote.electionId,
            candidacyId: vote.candidacyId,
            castAt: vote.createdAt!,
        };
    }

    // ── Ai-je déjà voté ? ──────────────────────────────────────

    async hasVoted(userId: string, electionId: string): Promise<HasVotedResult> {
        const vote = await this.voteRepo.findOne({ where: { userId, electionId } });
        return vote
            ? { voted: true, receiptCode: vote.receiptCode }
            : { voted: false };
    }

    // ── Résultats ──────────────────────────────────────────────

    /**
     * Résultats agrégés par candidature. Visibles publiquement uniquement
     * une fois `resultsPublished` — sinon réservé à admin/commission
     * (aperçu avant publication).
     */
    async getResults(electionId: string, canPreview: boolean): Promise<ElectionResults> {
        const election = await this.electionRepo.findOne({ where: { id: electionId } });
        if (!election) throw new ApiErrorNotFoundById('elections', electionId);

        if (!election.resultsPublished && !canPreview) {
            throw new ApiError('Les résultats de cette élection ne sont pas encore publiés.', {
                code: HttpStatus.FORBIDDEN,
            });
        }

        const rows = await this.voteRepo
            .createQueryBuilder('v')
            .select('v.candidacy_id', 'candidacyId')
            .addSelect('COUNT(*)', 'votes')
            .where('v.election_id = :electionId', { electionId })
            .groupBy('v.candidacy_id')
            .orderBy('votes', 'DESC')
            .getRawMany<{ candidacyId: string; votes: string }>();

        const results: CandidacyResult[] = rows.map(r => ({
            candidacyId: r.candidacyId,
            votes: Number(r.votes),
        }));

        return {
            electionId,
            totalVotes: results.reduce((sum, r) => sum + r.votes, 0),
            results,
        };
    }

    // ── Helpers ───────────────────────────────────────────────

    private assertVotingOpen(election: Election): void {
        if (election.status !== ElectionStatus.active) {
            throw new ApiError("Le vote n'est pas ouvert pour cette élection.");
        }
        const now = new Date();
        if (election.startsAt && now < election.startsAt) {
            throw new ApiError('Le vote n\'a pas encore commencé.');
        }
        if (election.endsAt && now > election.endsAt) {
            throw new ApiError('Le vote est terminé pour cette élection.');
        }
    }
}
