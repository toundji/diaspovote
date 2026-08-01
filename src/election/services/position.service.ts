// ============================================================
// position.service.ts
// Donnée de référence pour les postes brigués en candidature.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Position } from '../entities/position.entity';
import { ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreatePositionDto, ListPositionsQuery, UpdatePositionDto } from '../dto/position.dto';

@Injectable()
export class PositionService {
    constructor(
        @InjectRepository(Position) private readonly positionRepo: Repository<Position>,
    ) { }

    async create(dto: CreatePositionDto): Promise<Position> {
        const position = this.positionRepo.create({ label: dto.label });
        return this.positionRepo.save(position);
    }

    async getById(id: string): Promise<Position> {
        const position = await this.positionRepo.findOne({ where: { id } });
        if (!position) throw new ApiErrorNotFoundById('positions', id);
        return position;
    }

    async list(query: ListPositionsQuery): Promise<Position[]> {
        const where: FindOptionsWhere<Position> = {};
        if (!query.includeInactive) where.isActive = true;

        return this.positionRepo.find({ where, order: { label: 'ASC' } });
    }

    async update(id: string, dto: UpdatePositionDto): Promise<Position> {
        const position = await this.getById(id);
        Object.assign(position, {
            label: dto.label ?? position.label,
            isActive: dto.isActive ?? position.isActive,
        });
        return this.positionRepo.save(position);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        await this.getById(id);
        await this.positionRepo.softDelete(id);
        return { success: true };
    }
}
