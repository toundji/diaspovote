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

import { AllowStatus, GetUser, Roles } from '../../core/decorators/api.decorator';

// Type minimal injecté par le middleware JWT (req.user)
import type { AdminResetPasswordDto, AdminUpdateRolesDto, AdminUpdateStatusDto, ListUsersQuery, UpdateProfileDto } from '../dto/user.dto';
import { UserRole, UserStatus } from 'src/shared/common.enum';
import { JwtUserInfo } from 'src/shared/auth.type.dto';
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

    // ── Admin — liste ─────────────────────────────────────────

    /**
     * GET /users
     * Liste paginée de tous les utilisateurs avec filtres optionnels.
     * Accessible : admin, commission.
     */
    @Get()
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
     * Accessible : admin, commission.
     */
    @Get(':id')
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
     * Accessible : admin uniquement.
     */
    @Patch(':id/roles')
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
     * Accessible : admin uniquement.
     *
     * ⚠️  Cette route doit être déclarée AVANT `:id` pour éviter
     * que NestJS interprète "admin" comme un id.
     */
    @Patch('admin/reset-password')
    @Roles(UserRole.admin)
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
     * Accessible : admin uniquement.
     */
    @Delete(':id')
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
}