// ============================================================
// sponsor.controller.ts
// Routes /sponsors/* — aucune logique métier, délègue au service.
// Soumission : publique (formulaire "Devenir sponsor", sans compte) ou
// admin (back-office, auto-approuvée). Lecture publique : accueil,
// champs minimaux uniquement. Revue/gestion : commission/admin,
// back-office.
// ============================================================
import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus,
    Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

import { SponsorService } from '../services/sponsor.service';
import { GetUser, Public, Roles, RequireClientType } from 'src/core/decorators/api.decorator';
import { ApiClientType, UserRole } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';
import { ImageDto } from 'src/shared/media.dto';

import { CreateSponsorAdminDto, CreateSponsorDto, UpdateSponsorDto } from '../dto/sponsor.dto';
import type { ListSponsorsQuery } from '../dto/sponsor.dto';

@ApiTags('Sponsors')
@Controller('sponsors')
export class SponsorController {
    constructor(private readonly sponsorService: SponsorService) { }

    // ── Soumission ──────────────────────────────────────────────

    @Post()
    @Public()
    @ApiOperation({ summary: 'Devenir sponsor (formulaire public, sans compte)' })
    submit(@Body() body: CreateSponsorDto) {
        return this.sponsorService.submit(body);
    }

    /**
     * Additif au formulaire public ci-dessus : permet à l'admin/commission
     * d'enregistrer directement un sponsor depuis le back-office (partenariat
     * négocié hors plateforme). Auto-approuvée — pas de second regard
     * nécessaire sur son propre enregistrement.
     */
    @Post('admin')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Enregistrer un sponsor' })
    submitByAdmin(@GetUser() user: JwtUserInfo, @Body() body: CreateSponsorAdminDto) {
        return this.sponsorService.submitByAdmin(user.id, body);
    }

    // ── Lecture ─────────────────────────────────────────────────

    @Get()
    @Public()
    @ApiOperation({ summary: 'Lister les sponsors actifs (accueil du portail)' })
    listPublic() {
        return this.sponsorService.listPublic();
    }

    @Get('admin')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Lister les sponsors (paginé + filtres)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
    listAdmin(@Query() query: ListSponsorsQuery) {
        return this.sponsorService.listAdmin(query);
    }

    @Get(':id')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Récupérer un sponsor par id' })
    getOne(@Param('id') id: string) {
        return this.sponsorService.getById(id);
    }

    // ── Gestion (admin, back-office) ───────────────────────────

    @Patch(':id')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Modifier un sponsor (montant, site, visibilité...)' })
    update(@Param('id') id: string, @Body() body: UpdateSponsorDto) {
        return this.sponsorService.update(id, body);
    }

    @Post(':id/logo')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @FormDataRequest()
    @ApiConsumes('multipart/form-data')
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Uploader le logo du sponsor' })
    uploadLogo(@Param('id') id: string, @Body() body: ImageDto) {
        return this.sponsorService.uploadLogo(id, body);
    }

    @Post(':id/approve')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Approuver une demande de sponsoring' })
    approve(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.sponsorService.approve(id, user.id);
    }

    @Post(':id/reject')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin/Commission] Rejeter une demande de sponsoring' })
    reject(@GetUser() user: JwtUserInfo, @Param('id') id: string) {
        return this.sponsorService.reject(id, user.id);
    }

    @Delete(':id')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Supprimer un sponsor' })
    remove(@Param('id') id: string) {
        return this.sponsorService.remove(id);
    }
}
