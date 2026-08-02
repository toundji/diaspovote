// ============================================================
// university.controller.ts
// Routes /universities/* — donnée de référence.
// Lecture publique (choix à l'inscription), écriture admin.
// ============================================================
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UniversityService } from '../services/university.service';
import { Public, Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { CreateUniversityDto, UpdateUniversityDto } from '../dto/university.dto';
import type { ListUniversitiesQuery } from '../dto/university.dto';

@ApiTags('Universities')
@Controller('universities')
export class UniversityController {
    constructor(private readonly universityService: UniversityService) { }

    @Post()
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Créer une université' })
    create(@Body() body: CreateUniversityDto) {
        return this.universityService.create(body);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les universités' })
    @ApiQuery({ name: 'jurisdictionId', required: false, type: String })
    list(@Query() query: ListUniversitiesQuery) {
        return this.universityService.list(query);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Détail d\'une université' })
    getById(@Param('id') id: string) {
        return this.universityService.getById(id);
    }

    @Patch(':id')
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Modifier une université' })
    update(@Param('id') id: string, @Body() body: UpdateUniversityDto) {
        return this.universityService.update(id, body);
    }

    @Delete(':id')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Supprimer une université' })
    remove(@Param('id') id: string) {
        return this.universityService.remove(id);
    }
}
