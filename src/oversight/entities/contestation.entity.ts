// ============================================================
// contestation.entity.ts
// Un citoyen conteste une réalisation vérifiée (Achievement).
// resolvedAt/resolvedById = la commission a traité la contestation
// (la décision elle-même — ex: rejeter l'Achievement contesté —
// passe par AchievementService, pas par cette entité).
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('contestations')
export class Contestation extends Audit {
    static entityName = 'contestations';
    static entityCode = '20';

    @Index()
    @Column({ name: 'achievement_id' })
    achievementId!: string;

    @Index()
    @Column({ name: 'reporter_id' })
    reporterId!: string;

    @Column({ type: 'text' })
    reason!: string;

    /** Membre de la commission/admin ayant traité la contestation. */
    @Column({ name: 'resolved_by_id', nullable: true })
    resolvedById?: string;

    @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt?: Date;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Contestation.entityCode + Date.now();
    }
}
