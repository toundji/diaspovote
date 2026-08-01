// ============================================================
// question.entity.ts
// Un citoyen pose une question publique à un candidat.
// answer/answeredAt : réponse du candidat (nullable tant que non répondu).
// hiddenAt : modération — masque la question sans la supprimer.
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('questions')
export class Question extends Audit {
    static entityName = 'questions';
    static entityCode = '21';

    @Index()
    @Column({ name: 'candidacy_id' })
    candidacyId!: string;

    @Index()
    @Column({ name: 'author_id' })
    authorId!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'text', nullable: true })
    answer?: string;

    @Column({ name: 'answered_at', type: 'timestamp', nullable: true })
    answeredAt?: Date;

    @Column({ name: 'hidden_at', type: 'timestamp', nullable: true })
    hiddenAt?: Date;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Question.entityCode + Date.now();
    }
}
