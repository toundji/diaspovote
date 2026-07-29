// ============================================================
// jurisdiction.entity.ts
// Périmètre géographique d'une élection (fédération / état).
// Hiérarchie via parentId auto-référencé.
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';
import { JurisdictionType } from './election.enum';

@Entity('jurisdictions')
export class Jurisdiction extends Audit {
    static entityName = 'jurisdictions';
    static entityCode = '10';

    @Column()
    name!: string;

    @Column({ type: 'enum', enum: JurisdictionType })
    type!: JurisdictionType;

    /** Parent dans la hiérarchie (null pour la fédération racine). */
    @Index()
    @Column({ name: 'parent_id', nullable: true })
    parentId?: string;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Jurisdiction.entityCode + Date.now();
        this.name = this.name?.trim();
    }
}
