// ============================================================
// UNIFIED AUTH — user-session.entity.ts
// Représente une session active (refresh token).
// Expirée après 7 jours d'inactivité.
// Nettoyée chaque nuit par le cron job.
// ============================================================
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Audit } from '../../shared/audit';
import { User } from './user.entity';
import { UserDevice } from './user-device.entity';

@Entity('user_sessions')
export class UserSession extends Audit {
  static entityName = 'user_sessions';

  // ── Relations ─────────────────────────────────────────────

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Index()
  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserDevice, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({
    name: 'device_fingerprint',
    referencedColumnName: 'deviceFingerprint',
  })
  device?: UserDevice;

  @Column({ name: 'device_fingerprint', length: 64 })
  deviceFingerprint!: string;

  // ── Refresh token ─────────────────────────────────────────

  /**
   * Hash SHA-256 du refresh token.
   * Jamais le token en clair en base.
   * Index unique : une ligne par refresh token actif.
   */
  @Index({ unique: true })
  @Column({ name: 'refresh_token_hash', length: 64, select: false })
  refreshTokenHash!: string;

  /**
   * Date d'expiration.
   * Renouvelée à chaque refresh (TTL glissant 7 jours).
   * Utilisée par le cron job pour nettoyer les sessions expirées.
   */
  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  /** Dernière utilisation du refresh token */
  @Column({ name: 'last_active_at', type: 'datetime' })
  lastActiveAt!: Date;

  // ── Métadonnées réseau ────────────────────────────────────

  /** IP au moment de la création de la session */
  @Column({ nullable: true, length: 45 }) // 45 = max IPv6
  ip?: string;
}
