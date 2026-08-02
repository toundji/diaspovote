// ============================================================
// position.entity.ts
// Poste briguable dans une candidature (Candidacy.positionId).
// Donnée de référence gérée par l'admin (ex: "Président fédéral",
// "Secrétaire", "Trésorier"...) — même convention que ActionCategory.
// Liste globale, partagée par toutes les élections : une élection
// « ignore » un poste simplement en n'ayant aucune candidature dessus,
// pas besoin d'association explicite élection/poste.
// feeAmount/feeCurrency = frais de candidature pour ce poste. Les deux
// sont nullable ensemble : null = poste gratuit, aucune preuve de
// paiement exigée (voir CandidacyPayment).
// ============================================================
import { Entity, Column, BeforeInsert } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('positions')
export class Position extends Audit {
    static entityName = 'positions';
    static entityCode = '23';

    @Column()
    label!: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    /** Montant des frais de candidature. null = poste gratuit. */
    @Column({ name: 'fee_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
    feeAmount?: string | null;

    /** Devise ISO 4217 (ex: XOF, EUR) — renseignée seulement si feeAmount l'est. */
    @Column({ name: 'fee_currency', length: 3, nullable: true })
    feeCurrency?: string | null;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Position.entityCode + Date.now();
        this.label = this.label?.trim();
    }
}
