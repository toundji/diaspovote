// ============================================================
// university.entity.ts
// Université à laquelle un utilisateur peut être rattaché (choisie
// à l'inscription). Donnée de référence gérée par l'admin, même
// convention que Position/Jurisdiction : lecture publique, écriture
// admin. jurisdictionId est une simple colonne nullable (pas de FK
// DB) — une université peut ne pas encore être rattachée à un
// périmètre géographique.
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('universities')
export class University extends Audit {
    static entityName = 'universities';
    static entityCode = '26';

    @Column()
    name!: string;

    @Column()
    city!: string;

    /** Périmètre géographique de rattachement (référentiel Jurisdiction) — optionnel. */
    @Index()
    @Column({ name: 'jurisdiction_id', nullable: true })
    jurisdictionId?: string | null;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = University.entityCode + Date.now();
        this.name = this.name?.trim();
        this.city = this.city?.trim();
    }
}
