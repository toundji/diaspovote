// ============================================================
// condition.service.ts
// Conditions d'éligibilité/participation (candidate/voter/campaign)
// rattachées à une élection. Simple CRUD ordonné par `position`.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Condition } from '../entities/condition.entity';
import { Election } from '../entities/election.entity';

import { ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateConditionDto, ListConditionsQuery, UpdateConditionDto } from '../dto/condition.dto';

@Injectable()
export class ConditionService {
    constructor(
        @InjectRepository(Condition) private readonly conditionRepo: Repository<Condition>,
        @InjectRepository(Election) private readonly electionRepo: Repository<Election>,
    ) { }

    async create(electionId: string, dto: CreateConditionDto): Promise<Condition> {
        await this.assertElectionExists(electionId);

        const condition = this.conditionRepo.create({
            electionId,
            type: dto.type,
            title: dto.title,
            description: dto.description,
            isMandatory: dto.isMandatory ?? true,
            position: dto.position ?? 0,
        });
        return this.conditionRepo.save(condition);
    }

    async getById(id: string): Promise<Condition> {
        const condition = await this.conditionRepo.findOne({ where: { id } });
        if (!condition) throw new ApiErrorNotFoundById('conditions', id);
        return condition;
    }

    async list(electionId: string, query: ListConditionsQuery): Promise<Condition[]> {
        await this.assertElectionExists(electionId);

        const where: FindOptionsWhere<Condition> = { electionId };
        if (query.type) where.type = query.type;
        if (!query.includeInactive) where.isActive = true;

        return this.conditionRepo.find({
            where,
            order: { position: 'ASC', createdAt: 'ASC' },
        });
    }

    async update(id: string, dto: UpdateConditionDto): Promise<Condition> {
        const condition = await this.getById(id);
        Object.assign(condition, {
            title: dto.title ?? condition.title,
            description: dto.description ?? condition.description,
            isMandatory: dto.isMandatory ?? condition.isMandatory,
            isActive: dto.isActive ?? condition.isActive,
            position: dto.position ?? condition.position,
        });
        return this.conditionRepo.save(condition);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        await this.getById(id);
        await this.conditionRepo.softDelete(id);
        return { success: true };
    }

    // ── Helpers ───────────────────────────────────────────────

    private async assertElectionExists(electionId: string): Promise<Election> {
        const election = await this.electionRepo.findOne({ where: { id: electionId } });
        if (!election) throw new ApiErrorNotFoundById('elections', electionId);
        return election;
    }
}
