// ============================================================
// UNIFIED AUTH — api.decorator.ts
// Décorateurs NestJS réutilisables.
// ============================================================
import {
    createParamDecorator, ExecutionContext,
    SetMetadata,
} from '@nestjs/common';
import { UserRole, UserStatus } from '../../shared/common.enum';

// ── Décorateurs de route ─────────────────────────────────────

/** Route publique — bypass RequireAuthGuard */
export const Public = () => SetMetadata('isPublic', true);

/** Route sans clé API — bypass ApiKeyGuard */
export const NoKey = () => SetMetadata('noKey', true);

/** Requiert un ou plusieurs rôles */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/** Requiert un statut utilisateur spécifique */
export const RequireStatus = (...statuses: UserStatus[]) =>
    SetMetadata('user_status', statuses);

/** Autorise des statuts supplémentaires */
export const AllowStatus = (...statuses: UserStatus[]) =>
    SetMetadata('allow_status', statuses);

// ── Param décorateurs ─────────────────────────────────────────

/** Utilisateur JWT depuis la requête HTTP */
export const GetUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) =>
        ctx.switchToHttp().getRequest().user,
);

/** Utilisateur depuis un handshake WebSocket */
export const WsUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) =>
        ctx.switchToWs().getClient().handshake?.user,
);

/**
 * Infos d'audit complètes.
 * Injecte : ip, userDevice, clientType, user
 */
export const AuditInfo = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        return {
            ip: req.userIp,
            device: req.userDevice,
            clientType: req.apikey?.type,
            user: req.user,
        };
    },
);