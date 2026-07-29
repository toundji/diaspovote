// ============================================================
// condition.entity.ts
// Conditions à remplir, discriminées par type (candidate/voter/campaign).
// Rattachées à une élection : les règles peuvent changer chaque année.
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';
import { ConditionType } from './election.enum';

@Entity('conditions')
export class Condition extends Audit {
    static entityName = 'conditions';
    static entityCode = '12';

    @Index()
    @Column({ name: 'election_id' })
    electionId!: string;

    /** À qui s'applique la condition. */
    @Column({ type: 'enum', enum: ConditionType })
    type!: ConditionType;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    /** true = bloquante ; false = simple recommandation. */
    @Column({ name: 'is_mandatory', type: 'boolean', default: true })
    isMandatory!: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    /** Ordre d'affichage. */
    @Column({ type: 'int', default: 0 })
    position!: number;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Condition.entityCode + Date.now();
        this.title = this.title?.trim();
    }
}
