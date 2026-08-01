// ============================================================
// audit-log.entity.ts
// Journal de transparence des actions métier significatives
// (approbations, rejets, résolutions...) — entité métier distincte
// de l'audit technique createdBy/updatedBy (core/interceptors/api-audit.ts).
// Écrit par record(), jamais modifié après coup.
// ============================================================
import { Entity, Column, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('audit_logs')
export class AuditLog extends Audit {
    static entityName = 'audit_logs';
    static entityCode = '22';

    @Index()
    @Column({ name: 'actor_id' })
    actorId!: string;

    /** Ex: "candidacy.approve", "achievement.reject", "contestation.resolve". */
    @Column()
    action!: string;

    /** Ex: "candidacy", "achievement". */
    @Index()
    @Column({ name: 'entity_type' })
    entityType!: string;

    @Index()
    @Column({ name: 'entity_id' })
    entityId!: string;

    @Column({ type: 'text', nullable: true })
    details?: string;
}
