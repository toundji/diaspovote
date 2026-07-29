// ============================================================
// jurisdiction.service.ts
// Gestion des périmètres géographiques (fédération / états).
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { Jurisdiction } from '../entities/jurisdiction.entity';
import { Election } from '../entities/election.entity';
import { JurisdictionType } from 'src/shared/election.enum';
import {
    CreateJurisdictionDto, UpdateJurisdictionDto, ListJurisdictionsQuery,
} from '../dto/jurisdiction.dto';
import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';

@Injectable()
export class JurisdictionService {
    constructor(
        @InjectRepository(Jurisdiction) private readonly repo: Repository<Jurisdiction>,
        @InjectRepository(Election) private readonly electionRepo: Repository<Election>,
    ) { }

    async create(dto: CreateJurisdictionDto): Promise<Jurisdiction> {
        // Une fédération n'a pas de parent ; un état devrait en avoir un.
        if (dto.type === JurisdictionType.federation && dto.parentId) {
            throw new ApiError('Une fédération ne peut pas avoir de parent.');
        }
        if (dto.parentId) {
            const parent = await this.repo.findOne({ where: { id: dto.parentId } });
            if (!parent) throw new ApiErrorNotFoundById('jurisdictions', dto.parentId);
        }
        const jurisdiction = this.repo.create(dto);
        return this.repo.save(jurisdiction);
    }

    async getById(id: string): Promise<Jurisdiction> {
        const j = await this.repo.findOne({ where: { id } });
        if (!j) throw new ApiErrorNotFoundById('jurisdictions', id);
        return j;
    }

    list(query: ListJurisdictionsQuery): Promise<Jurisdiction[]> {
        const where: FindOptionsWhere<Jurisdiction> = {};
        if (query.type) where.type = query.type;
        if (query.parentId) where.parentId = query.parentId;
        return this.repo.find({ where, order: { name: 'ASC' } });
    }

    async update(id: string, dto: UpdateJurisdictionDto): Promise<Jurisdiction> {
        const j = await this.getById(id);
        if (dto.parentId && dto.parentId === id) {
            throw new ApiError('Un périmètre ne peut pas être son propre parent.');
        }
        Object.assign(j, { name: dto.name ?? j.name, parentId: dto.parentId ?? j.parentId });
        return this.repo.save(j);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        await this.getById(id);
        // Interdit si des élections y sont rattachées.
        const linked = await this.electionRepo.count({ where: { jurisdictionId: id } });
        if (linked > 0) {
            throw new ApiError('Impossible de supprimer : des élections sont rattachées à ce périmètre.');
        }
        // Interdit s'il a des enfants.
        const children = await this.repo.count({ where: { parentId: id } });
        if (children > 0) {
            throw new ApiError('Impossible de supprimer : ce périmètre a des sous-périmètres.');
        }
        await this.repo.softDelete(id);
        return { success: true };
    }
}
