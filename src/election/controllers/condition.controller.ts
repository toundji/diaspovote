// ============================================================
// condition.controller.ts
// Routes /elections/:electionId/conditions/*.
// Lecture publique (candidats/électeurs doivent connaître les règles
// avant de postuler/voter). Écriture réservée à admin.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ConditionService } from '../services/condition.service';
import { Public, Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { ConditionType } from '../entities/election.enum';
import { CreateConditionDto, UpdateConditionDto } from '../dto/condition.dto';
import type { ListConditionsQuery } from '../dto/condition.dto';

@ApiTags('Conditions')
@Controller('elections/:electionId/conditions')
export class ConditionController {
    constructor(private readonly conditionService: ConditionService) { }

    @Post()
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Ajouter une condition à une élection' })
    create(@Param('electionId') electionId: string, @Body() body: CreateConditionDto) {
        return this.conditionService.create(electionId, body);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les conditions actives d\'une élection' })
    @ApiQuery({ name: 'type', required: false, enum: ConditionType })
    list(@Param('electionId') electionId: string, @Query() query: ListConditionsQuery) {
        return this.conditionService.list(electionId, query);
    }

    @Patch(':id')
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Modifier une condition' })
    update(@Param('id') id: string, @Body() body: UpdateConditionDto) {
        return this.conditionService.update(id, body);
    }

    @Delete(':id')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Supprimer une condition' })
    remove(@Param('id') id: string) {
        return this.conditionService.remove(id);
    }
}
