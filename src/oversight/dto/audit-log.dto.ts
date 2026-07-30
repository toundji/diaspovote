// ============================================================
// audit-log.dto.ts
// DTO de la route /audit-log (lecture seule — écrit via record()).
// ============================================================
import { AuditLog } from '../entities/audit-log.entity';

export interface ListAuditLogQuery {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    actorId?: string;
}

export interface PaginatedAuditLogs {
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
