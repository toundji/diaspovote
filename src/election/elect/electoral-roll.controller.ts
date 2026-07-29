// ============================================================
// electoral-roll.controller.ts
// Routes /elections/:electionId/roll/*.
// Écriture : admin. Lecture (liste + stats) : admin + commission.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ElectoralRollService } from '../services/electoral-roll.service';
import { Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { RegisterVoterDto, BulkRegisterDto } from '../dto/electoral-roll.dto';

@ApiTags('Electoral Roll')
@ApiBearerAuth()
@Controller('elections/:electionId/roll')
export class ElectoralRollController {
    constructor(private readonly service: ElectoralRollService) { }

    @Post()
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Inscrire un électeur sur la liste' })
    register(@Param('electionId') electionId: string, @Body() body: RegisterVoterDto) {
        return this.service.register(electionId, body.userId);
    }

    @Post('bulk')
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Importer une liste d\'électeurs (liste d\'amorçage)' })
    bulk(@Param('electionId') electionId: string, @Body() body: BulkRegisterDto) {
        return this.service.bulkRegister(electionId, body.userIds);
    }

    @Get()
    @Roles(UserRole.admin, UserRole.commission)
    @ApiOperation({ summary: '[Admin/Commission] Lister la liste électorale (paginé)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    list(
        @Param('electionId') electionId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.service.list(electionId, Number(page) || 1, Number(limit) || 50);
    }

    @Get('stats')
    @Roles(UserRole.admin, UserRole.commission)
    @ApiOperation({ summary: '[Admin/Commission] Taux de participation de l\'élection' })
    stats(@Param('electionId') electionId: string) {
        return this.service.stats(electionId);
    }

    @Delete(':userId')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Admin] Radier un électeur de la liste' })
    remove(@Param('electionId') electionId: string, @Param('userId') userId: string) {
        return this.service.remove(electionId, userId);
    }
}
