// ============================================================
// oversight.module.ts
// Module de suivi post-élection DiaspoVote : réalisations vérifiées
// et échanges/audit (redevabilité des élus envers les électeurs).
// Importe ElectionsModule uniquement pour son API publique
// (CandidacyService) — aucune relation TypeORM croisée avec election/.
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectionsModule } from 'src/election/elections.module';

import { ActionCategory } from './entities/action-category.entity';
import { Achievement } from './entities/achievement.entity';
import { Contestation } from './entities/contestation.entity';
import { Question } from './entities/question.entity';
import { AuditLog } from './entities/audit-log.entity';

import { ActionCategoryController } from './controllers/action-category.controller';
import { AchievementController } from './controllers/achievement.controller';
import { ContestationController } from './controllers/contestation.controller';
import { QuestionController } from './controllers/question.controller';
import { AuditLogController } from './controllers/audit-log.controller';

import { ActionCategoryService } from './services/action-category.service';
import { AchievementService } from './services/achievement.service';
import { ContestationService } from './services/contestation.service';
import { QuestionService } from './services/question.service';
import { AuditLogService } from './services/audit-log.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ActionCategory,
            Achievement,
            Contestation,
            Question,
            AuditLog,
        ]),
        ElectionsModule,
    ],
    controllers: [
        ActionCategoryController,
        AchievementController,
        ContestationController,
        QuestionController,
        AuditLogController,
    ],
    providers: [
        ActionCategoryService,
        AchievementService,
        ContestationService,
        QuestionService,
        AuditLogService,
    ],
    exports: [
        ActionCategoryService,
        AchievementService,
        ContestationService,
        QuestionService,
        AuditLogService,
    ],
})
export class OversightModule { }
