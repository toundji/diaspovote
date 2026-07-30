// ============================================================
// candidacy-program.service.ts
// Programme du candidat — relation 1-1 avec Candidacy, upsert simple.
// ============================================================
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidacyProgram } from '../entities/candidacy-program.entity';
import { Candidacy } from '../entities/candidacy.entity';

import { ApiError, ApiErrorNotFoundById } from 'src/utils/api-error';
import { UpsertCandidacyProgramDto } from '../dto/candidacy-program.dto';

@Injectable()
export class CandidacyProgramService {
    constructor(
        @InjectRepository(CandidacyProgram) private readonly programRepo: Repository<CandidacyProgram>,
        @InjectRepository(Candidacy) private readonly candidacyRepo: Repository<Candidacy>,
    ) { }

    async getByCandidacyId(candidacyId: string): Promise<CandidacyProgram | null> {
        return this.programRepo.findOne({ where: { candidacyId } });
    }

    async upsert(candidacyId: string, userId: string, dto: UpsertCandidacyProgramDto): Promise<CandidacyProgram> {
        const candidacy = await this.candidacyRepo.findOne({ where: { id: candidacyId } });
        if (!candidacy) throw new ApiErrorNotFoundById('candidacies', candidacyId);
        if (candidacy.userId !== userId) {
            throw new ApiError('Cette candidature ne vous appartient pas.', { code: HttpStatus.FORBIDDEN });
        }

        const existing = await this.getByCandidacyId(candidacyId);
        if (existing) {
            existing.content = dto.content;
            return this.programRepo.save(existing);
        }

        const program = this.programRepo.create({ candidacyId, content: dto.content });
        return this.programRepo.save(program);
    }
}
