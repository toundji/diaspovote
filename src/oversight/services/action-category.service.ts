// ============================================================
// action-category.service.ts
// Donnée de référence pour classer les réalisations vérifiées.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { ActionCategory } from '../entities/action-category.entity';
import { ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateActionCategoryDto, ListActionCategoriesQuery, UpdateActionCategoryDto } from '../dto/action-category.dto';

@Injectable()
export class ActionCategoryService {
    constructor(
        @InjectRepository(ActionCategory) private readonly categoryRepo: Repository<ActionCategory>,
    ) { }

    async create(dto: CreateActionCategoryDto): Promise<ActionCategory> {
        const category = this.categoryRepo.create({ label: dto.label });
        return this.categoryRepo.save(category);
    }

    async getById(id: string): Promise<ActionCategory> {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) throw new ApiErrorNotFoundById('action_categories', id);
        return category;
    }

    async list(query: ListActionCategoriesQuery): Promise<ActionCategory[]> {
        const where: FindOptionsWhere<ActionCategory> = {};
        if (!query.includeInactive) where.isActive = true;

        return this.categoryRepo.find({ where, order: { label: 'ASC' } });
    }

    async update(id: string, dto: UpdateActionCategoryDto): Promise<ActionCategory> {
        const category = await this.getById(id);
        Object.assign(category, {
            label: dto.label ?? category.label,
            isActive: dto.isActive ?? category.isActive,
        });
        return this.categoryRepo.save(category);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        await this.getById(id);
        await this.categoryRepo.softDelete(id);
        return { success: true };
    }
}
