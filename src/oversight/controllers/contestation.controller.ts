// ============================================================
// contestation.controller.ts
// Routes /achievements/:achievementId/contestations/*.
// Créer : tout utilisateur authentifié. Lister/résoudre : commission/
// admin depuis le back-office (modération, pas de portail public).
// ============================================================
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ContestationService } from '../services/contestation.service';
import { GetUser, Roles, RequireClientType } from 'src/core/decorators/api.decorator';
import { ApiClientType, UserRole } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';

import { CreateContestationDto } from '../dto/contestation.dto';
import type { ListContestationsQuery } from '../dto/contestation.dto';

@ApiTags('Contestations')
@Controller('achievements/:achievementId/contestations')
export class ContestationController {
    constructor(private readonly contestationService: ContestationService) { }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Contester une réalisation approuvée' })
    create(@GetUser() user: JwtUserInfo, @Param('achievementId') achievementId: string, @Body() body: CreateContestationDto) {
        return this.contestationService.create(achievementId, user.id, body);
    }

    @Get()
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Lister les contestations d\'une réalisation' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'resolved', required: false, type: Boolean })
    list(@Param('achievementId') achievementId: string, @Query() query: ListContestationsQuery) {
        return this.contestationService.list(achievementId, query);
    }

    @Post(':id/resolve')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Marquer une contestation comme résolue' })
    resolve(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.contestationService.resolve(id, user.id);
    }
}
