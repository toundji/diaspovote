// ============================================================
// candidacy.entity.ts
// Une candidature = un utilisateur brigue un poste dans une élection.
// État dérivé de (approvedAt, rejectedAt) — pas de colonne status
// dédiée, même convention que Achievement dans le diagramme :
//   ni l'un ni l'autre → en attente de revue
//   approvedAt renseigné → approuvée
//   rejectedAt renseigné → rejetée
// Unicité (user_id, election_id) : une seule candidature par personne et par scrutin.
// ============================================================
import { Entity, Column, BeforeInsert, Index, Unique } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('candidacies')
@Unique('uq_candidacy_user_election', ['userId', 'electionId'])
export class Candidacy extends Audit {
    static entityName = 'candidacies';
    static entityCode = '15';

    @Index()
    @Column({ name: 'user_id' })
    userId!: string;

    @Index()
    @Column({ name: 'election_id' })
    electionId!: string;

    /** Poste briguée (FK positions.id — référentiel géré par l'admin). */
    @Index()
    @Column({ name: 'position_id' })
    positionId!: string;

    @Column({ name: 'photo_url', nullable: true })
    photoUrl?: string;

    /** Membre de la commission/admin ayant traité la candidature. */
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
        this.code = Candidacy.entityCode + Date.now();
    }
}
