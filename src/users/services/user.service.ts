// ============================================================
// UNIFIED AUTH — user.service.ts
// Toute la logique métier liée aux utilisateurs.
// Le controller ne fait que router HTTP → ici.
// ============================================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike, FindOptionsWhere, IsNull, Not, In } from 'typeorm';

import { User } from '../entities/user.entity';
import { ApiError, ApiErrorDb, ApiErrorNotFoundById } from '../../utils/api-error';
import { AdminCreateUserDto, UpdateProfileDto, ListUsersQuery, PaginatedUsers, PublicUser } from '../dto/user.dto';
import { PasswordService } from '../../auth/services/password.service';
import { SessionService } from '../../auth/services/session.service';
import { UserStatus, UserRole, FileStatus } from 'src/shared/common.enum';
import { ImageDto } from 'src/shared/media.dto';
import { ApiFsUtils } from 'src/utils/api-fs';
import { apiHashPassword } from 'src/utils/api-util';

// ── Champs autorisés en retour (jamais le password ni le code interne) ──

const USER_SAFE_SELECT = {
    id: true, firstName: true, lastName: true, email: true,
    profile: true, status: true, roles: true,
    idCountry: true, createdAt: true, updatedAt: true,
};

// ── Service ───────────────────────────────────────────────────

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly sessionService: SessionService,
        private readonly passwordService: PasswordService,
    ) { }

    // ── Profil personnel ──────────────────────────────────────

    getProfile(userId: string): Promise<User | null> {
        return this.userRepo.findOne({
            where: { id: userId },
            select: USER_SAFE_SELECT,
        });
    }

    async updateProfile(userId: string, body: UpdateProfileDto): Promise<User | null> {
        // Whitelist explicite — impossible d'auto-attribuer status/roles via cette route
        const ALLOWED: (keyof UpdateProfileDto)[] = ['firstName', 'lastName', 'profile'];
        const patch: Partial<User> = {};
        for (const key of ALLOWED) {
            if (body[key] !== undefined) (patch as any)[key] = body[key];
        }
        if (Object.keys(patch).length === 0) {
            throw new ApiError('No valid fields to update.');
        }
        await this.userRepo.update(userId, patch);
        return this.getProfile(userId);
    }

    /**
     * Profils publics minimaux (nom + photo) pour une liste d'ids — utilisé
     * par le portail pour afficher les candidats/auteurs sans que
     * election/oversight n'aient besoin d'importer l'entité User. Rejette
     * silencieusement les ids introuvables plutôt que d'échouer sur tout
     * le lot (un candidat supprimé ne doit pas casser l'affichage des
     * autres).
     */
    async getPublicProfiles(rawIds: string): Promise<PublicUser[]> {
        const ids = [...new Set(rawIds.split(',').map(id => id.trim()).filter(Boolean))].slice(0, 100);
        if (ids.length === 0) return [];

        const users = await this.userRepo.find({
            where: { id: In(ids) },
            select: { id: true, firstName: true, lastName: true, profile: true },
        });

        return users.map(u => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Utilisateur',
            profile: u.profile,
        }));
    }

    async softDeleteMe(userId: string): Promise<{ success: boolean }> {
        await this.userRepo.update(userId, { status: UserStatus.deleted });
        await this.sessionService.deleteAllSessions(userId);
        return { success: true };
    }

    // ── Admin — création ───────────────────────────────────────

    /**
     * Créer un utilisateur depuis le back-office.
     * Contourne le flux d'auto-inscription : statut actif par défaut (pas d'OTP
     * de confirmation), rôles explicites (ex: commission, admin). Mot de passe
     * haché via apiHashPassword (bcrypt) — même fonction qu'AuthService.register(),
     * pour rester compatible avec apiComparePasswords au login.
     */
    async adminCreateUser(body: AdminCreateUserDto): Promise<User> {
        const existing = await this.userRepo.findOne({ where: { email: body.email } });
        if (existing) {
            throw new ApiError('Cet email est déjà utilisé.');
        }

        const userData = this.userRepo.create({
            email: body.email,
            password: apiHashPassword(body.password),
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            profile: body.profile,
            roles: body.roles?.length ? body.roles : [UserRole.voter],
            status: body.status ?? UserStatus.active,
        });

        const user = await this.userRepo.save(userData).catch(err => {
            throw new ApiErrorDb('users', 'create', userData, err);
        });

        return this.getById(user.id);
    }

    // ── Admin — lecture / liste ───────────────────────────────

    async getById(id: string): Promise<User> {
        const user = await this.userRepo.findOne({
            where: { id },
            select: USER_SAFE_SELECT,
        });
        if (!user) throw new ApiErrorNotFoundById('users', id);
        return user;
    }

    /**
     * Liste paginée avec filtres optionnels.
     * Accessible uniquement aux rôles admin / manager / engineer.
     */
    async listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;

        const where: FindOptionsWhere<User> = {};

        if (query.status) {
            where.status = query.status;
        }

        // Filtre par rôle — MySQL SET type : on passe par QueryBuilder
        // (TypeORM ne supporte pas nativement FIND_IN_SET sur les colonnes SET)
        let qb = this.userRepo
            .createQueryBuilder('u')
            .select(Object.keys(USER_SAFE_SELECT).map(f => `u.${f}`))
            .skip(skip)
            .take(limit)
            .orderBy('u.createdAt', 'DESC');

        if (query.status) {
            qb = qb.andWhere('u.status = :status', { status: query.status });
        }

        if (query.role) {
            // FIND_IN_SET fonctionne sur les colonnes MySQL de type SET
            qb = qb.andWhere('FIND_IN_SET(:role, u.roles) > 0', { role: query.role });
        }

        if (query.search?.trim()) {
            const term = `%${query.search.trim()}%`;
            qb = qb.andWhere(
                '(u.email LIKE :term OR u.first_name LIKE :term OR u.last_name LIKE :term)',
                { term },
            );
        }

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ── Admin — mise à jour statut ────────────────────────────

    async updateStatus(id: string, status: UserStatus): Promise<{ success: boolean }> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new ApiErrorNotFoundById('users', id);

        await this.userRepo.update(id, { status });

        // Bloquer ou supprimer → invalider toutes les sessions actives immédiatement
        if (status === UserStatus.blocked || status === UserStatus.deleted) {
            await this.sessionService.deleteAllSessions(id);
        }

        return { success: true };
    }

    // ── Admin — mise à jour rôles ─────────────────────────────

    async updateRoles(id: string, roles: UserRole[]): Promise<{ success: boolean }> {
        if (!roles?.length) {
            throw new ApiError('Au moins un rôle est requis.');
        }
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new ApiErrorNotFoundById('users', id);

        await this.userRepo.update(id, { roles });
        return { success: true };
    }

    // ── Admin — reset password ────────────────────────────────

    adminResetPassword(userIdOrEmail: string, newPassword: string) {
        return this.passwordService.adminResetPassword(userIdOrEmail, newPassword);
    }

    // ── Admin — suppression définitive ───────────────────────

    async hardDelete(callerId: string, targetId: string): Promise<{ success: boolean }> {
        if (callerId === targetId) {
            throw new ApiError('Impossible de supprimer son propre compte via cette route.');
        }
        const user = await this.userRepo.findOne({ where: { id: targetId } });
        if (!user) throw new ApiErrorNotFoundById('users', targetId);

        await this.sessionService.deleteAllSessions(targetId);
        await this.userRepo.delete(targetId);

        return { success: true };
    }


    async updateImageProfile(id: string, body: ImageDto): Promise<User> {
        let path: string | undefined = undefined;
        const user: User = await this.getById(id);
        const image = body.image;
        if (image) {
            const url = ApiFsUtils.createDir("profiles");
            const cle = `${Date.now()}${Math.ceil(Math.random() * 100)}`;
            path = `${url}/prof_${cle}.${image['fileType']['ext']}`;

            ApiFsUtils.saveFile(image.path, path);

            path = `${process.env.API_ADDRESS}/${path}`;
            user.profile = ApiFsUtils.pathToUrl(path);

            await this.userRepo.update(id, { profile: ApiFsUtils.pathToUrl(path) });
        }

        return user;
    }


}