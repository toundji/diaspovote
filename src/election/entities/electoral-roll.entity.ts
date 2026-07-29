// ============================================================
// electoral-roll.entity.ts
// Liste électorale : qui est éligible pour CETTE élection.
// Rafraîchie à chaque édition → le dénominateur du taux est annuel.
// Unicité (user_id, election_id) : un électeur inscrit une seule fois.
// ============================================================
import { Entity, Column, BeforeInsert, Index, Unique } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('electoral_rolls')
@Unique('uq_roll_user_election', ['userId', 'electionId'])
export class ElectoralRoll extends Audit {
    static entityName = 'electoral_rolls';
    static entityCode = '13';

    @Index()
    @Column({ name: 'user_id' })
    userId!: string;

    @Index()
    @Column({ name: 'election_id' })
    electionId!: string;

    @Column({ name: 'registered_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    registeredAt!: Date;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = ElectoralRoll.entityCode + Date.now();
    }
}
