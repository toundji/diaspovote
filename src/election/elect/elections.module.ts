// ============================================================
// elections.module.ts
// Module du cœur électoral.
// VoteService + calcul des résultats : bloc suivant (dépend de Candidacy).
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Jurisdiction } from './entities/jurisdiction.entity';
import { Election } from './entities/election.entity';
import { Condition } from './entities/condition.entity';
import { ElectoralRoll } from './entities/electoral-roll.entity';
import { Vote } from './entities/vote.entity';

import { ElectionController } from './controllers/election.controller';
import { JurisdictionController } from './controllers/jurisdiction.controller';
import { ElectoralRollController } from './controllers/electoral-roll.controller';

import { ElectionService } from './services/election.service';
import { JurisdictionService } from './services/jurisdiction.service';
import { ElectoralRollService } from './services/electoral-roll.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Jurisdiction,
            Election,
            Condition,
            ElectoralRoll,
            Vote,
        ]),
    ],
    controllers: [
        ElectionController,
        JurisdictionController,
        ElectoralRollController,
    ],
    providers: [
        ElectionService,
        JurisdictionService,
        ElectoralRollService,
    ],
    exports: [
        ElectionService,
        JurisdictionService,
        ElectoralRollService,
    ],
})
export class ElectionsModule { }
