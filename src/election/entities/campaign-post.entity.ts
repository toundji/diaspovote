// ============================================================
// campaign-post.entity.ts
// Publication de campagne d'un candidat — relation 1-N avec Candidacy.
// publishedAt nullable : permet de préparer un post en brouillon
// (non exposé publiquement tant qu'il n'est pas publié).
// ============================================================
import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('campaign_posts')
export class CampaignPost extends Audit {
    static entityName = 'campaign_posts';
    static entityCode = '17';

    @Index()
    @Column({ name: 'candidacy_id' })
    candidacyId!: string;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ name: 'media_url', nullable: true })
    mediaUrl?: string;

    @Column({ name: 'published_at', type: 'timestamp', nullable: true })
    publishedAt?: Date;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = CampaignPost.entityCode + Date.now();
        this.title = this.title?.trim();
    }
}
