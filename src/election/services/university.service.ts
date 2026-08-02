// ============================================================
// university.service.ts
// Donnée de référence pour les universités auxquelles un utilisateur
// peut se rattacher à l'inscription. jurisdictionId reste une simple
// colonne (pas de relation TypeORM), mais les réponses hydratent un
// champ `jurisdiction` (objet complet, null si non rattachée ou si le
// périmètre référencé a été supprimé) pour éviter un aller-retour
// supplémentaire au front.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { University } from '../entities/university.entity';
import { Jurisdiction } from '../entities/jurisdiction.entity';
import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { CreateUniversityDto, ListUniversitiesQuery, UpdateUniversityDto } from '../dto/university.dto';

export interface UniversityWithJurisdiction extends University {
    jurisdiction: Jurisdiction | null;
}

@Injectable()
export class UniversityService {
    constructor(
        @InjectRepository(University) private readonly universityRepo: Repository<University>,
        @InjectRepository(Jurisdiction) private readonly jurisdictionRepo: Repository<Jurisdiction>,
    ) { }

    async create(dto: CreateUniversityDto): Promise<UniversityWithJurisdiction> {
        if (dto.jurisdictionId) await this.assertJurisdictionExists(dto.jurisdictionId);

        const university = this.universityRepo.create({
            name: dto.name,
            city: dto.city,
            jurisdictionId: dto.jurisdictionId ?? null,
        });
        const saved = await this.universityRepo.save(university);
        return this.hydrate(saved);
    }

    async getById(id: string): Promise<UniversityWithJurisdiction> {
        const university = await this.universityRepo.findOne({ where: { id } });
        if (!university) throw new ApiErrorNotFoundById('universities', id);
        return this.hydrate(university);
    }

    async list(query: ListUniversitiesQuery): Promise<UniversityWithJurisdiction[]> {
        const where = query.jurisdictionId ? { jurisdictionId: query.jurisdictionId } : {};
        const universities = await this.universityRepo.find({ where, order: { name: 'ASC' } });
        return this.hydrateAll(universities);
    }

    async update(id: string, dto: UpdateUniversityDto): Promise<UniversityWithJurisdiction> {
        const university = await this.universityRepo.findOne({ where: { id } });
        if (!university) throw new ApiErrorNotFoundById('universities', id);

        if (dto.jurisdictionId) {
            await this.assertJurisdictionExists(dto.jurisdictionId);
            university.jurisdictionId = dto.jurisdictionId;
        } else if (dto.clearJurisdiction) {
            university.jurisdictionId = null;
        }

        university.name = dto.name ?? university.name;
        university.city = dto.city ?? university.city;

        const saved = await this.universityRepo.save(university);
        return this.hydrate(saved);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        const university = await this.universityRepo.findOne({ where: { id } });
        if (!university) throw new ApiErrorNotFoundById('universities', id);
        await this.universityRepo.softDelete(id);
        return { success: true };
    }

    private async assertJurisdictionExists(jurisdictionId: string): Promise<void> {
        const exists = await this.jurisdictionRepo.exists({ where: { id: jurisdictionId } });
        if (!exists) throw new ApiError(`Périmètre géographique introuvable (id: ${jurisdictionId}).`);
    }

    private async hydrate(university: University): Promise<UniversityWithJurisdiction> {
        const jurisdiction = university.jurisdictionId
            ? await this.jurisdictionRepo.findOne({ where: { id: university.jurisdictionId } })
            : null;
        return Object.assign(university, { jurisdiction });
    }

    private async hydrateAll(universities: University[]): Promise<UniversityWithJurisdiction[]> {
        const jurisdictionIds = [...new Set(universities.map((u) => u.jurisdictionId).filter((id): id is string => !!id))];
        const jurisdictions = jurisdictionIds.length
            ? await this.jurisdictionRepo.find({ where: { id: In(jurisdictionIds) } })
            : [];
        const byId = new Map(jurisdictions.map((j) => [j.id, j]));
        return universities.map((u) => Object.assign(u, { jurisdiction: u.jurisdictionId ? byId.get(u.jurisdictionId) ?? null : null }));
    }
}
