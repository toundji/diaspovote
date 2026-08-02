// ============================================================
// elections.module.ts
// Module du cœur électoral (processus électoral DiaspoVote).
// Le suivi post-élection (Achievement, Contestation, Question, AuditLog)
// vit dans un module séparé : oversight/ (à créer).
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
import { Position } from './entities/position.entity';

import { ElectionController } from './controllers/election.controller';
import { ElectoralRollController } from './controllers/electoral-roll.controller';
import { JurisdictionController } from './controllers/jurisdiction.controller';
import { CandidacyController } from './controllers/candidacy.controller';
import { ConditionController } from './controllers/condition.controller';
import { VoteController } from './controllers/vote.controller';
import { PositionController } from './controllers/position.controller';
import { CampaignPostController } from './controllers/campaign-post.controller';

import { ElectionService } from './services/election.service';
import { ElectoralRollService } from './services/electoral-roll.service';
import { JurisdictionService } from './services/jurisdiction.service';
import { CandidacyService } from './services/candidacy.service';
import { CandidacyProgramService } from './services/candidacy-program.service';
import { CampaignPostService } from './services/campaign-post.service';
import { ConditionService } from './services/condition.service';
import { VoteService } from './services/vote.service';
import { PositionService } from './services/position.service';

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
            Position,
        ]),
    ],
    controllers: [
        ElectionController,
        JurisdictionController,
        ElectoralRollController,
        CandidacyController,
        ConditionController,
        VoteController,
        PositionController,
        CampaignPostController,
    ],
    providers: [
        ElectionService,
        JurisdictionService,
        ElectoralRollService,
        CandidacyService,
        CandidacyProgramService,
        CampaignPostService,
        ConditionService,
        VoteService,
        PositionService,
    ],
    exports: [
        ElectionService,
        JurisdictionService,
        ElectoralRollService,
        CandidacyService,
        CandidacyProgramService,
        CampaignPostService,
        ConditionService,
        VoteService,
        PositionService,
    ],
})
export class ElectionsModule { }
