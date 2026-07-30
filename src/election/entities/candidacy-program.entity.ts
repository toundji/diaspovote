// ============================================================
// candidacy-program.entity.ts
// Programme du candidat pour sa candidature — relation 1-1 avec
// Candidacy (une candidature a au plus un programme).
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('candidacy_programs')
export class CandidacyProgram extends Audit {
    static entityName = 'candidacy_programs';
    static entityCode = '16';

    @Index({ unique: true })
    @Column({ name: 'candidacy_id' })
    candidacyId!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = CandidacyProgram.entityCode + Date.now();
    }
}
