// ============================================================
// UNIFIED AUTH — auth.type.dto.ts
// Types partagés liés à l'authentification.
// Importés par le middleware, les guards, les controllers.
// Vit dans shared/ (et non auth/) car core/ (middleware) et
// users/ (controller) en ont besoin sans pouvoir dépendre de auth/.
// ============================================================

import { Request } from 'express';
import { TokenType } from './common.enum';

// ── Payload JWT désérialisé (contenu de req.user) ─────────────

export class JwtUserInfo {
  id!: string;
  email!: string;
  roles!: string[];
  type!: TokenType;
  jti!: string;
  deviceFingerprint!: string;
}

// ── Extension de la requête Express ──────────────────────────

export interface AuthApiRequest extends Request {
  user?: JwtUserInfo;
  userCrypt?: unknown;
  accessToken?: string;
  tokenIsExpire?: boolean;
  apikey?: { token: string; valid: boolean; type?: string };
  userIp?: string;
  userDevice?: string;
}
