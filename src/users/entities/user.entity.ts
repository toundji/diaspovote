// ============================================================
// UNIFIED AUTH — user.entity.ts
// Entité de base universelle.
// Chaque projet étend cette entité avec ses propres champs.
// ============================================================
import { Entity, Column, BeforeInsert, ManyToOne, JoinColumn, RelationId, } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Audit } from 'src/shared/audit';
import { UserStatus, UserRole } from 'src/shared/common.enum';

@Entity('users')
export class User extends Audit {
    static entityName = 'users';
    static entityCode = '01';

    // ── Identité ─────────────────────────────────────────────

    @Column({ nullable: true, name: 'first_name' })
    firstName?: string;

    @Column({ nullable: true, name: 'last_name' })
    lastName?: string;

    @Column({ nullable: true, unique: true })
    email?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true, name: 'img_prof' })
    profile?: string;

    /**
     * Périmètre géographique (Jurisdiction) auquel appartient l'utilisateur.
     * Simple colonne d'id (pas de relation TypeORM) : users/ ne dépend pas
     * du module election/, conformément à la règle de dépendance à sens unique.
     */
    @Column({ nullable: true, name: 'jurisdiction_id' })
    jurisdictionId?: string;

    /**
     * Université choisie à l'inscription (référentiel University de election/).
     * Simple colonne d'id (pas de relation TypeORM), même principe que
     * jurisdictionId : users/ ne dépend pas du module election/.
     */
    @Column({ nullable: true, name: 'university_id' })
    universityId?: string;

    // ── Sécurité ─────────────────────────────────────────────

    /**
     * Mot de passe haché bcrypt (rounds=12).
     * select: false → jamais retourné dans les requêtes
     */
    @Exclude()
    @Column({ nullable: true, select: false })
    password?: string;

    /**
     * Google UID — renseigné lors d'une connexion via Google Firebase Auth.
     * Null pour les comptes classiques email/password.
     * select: false → jamais retourné dans les requêtes
     */
    @Exclude()
    @Column({ nullable: true, unique: true, name: 'google_id', select: false })
    googleId?: string;

    /**
     * PIN haché Argon2id (mobile). select: false → jamais retourné dans les requêtes.
     * Voir PasswordService pour le hashing/vérification.
     */
    @Exclude()
    @Column({ nullable: true, name: 'pin_code', type: 'text', select: false })
    pinCode?: string | null;

    @Column({ default: UserStatus.unverified, enum: UserStatus, type: 'enum' })
    status?: UserStatus;

    @Column({ type: 'set', enum: UserRole, default: [UserRole.voter] })
    roles?: UserRole[];

    /**
     * Code unique généré à l'insertion.
     * Utilisé comme référence lisible (ex: 01-1717000000000)
     */
    @Exclude()
    @Column()
    code?: string;


    // ── Relations ─────────────────────────────────────────────

    /**
     * Relation country optionnelle.
     * Chaque projet injecte son entité Country.
     * On garde juste l'id ici pour la base universelle.
     */
    @Column({ nullable: true, name: 'id_country' })
    idCountry?: string;

    // ── Computed ──────────────────────────────────────────────

    @Expose()
    get name(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }

    // ── Hooks ─────────────────────────────────────────────────

    @BeforeInsert()
    prepare() {
        this.email = this.email?.trim()?.toLowerCase();
        this.code = User.entityCode + Date.now();
        this.roles ??= [UserRole.voter];
        this.firstName = this.firstName?.trim();
        this.lastName = this.lastName?.trim();
    }
}