// ============================================================
// election.entity.ts
// Une élection = un scrutin pour un périmètre donné et une année donnée.
// Unicité (year, jurisdiction_id) : une seule élection par périmètre/an.
// ============================================================
import { Entity, Column, BeforeInsert, Index, Unique } from 'typeorm';
import { Audit } from 'src/shared/audit';
import { ElectionStatus } from './election.enum';

@Entity('elections')
@Unique('uq_election_year_jurisdiction', ['year', 'jurisdictionId'])
export class Election extends Audit {
    static entityName = 'elections';
    static entityCode = '11';

    /** Périmètre géographique (FK jurisdictions.id). */
    @Index()
    @Column({ name: 'jurisdiction_id' })
    jurisdictionId!: string;

    @Column({ type: 'int' })
    year!: number;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: ElectionStatus, default: ElectionStatus.draft })
    status!: ElectionStatus;

    /** Ouverture du vote. */
    @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
    startsAt?: Date;

    /** Fermeture du vote. */
    @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
    endsAt?: Date;

    /** Résultats rendus publics (uniquement possible après clôture). */
    @Column({ name: 'results_published', type: 'boolean', default: false })
    resultsPublished!: boolean;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Election.entityCode + Date.now();
        this.title = this.title?.trim();
        this.status ??= ElectionStatus.draft;
    }
}
