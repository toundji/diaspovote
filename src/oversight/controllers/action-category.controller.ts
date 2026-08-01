// ============================================================
// action-category.controller.ts
// Routes /action-categories/* — donnée de référence.
// Lecture publique (candidats en ont besoin pour classer leurs
// réalisations), écriture admin.
// ============================================================
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { ActionCategoryService } from '../services/action-category.service';
import { Public, Roles } from 'src/core/decorators/api.decorator';
import { UserRole } from 'src/shared/common.enum';
import { CreateActionCategoryDto, UpdateActionCategoryDto } from '../dto/action-category.dto';
import type { ListActionCategoriesQuery } from '../dto/action-category.dto';

@ApiTags('Action Categories')
@Controller('action-categories')
export class ActionCategoryController {
    constructor(private readonly categoryService: ActionCategoryService) { }

    @Post()
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Créer une catégorie de réalisation' })
    create(@Body() body: CreateActionCategoryDto) {
        return this.categoryService.create(body);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les catégories de réalisation actives' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    list(@Query() query: ListActionCategoriesQuery) {
        return this.categoryService.list(query);
    }

    @Patch(':id')
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Modifier une catégorie de réalisation' })
    update(@Param('id') id: string, @Body() body: UpdateActionCategoryDto) {
        return this.categoryService.update(id, body);
    }

    @Delete(':id')
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Supprimer une catégorie de réalisation' })
    remove(@Param('id') id: string) {
        return this.categoryService.remove(id);
    }
}
