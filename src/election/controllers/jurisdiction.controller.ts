// ============================================================
// jurisdiction.controller.ts
// Routes /jurisdictions/* — écriture admin, lecture authentifiée.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import {
    CreateJurisdictionDto, UpdateJurisdictionDto, type ListJurisdictionsQuery,
} from '../dto/jurisdiction.dto';
import { JurisdictionType } from '../entities/election.enum';
import { JurisdictionService } from '../services/jurisdiction.service';

@ApiTags('Jurisdictions')
@ApiBearerAuth()
@Controller('jurisdictions')
export class JurisdictionController {
    constructor(private readonly service: JurisdictionService) { }

    @Post()
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Créer un périmètre (fédération / état)' })
    create(@Body() body: CreateJurisdictionDto) {
        return this.service.create(body);
    }

    @Get()
    @ApiOperation({ summary: 'Lister les périmètres (filtres type / parentId)' })
    @ApiQuery({ name: 'type', required: false, enum: JurisdictionType })
    @ApiQuery({ name: 'parentId', required: false, type: String })
    list(@Query() query: ListJurisdictionsQuery) {
        return this.service.list(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un périmètre par id' })
    getOne(@Param('id') id: string) {
        return this.service.getById(id);
    }

    @Patch(':id')
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Modifier un périmètre' })
    update(@Param('id') id: string, @Body() body: UpdateJurisdictionDto) {
        return this.service.update(id, body);
    }

    @Delete(':id')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Admin] Supprimer un périmètre (si non rattaché)' })
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
