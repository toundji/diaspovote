// ============================================================
// election.controller.ts
// Routes /elections/* — aucune logique métier, délègue au service.
// Lecture : tout utilisateur authentifié. Écriture : admin.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ElectionService } from '../services/election.service';
import { Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { CreateElectionDto, PaginatedElections, UpdateElectionDto } from '../dto/election.dto';
import type { ListElectionsQuery } from '../dto/election.dto';
import { ElectionStatus } from '../entities/election.enum';


@ApiTags('Elections')
@ApiBearerAuth()
@Controller('elections')
export class ElectionController {
    constructor(private readonly electionService: ElectionService) { }

    // ── Écriture (admin) ──────────────────────────────────────

    @Post()
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Créer une élection (brouillon)' })
    create(@Body() body: CreateElectionDto) {
        return this.electionService.create(body);
    }

    @Patch(':id')
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Modifier une élection (brouillon uniquement)' })
    update(@Param('id') id: string, @Body() body: UpdateElectionDto) {
        return this.electionService.update(id, body);
    }

    @Post(':id/activate')
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Ouvrir le scrutin (draft → active)' })
    activate(@Param('id') id: string) {
        return this.electionService.activate(id);
    }

    @Post(':id/close')
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Clôturer le scrutin (active → closed)' })
    close(@Param('id') id: string) {
        return this.electionService.close(id);
    }

    @Post(':id/publish-results')
    @Roles(UserRole.admin)
    @ApiOperation({ summary: '[Admin] Publier les résultats (après clôture)' })
    publishResults(@Param('id') id: string) {
        return this.electionService.publishResults(id);
    }

    @Delete(':id')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Admin] Supprimer une élection (brouillon uniquement)' })
    remove(@Param('id') id: string) {
        return this.electionService.remove(id);
    }

    // ── Lecture (authentifié) ─────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'Lister les élections (paginé + filtres)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'jurisdictionId', required: false, type: String })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: ElectionStatus })
    list(@Query() query: ListElectionsQuery) {
        return this.electionService.list(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une élection par id' })
    getOne(@Param('id') id: string) {
        return this.electionService.getById(id);
    }
}
