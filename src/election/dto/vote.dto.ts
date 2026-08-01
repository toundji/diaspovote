// ============================================================
// vote.dto.ts
// DTOs des routes /votes/*.
// ============================================================
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CastVoteDto {
    @IsUUID()
    @IsNotEmpty()
    electionId!: string;

    @IsUUID()
    @IsNotEmpty()
    candidacyId!: string;
}

export interface VoteReceipt {
    receiptCode: string;
    electionId: string;
    candidacyId: string;
    castAt: Date;
}

export interface HasVotedResult {
    voted: boolean;
    receiptCode?: string;
}

export interface CandidacyResult {
    candidacyId: string;
    votes: number;
}

export interface ElectionResults {
    electionId: string;
    totalVotes: number;
    results: CandidacyResult[];
}
