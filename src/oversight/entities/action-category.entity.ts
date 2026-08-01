// ============================================================
// action-category.entity.ts
// Catégorie de classement des réalisations vérifiées (Achievement).
// Donnée de référence gérée par l'admin (ex: "Infrastructure",
// "Éducation", "Santé"...).
// ============================================================
import { Entity, Column, BeforeInsert } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('action_categories')
export class ActionCategory extends Audit {
    static entityName = 'action_categories';
    static entityCode = '18';

    @Column()
    label!: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = ActionCategory.entityCode + Date.now();
        this.label = this.label?.trim();
    }
}
