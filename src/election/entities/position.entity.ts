// ============================================================
// position.entity.ts
// Poste briguable dans une candidature (Candidacy.positionId).
// Donnée de référence gérée par l'admin (ex: "Président fédéral",
// "Secrétaire", "Trésorier"...) — même convention que ActionCategory.
// Liste globale, partagée par toutes les élections : une élection
// « ignore » un poste simplement en n'ayant aucune candidature dessus,
// pas besoin d'association explicite élection/poste.
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

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Position.entityCode + Date.now();
        this.label = this.label?.trim();
    }
}
