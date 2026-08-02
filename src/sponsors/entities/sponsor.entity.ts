// ============================================================
// sponsor.entity.ts
// Sponsor du portail (financement — hébergement et frais de
// fonctionnement), entièrement découplé de l'auth : soumission
// publique sans compte (formulaire "Devenir sponsor") ou création
// directe par l'admin depuis le back-office.
// État dérivé de (approvedAt, rejectedAt), même convention que
// Candidacy : une soumission publique reste en attente jusqu'à revue
// admin/commission ; une création admin est auto-approuvée (pas de
// second regard nécessaire sur son propre enregistrement).
// isActive est indépendant de l'approbation : permet de masquer un
// sponsor de l'accueil (partenariat terminé) sans perdre l'historique.
// amount/currency/logoUrl/websiteUrl sont renseignés par l'admin après
// confirmation du paiement (hors plateforme) — jamais par le formulaire
// public.
// ============================================================
import { Entity, Column, BeforeInsert } from 'typeorm';
import { Audit } from 'src/shared/audit';

@Entity('sponsors')
export class Sponsor extends Audit {
    static entityName = 'sponsors';
    static entityCode = '25';

    @Column()
    name!: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    phone?: string;

    /** Message libre du formulaire public (contexte, montant envisagé...). */
    @Column({ type: 'text', nullable: true })
    message?: string;

    /** Montant confirmé — renseigné par l'admin, pas par le formulaire public. */
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    amount?: string | null;

    @Column({ length: 3, nullable: true })
    currency?: string | null;

    @Column({ name: 'logo_url', nullable: true })
    logoUrl?: string;

    @Column({ name: 'website_url', nullable: true })
    websiteUrl?: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    /** Membre de la commission/admin ayant traité la demande. */
    @Column({ name: 'reviewed_by_id', nullable: true })
    reviewedById?: string;

    @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
    approvedAt?: Date;

    @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
    rejectedAt?: Date;

    @Column({ nullable: true })
    code?: string;

    @BeforeInsert()
    prepare() {
        this.code = Sponsor.entityCode + Date.now();
        this.name = this.name?.trim();
    }
}
