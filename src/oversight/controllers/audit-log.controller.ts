// ============================================================
// audit-log.controller.ts
// Route /audit-log — lecture seule (écrit en interne par les autres
// services de oversight/ via AuditLogService.record()).
// Réservé à admin/commission depuis le back-office.
// ============================================================
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AuditLogService } from '../services/audit-log.service';
import { Roles, RequireClientType } from 'src/core/decorators/api.decorator';
import { ApiClientType, UserRole } from 'src/shared/common.enum';
import type { ListAuditLogQuery } from '../dto/audit-log.dto';

@ApiTags('Audit Log')
@Controller('audit-log')
@RequireClientType(ApiClientType.back_office)
@Roles(UserRole.admin, UserRole.commission)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Journal de transparence des actions de modération' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'entityType', required: false, type: String })
    @ApiQuery({ name: 'entityId', required: false, type: String })
    @ApiQuery({ name: 'actorId', required: false, type: String })
    list(@Query() query: ListAuditLogQuery) {
        return this.auditLogService.list(query);
    }
}
