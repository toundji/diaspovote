// ============================================================
// elections.module.ts
// Module du cœur électoral.
// Condition et Vote sont enregistrées (TypeOrm) mais n'ont pas encore
// de service/controller dédié — à ajouter dans un prochain bloc.
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Jurisdiction } from './entities/jurisdiction.entity';
import { ElectoralRoll } from './entities/electoral-roll.entity';
import { Vote } from './entities/vote.entity';
import { Condition } from './entities/condition.entity';
import { Election } from './entities/election.entity';
import { Candidacy } from './entities/candidacy.entity';
import { CandidacyProgram } from './entities/candidacy-program.entity';
import { CampaignPost } from './entities/campaign-post.entity';

import { ElectionController } from './controllers/election.controller';
import { ElectoralRollController } from './controllers/electoral-roll.controller';
import { JurisdictionController } from './controllers/jurisdiction.controller';
import { CandidacyController } from './controllers/candidacy.controller';

import { ElectionService } from './services/election.service';
import { ElectoralRollService } from './services/electoral-roll.service';
import { JurisdictionService } from './services/jurisdiction.service';
import { CandidacyService } from './services/candidacy.service';
import { CandidacyProgramService } from './services/candidacy-program.service';
import { CampaignPostService } from './services/campaign-post.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Jurisdiction,
            Election,
            Condition,
            ElectoralRoll,
            Vote,
            Candidacy,
            CandidacyProgram,
            CampaignPost,
        ]),
    ],
    controllers: [
        ElectionController,
        JurisdictionController,
        ElectoralRollController,
        CandidacyController,
    ],
    providers: [
        ElectionService,
        JurisdictionService,
        ElectoralRollService,
        CandidacyService,
        CandidacyProgramService,
        CampaignPostService,
    ],
    exports: [
        ElectionService,
        JurisdictionService,
        ElectoralRollService,
        CandidacyService,
        CandidacyProgramService,
        CampaignPostService,
    ],
})
export class ElectionsModule { }
