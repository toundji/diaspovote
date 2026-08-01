// ============================================================
// position.controller.ts
// Routes /positions/* — donnée de référence.
// Lecture publique (candidats en ont besoin pour se déclarer),
// écriture admin.
// ============================================================
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { PositionService } from '../services/position.service';
import { Public, Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { CreatePositionDto, UpdatePositionDto } from '../dto/position.dto';
import type { ListPositionsQuery } from '../dto/position.dto';

@ApiTags('Positions')
@Controller('positions')
export class PositionController {
    constructor(private readonly positionService: PositionService) { }

    @Post()
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Créer un poste briguable' })
    create(@Body() body: CreatePositionDto) {
        return this.positionService.create(body);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les postes actifs' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    list(@Query() query: ListPositionsQuery) {
        return this.positionService.list(query);
    }

    @Patch(':id')
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Modifier un poste' })
    update(@Param('id') id: string, @Body() body: UpdatePositionDto) {
        return this.positionService.update(id, body);
    }

    @Delete(':id')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Supprimer un poste' })
    remove(@Param('id') id: string) {
        return this.positionService.remove(id);
    }
}
