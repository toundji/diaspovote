// ============================================================
// vote.entity.ts
// Un vote = un électeur choisit une candidature dans une élection.
// Vote TRAÇABLE (user_id + candidacy_id liés) — choix assumé.
// Unicité (user_id, election_id) : une seule voix par personne et par scrutin.
// La date du vote = createdAt (hérité de Audit).
// receiptCode : reçu permettant à l'électeur de vérifier son vote.
// ============================================================
import { Entity, Column, BeforeInsert, Index, Unique } from 'typeorm';
import { randomBytes } from 'crypto';
import { Audit } from 'src/shared/audit';

@Entity('votes')
@Unique('uq_vote_user_election', ['userId', 'electionId'])
export class Vote extends Audit {
    static entityName = 'votes';
    static entityCode = '14';

    @Index()
    @Column({ name: 'election_id' })
    electionId!: string;

    @Index()
    @Column({ name: 'candidacy_id' })
    candidacyId!: string;

    @Index()
    @Column({ name: 'user_id' })
    userId!: string;

    /** Reçu unique remis à l'électeur pour vérifier sa voix. */
    @Column({ name: 'receipt_code', unique: true })
    receiptCode!: string;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Vote.entityCode + Date.now();
        this.receiptCode ??= randomBytes(12).toString('hex').toUpperCase();
    }
}
