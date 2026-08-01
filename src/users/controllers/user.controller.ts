// ============================================================
// UNIFIED AUTH — user.controller.ts
// Routes /users/*  : profil personnel + admin.
//
// Ce controller ne contient AUCUNE logique métier.
// Il délègue tout au UserService.
// ============================================================
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';

import { UserService } from '../services/user.service';

import { AllowStatus, GetUser, Roles, RequireClientType } from '../../core/decorators/api.decorator';

// Import de valeur (pas `import type`) : ce sont des classes utilisées comme
// metatype par le ValidationPipe (@Body() body: XxxDto) — un `import type` les
// efface du JS émis, design:paramtypes perd la référence, et class-validator
// ne valide plus rien silencieusement (bug réel constaté : email undefined
// arrivait jusqu'au repository sur POST /users faute de validation).
import { AdminCreateUserDto, AdminResetPasswordDto, AdminUpdateRolesDto, AdminUpdateStatusDto, UpdateProfileDto } from '../dto/user.dto';
// ListUsersQuery est une interface (aucune représentation runtime) : reste en import type.
import type { ListUsersQuery } from '../dto/user.dto';
import { ApiClientType, UserRole, UserStatus } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/auth/dto/auth.type.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { ImageDto } from 'src/shared/media.dto';
import { User } from '../entities/user.entity';

// ── Controller ────────────────────────────────────────────────

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    // ── Profil personnel ──────────────────────────────────────

    /**
     * GET /users/me
     * Retourne le profil de l'utilisateur connecté.
     */
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Récupérer son profil' })
    getMe(@GetUser() user: JwtUserInfo) {
        return this.userService.getProfile(user.id);
    }

    /**
     * PATCH /users/me
     * Mise à jour partielle du profil (firstName, lastName, profile).
     * Les champs status et roles sont ignorés même s'ils sont envoyés.
     */
    @Patch('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mettre à jour son profil (firstName, lastName, profile)' })
    updateMe(
        @GetUser() user: JwtUserInfo,
        @Body() body: UpdateProfileDto,
    ) {
        return this.userService.updateProfile(user.id, body);
    }

    /**
     * DELETE /users/me
     * Soft-delete : status → deleted + révocation de toutes les sessions.
     */
    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Supprimer son compte (soft-delete → status deleted)' })
    deleteMe(@GetUser() user: JwtUserInfo) {
        return this.userService.softDeleteMe(user.id);
    }

    // ── Admin — création ──────────────────────────────────────

    /**
     * POST /users
     * Créer un utilisateur (ex: membre de la commission, autre admin).
     * Contourne l'auto-inscription : statut actif par défaut, pas d'OTP de confirmation.
     * Accessible : admin uniquement (depuis le back-office).
     */
    @Post()
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Créer un utilisateur' })
    createUser(@Body() body: AdminCreateUserDto) {
        return this.userService.adminCreateUser(body);
    }

    // ── Admin — liste ─────────────────────────────────────────

    /**
     * GET /users
     * Liste paginée de tous les utilisateurs avec filtres optionnels.
     * Accessible : admin, commission (depuis le back-office uniquement).
     */
    @Get()
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Lister tous les utilisateurs (paginé + filtres)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page (défaut: 20, max: 100)' })
    @ApiQuery({ name: 'status', required: false, enum: UserStatus, description: 'Filtrer par statut' })
    @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filtrer par rôle' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche sur email / firstName / lastName' })
    listUsers(@Query() query: ListUsersQuery) {
        return this.userService.listUsers(query);
    }

    // ── Admin — lecture unitaire ──────────────────────────────

    /**
     * GET /users/:id
     * Récupérer un utilisateur par son id.
     * Accessible : admin, commission (depuis le back-office uniquement).
     */
    @Get(':id')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Récupérer un utilisateur par id' })
    getUser(@Param('id') id: string) {
        return this.userService.getById(id);
    }

    // ── Admin — mise à jour statut ────────────────────────────

    /**
     * PATCH /users/:id/status
     * Changer le statut d'un utilisateur.
     * Bloquer ou supprimer révoque immédiatement toutes ses sessions.
     */
    @Patch(':id/status')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: "[Admin] Changer le statut d'un utilisateur" })
    updateStatus(
        @Param('id') id: string,
        @Body() body: AdminUpdateStatusDto,
    ) {
        return this.userService.updateStatus(id, body.status);
    }

    // ── Admin — mise à jour rôles ─────────────────────────────

    /**
     * PATCH /users/:id/roles
     * Modifier les rôles d'un utilisateur.
     * Accessible : admin uniquement (depuis le back-office).
     */
    @Patch(':id/roles')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: "[Admin] Modifier les rôles d'un utilisateur" })
    updateRoles(
        @Param('id') id: string,
        @Body() body: AdminUpdateRolesDto,
    ) {
        return this.userService.updateRoles(id, body.roles);
    }

    // ── Admin — reset password ────────────────────────────────

    /**
     * PATCH /users/admin/reset-password
     * Réinitialiser le mot de passe d'un utilisateur.
     * Accessible : admin, commission (depuis le back-office uniquement).
     *
     * ⚠️  Cette route doit être déclarée AVANT `:id` pour éviter
     * que NestJS interprète "admin" comme un id.
     */
    @Patch('admin/reset-password')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin, UserRole.commission)
    @ApiBearerAuth()
    @ApiOperation({ summary: "[Admin] Réinitialiser le mot de passe d'un utilisateur" })
    adminResetPassword(@Body() body: AdminResetPasswordDto) {
        return this.userService.adminResetPassword(body.userIdOrEmail, body.newPassword);
    }

    // ── Admin — suppression définitive ───────────────────────

    /**
     * DELETE /users/:id
     * Hard-delete : suppression définitive de la DB.
     * Impossible de supprimer son propre compte via cette route.
     * Accessible : admin uniquement (depuis le back-office).
     */
    @Delete(':id')
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Admin] Supprimer définitivement un utilisateur' })
    hardDelete(@GetUser() caller: JwtUserInfo, @Param('id') id: string,) {
        return this.userService.hardDelete(caller.id, id);
    }



    @AllowStatus(UserStatus.unverified)
    @FormDataRequest()
    @ApiConsumes("multipart/form-data")
    @Post("profile/image")
    updateProfile(@Body() body: ImageDto, @GetUser() user: User): Promise<User> {
        return this.userService.updateImageProfile(user.id, body);
    }

    // ── Admin — photo de profil d'un utilisateur ─────────────

    /**
     * POST /users/:id/profile/image
     * Uploader/remplacer la photo de profil d'un utilisateur quelconque
     * (ex: juste après sa création depuis le back-office, si l'admin a
     * choisi "uploader un fichier" plutôt que "coller une URL").
     * Accessible : admin uniquement (depuis le back-office).
     */
    @RequireClientType(ApiClientType.back_office)
    @Roles(UserRole.admin)
    @FormDataRequest()
    @ApiConsumes("multipart/form-data")
    @ApiBearerAuth()
    @ApiOperation({ summary: "[Admin] Uploader la photo de profil d'un utilisateur" })
    @Post(':id/profile/image')
    adminUpdateProfileImage(@Param('id') id: string, @Body() body: ImageDto): Promise<User> {
        return this.userService.updateImageProfile(id, body);
    }
}