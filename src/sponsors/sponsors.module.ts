// ============================================================
// sponsors.module.ts
// Financement du portail (sponsors) — module autonome, aucune
// dépendance à auth/users/election/oversight : soumission publique
// sans compte, reviewedById est une simple colonne id (comme
// reviewedById ailleurs dans le projet), jamais une relation.
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Sponsor } from './entities/sponsor.entity';
import { SponsorController } from './controllers/sponsor.controller';
import { SponsorService } from './services/sponsor.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Sponsor]),
    ],
    controllers: [SponsorController],
    providers: [SponsorService],
    exports: [SponsorService],
})
export class SponsorsModule { }
