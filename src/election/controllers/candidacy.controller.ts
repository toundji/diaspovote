// ============================================================
// candidacy.controller.ts
// Routes /candidacies/* — aucune logique métier, délègue aux services.
// Lecture (profil candidat, programme, posts publiés) : publique
// (portail vitrine). Écriture : candidat authentifié sur sa propre
// candidature ; revue : commission/admin depuis le back-office.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

import { CandidacyService } from '../services/candidacy.service';
import { CandidacyProgramService } from '../services/candidacy-program.service';
import { CampaignPostService } from '../services/campaign-post.service';
import { CandidacyPaymentService } from '../services/candidacy-payment.service';

import { GetUser, Public, Roles, RequireClientType } from 'src/core/decorators/api.decorator';
import { ApiClientType, UserRole } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';
import { DocDto } from 'src/shared/media.dto';

import { CreateCandidacyAdminDto, CreateCandidacyDto, UpdateCandidacyDto } from '../dto/candidacy.dto';
import type { ListCandidaciesQuery } from '../dto/candidacy.dto';
import { UpsertCandidacyProgramDto } from '../dto/candidacy-program.dto';
import { CreateCampaignPostDto, UpdateCampaignPostDto } from '../dto/campaign-post.dto';
import type { ListCampaignPostsQuery } from '../dto/campaign-post.dto';

@ApiTags('Candidacies')
@Controller('candidacies')
export class CandidacyController {
    constructor(
        private readonly candidacyService: CandidacyService,
        private readonly programService: CandidacyProgramService,
        private readonly postService: CampaignPostService,
        private readonly paymentService: CandidacyPaymentService,
    ) { }

    // ── Candidat ───────────────────────────────────────────────

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soumettre sa candidature à une élection' })
    submit(@GetUser() user: JwtUserInfo, @Body() body: CreateCandidacyDto) {
        return this.candidacyService.submit(user.id, body);
    }

    /**
     * Additif au flux self-service ci-dessus (ne le remplace pas) : permet à
     * la commission/admin de créer une candidature pour un tiers depuis le
     * back-office (ex: candidat sans accès à l'appli, ou test). Délègue à la
     * même validation métier (`CandidacyService.submit`), seul le `userId`
     * vient du corps de la requête plutôt que du JWT appelant.
     */
    @Post('admin')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Créer une candidature pour un utilisateur' })
    submitForUser(@Body() body: CreateCandidacyAdminDto) {
        return this.candidacyService.submit(body.userId, body);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Modifier sa candidature (tant qu\'elle est en attente)' })
    update(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Body() body: UpdateCandidacyDto) {
        return this.candidacyService.update(id, user.id, body);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Retirer sa candidature (tant qu\'elle est en attente)' })
    withdraw(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.candidacyService.withdraw(id, user.id);
    }

    // ── Revue (commission / admin, back-office) ───────────────

    @Post(':id/approve')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Approuver une candidature' })
    approve(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.candidacyService.approve(id, user.id);
    }

    @Post(':id/reject')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Rejeter une candidature' })
    reject(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.candidacyService.reject(id, user.id);
    }

    // ── Lecture publique (portail vitrine) ────────────────────

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les candidatures (paginé + filtres)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'electionId', required: false, type: String })
    @ApiQuery({ name: 'userId', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
    list(@Query() query: ListCandidaciesQuery) {
        return this.candidacyService.list(query);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Récupérer une candidature par id' })
    getOne(@Param('id') id: string) {
        return this.candidacyService.getById(id);
    }

    // ── Programme (1-1) ────────────────────────────────────────

    @Get(':id/program')
    @Public()
    @ApiOperation({ summary: 'Récupérer le programme du candidat' })
    getProgram(@Param('id') id: string) {
        return this.programService.getByCandidacyId(id);
    }

    @Put(':id/program')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Créer ou mettre à jour son programme' })
    upsertProgram(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Body() body: UpsertCandidacyProgramDto) {
        return this.programService.upsert(id, user.id, body);
    }

    // ── Paiement des frais de candidature (1-1) ────────────────
    // Indépendant de la revue de la candidature ci-dessus : l'admin peut
    // approuver/rejeter la candidature sans attendre la validation du
    // paiement, et inversement. Inexistant pour un poste gratuit.

    @Get(':id/payment')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Consulter le paiement des frais (propriétaire ou commission/admin uniquement)' })
    getPayment(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.paymentService.getForViewer(id, user);
    }

    @Post(':id/payment')
    @FormDataRequest()
    @ApiConsumes('multipart/form-data')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soumettre (ou resoumettre après rejet) la preuve de paiement des frais' })
    submitPayment(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Body() body: DocDto) {
        return this.paymentService.submit(id, user.id, body);
    }

    @Post(':id/payment/approve')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Valider le paiement des frais de candidature' })
    approvePayment(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.paymentService.approve(id, user.id);
    }

    @Post(':id/payment/reject')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Commission] Rejeter le paiement des frais de candidature' })
    rejectPayment(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.paymentService.reject(id, user.id);
    }

    // ── Publications de campagne (1-N) ─────────────────────────

    @Get(':id/posts')
    @Public()
    @ApiOperation({ summary: 'Lister les publications de campagne (publiées uniquement, sauf propriétaire)' })
    async listPosts(@GetUser() user: JwtUserInfo | undefined, @Param('id') id: string, @Query() query: ListCampaignPostsQuery) {
        if (query.includeUnpublished && user) {
            const candidacy = await this.candidacyService.getById(id);
            query.includeUnpublished = candidacy.userId === user.id;
        } else {
            query.includeUnpublished = false;
        }
        return this.postService.list(id, query);
    }

    @Post(':id/posts')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Créer une publication de campagne (brouillon)' })
    createPost(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Body() body: CreateCampaignPostDto) {
        return this.postService.create(id, user.id, body);
    }

    @Patch(':id/posts/:postId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Modifier une publication de campagne' })
    updatePost(
        @GetUser() user: JwtUserInfo,
        @Param('id') id: string,
        @Param('postId') postId: string,
        @Body() body: UpdateCampaignPostDto,
    ) {
        return this.postService.update(id, postId, user.id, body);
    }

    @Post(':id/posts/:postId/publish')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publier une publication de campagne' })
    publishPost(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Param('postId') postId: string) {
        return this.postService.publish(id, postId, user.id);
    }

    @Delete(':id/posts/:postId')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Supprimer une publication de campagne' })
    removePost(@GetUser() user: JwtUserInfo, @Param('id') id: string, @Param('postId') postId: string) {
        return this.postService.remove(id, postId, user.id);
    }
}
