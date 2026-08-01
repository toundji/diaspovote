// ============================================================
// audit-log.service.ts
// Journal de transparence — record() est appelé par les autres
// services de oversight/ après chaque action de modération
// significative (approve/reject/resolve/hide).
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from '../entities/audit-log.entity';
import { ListAuditLogQuery, PaginatedAuditLogs } from '../dto/audit-log.dto';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog) private readonly logRepo: Repository<AuditLog>,
    ) { }

    async record(actorId: string, action: string, entityType: string, entityId: string, details?: string): Promise<void> {
        const entry = this.logRepo.create({ actorId, action, entityType, entityId, details });
        await this.logRepo.save(entry);
    }

    async list(query: ListAuditLogQuery): Promise<PaginatedAuditLogs> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: Record<string, string> = {};
        if (query.entityType) where.entityType = query.entityType;
        if (query.entityId) where.entityId = query.entityId;
        if (query.actorId) where.actorId = query.actorId;

        const [data, total] = await this.logRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}
