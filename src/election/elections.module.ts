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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Jurisdiction,
            Selection,
            Condition,
            ElectoralRoll,
            Vote,
        ]),
    ],
    controllers: [
        ElectionController,
    ],
    providers: [
        ElectionService,
    ],
    exports: [
        ElectionService,
    ],
})
export class ElectionsModule { }
