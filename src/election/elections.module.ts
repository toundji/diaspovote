// ============================================================
// elections.module.ts
// Module du cœur électoral.
// Entités enregistrées ici ; controllers/services de Vote, Condition
// et ElectoralRoll viendront s'ajouter dans les blocs suivants.
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Jurisdiction } from './entities/jurisdiction.entity';
import { ElectoralRoll } from './entities/electoral-roll.entity';
import { Vote } from './entities/vote.entity';

import { ElectionService } from './services/election.service';
import { Condition } from './entities/condition.entity';
import { ElectionController } from './controllers/election.controller';
import { Election } from './entities/election.entity';
import { ElectoralRollController } from './controllers/electoral-roll.controller';
import { JurisdictionController } from './controllers/jurisdiction.controller';
import { ElectoralRollService } from './services/electoral-roll.service';
import { JurisdictionService } from './services/jurisdiction.service';

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
