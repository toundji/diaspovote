// ============================================================
// achievement.controller.ts
// Routes /candidacies/:candidacyId/achievements/*.
// Lecture publique (portail vitrine), écriture réservée au candidat
// propriétaire, revue (approve/reject) réservée à commission/admin
// depuis le back-office.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AchievementService } from '../services/achievement.service';
import { GetUser, Public, Roles, RequireClientType } from 'src/core/decorators/api.decorator';
import { ApiClientType, UserRole } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';

import { CreateAchievementDto, UpdateAchievementDto } from '../dto/achievement.dto';
import type { ListAchievementsQuery } from '../dto/achievement.dto';

@ApiTags('Achievements')
@Controller('candidacies/:candidacyId/achievements')
export class AchievementController {
    constructor(private readonly achievementService: AchievementService) { }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publier une réalisation vérifiée' })
    create(@GetUser() user: JwtUserInfo, @Param('candidacyId') candidacyId: string, @Body() body: CreateAchievementDto) {
        return this.achievementService.create(candidacyId, user.id, body);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les réalisations d\'un candidat' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'categoryId', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
    list(@Param('candidacyId') candidacyId: string, @Query() query: ListAchievementsQuery) {
        return this.achievementService.list(candidacyId, query);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Récupérer une réalisation par id' })
    getOne(@Param('id') id: string) {
        return this.achievementService.getById(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Modifier sa réalisation (tant qu\'elle est en attente)' })
    update(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Body() body: UpdateAchievementDto) {
        return this.achievementService.update(id, user.id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Retirer sa réalisation (tant qu\'elle est en attente)' })
    withdraw(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.achievementService.withdraw(id, user.id);
    }

    @Post(':id/approve')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Approuver une réalisation' })
    approve(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.achievementService.approve(id, user.id);
    }

    @Post(':id/reject')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Rejeter une réalisation' })
    reject(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.achievementService.reject(id, user.id);
    }
}
