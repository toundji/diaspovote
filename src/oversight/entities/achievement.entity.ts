// ============================================================
// achievement.entity.ts
// Réalisation vérifiée publiée par un candidat (redevabilité).
// État dérivé de (approvedAt, rejectedAt) — même convention que
// Candidacy : ni l'un ni l'autre = en attente de revue.
// proofUrl = lien vers la preuve ; proofSnapshot = copie archivée
// (contenu figé) au cas où la source d'origine disparaîtrait.
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('achievements')
export class Achievement extends Audit {
    static entityName = 'achievements';
    static entityCode = '19';

    @Index()
    @Column({ name: 'candidacy_id' })
    candidacyId!: string;

    @Index()
    @Column({ name: 'category_id' })
    categoryId!: string;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'proof_url', nullable: true })
    proofUrl?: string;

    @Column({ name: 'proof_snapshot', type: 'text', nullable: true })
    proofSnapshot?: string;

    /** Membre de la commission/admin ayant traité la réalisation. */
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
        this.code = Achievement.entityCode + Date.now();
        this.title = this.title?.trim();
    }
}
