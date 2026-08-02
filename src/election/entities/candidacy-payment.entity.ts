// ============================================================
// candidacy-payment.entity.ts
// Preuve de paiement des frais de candidature — relation 1-1 avec
// Candidacy (une candidature a au plus un dossier de paiement), même
// convention d'upsert que CandidacyProgram. N'existe que pour les
// postes payants (Position.feeAmount renseigné) — un poste gratuit
// n'a jamais de CandidacyPayment.
// amount/currency = snapshot du tarif du poste au moment de la 1re
// soumission, pour figer le montant même si le poste change ensuite.
// État dérivé de (approvedAt, rejectedAt), même convention que
// Candidacy — mais totalement indépendant de la revue de la
// candidature elle-même (deux workflows distincts, pas de blocage
// croisé).
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('candidacy_payments')
export class CandidacyPayment extends Audit {
    static entityName = 'candidacy_payments';
    static entityCode = '24';

    @Index({ unique: true })
    @Column({ name: 'candidacy_id' })
    candidacyId!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount!: string;

    @Column({ length: 3 })
    currency!: string;

    @Column({ name: 'proof_url' })
    proofUrl!: string;

    /** Membre de la commission/admin ayant traité le paiement. */
    @Column({ name: 'reviewed_by_id', nullable: true })
    reviewedById?: string;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt?: Date;

    @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
    rejectedAt?: Date;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = CandidacyPayment.entityCode + Date.now();
    }
}
