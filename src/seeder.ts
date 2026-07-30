// ============================================================
// seeder.ts
// Point d'entrée du seeding. Pour l'instant : admin principal
// uniquement. Réutilise le DataSource TypeORM des migrations
// (léger — pas de boot Nest complet, pas besoin de Redis/BullMQ).
//
// Usage :
//   npm run seed          — idempotent, ne duplique pas l'admin existant
//   npm run seed:refresh  — supprime l'admin existant puis le recrée
//
// Prérequis .env :
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (obligatoires)
//   SEED_ADMIN_FIRST_NAME, SEED_ADMIN_LAST_NAME (optionnels)
// ============================================================
import 'dotenv/config';
import dataSource from './database/data-source';
import { User } from './users/entities/user.entity';
import { UserRole, UserStatus } from './shared/common.enum';
import { apiHashPassword } from './utils/api-util';

async function seedAdmin(refresh: boolean): Promise<void> {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error(
            'SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD doivent être définis dans .env pour seeder l\'admin principal.',
        );
    }

    const userRepo = dataSource.getRepository(User);
    const existing = await userRepo.findOne({ where: { email } });

    if (existing && !refresh) {
        console.log(`Admin principal déjà présent (${email}) — seed ignoré.`);
        return;
    }

    if (existing && refresh) {
        // Hard delete (pas softDelete) : libère la contrainte unique sur l'email
        // pour permettre la recréation immédiate.
        await userRepo.delete(existing.id);
    }

    const admin = userRepo.create({
        email,
        password: apiHashPassword(password),
        firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin',
        lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'DiaspoVote',
        status: UserStatus.active,
        roles: [UserRole.admin],
    });

    await userRepo.save(admin);
    console.log(`Admin principal créé : ${email}`);
}

async function run(): Promise<void> {
    const refresh = process.argv.includes('--refresh');

    await dataSource.initialize();
    try {
        await seedAdmin(refresh);
    } finally {
        await dataSource.destroy();
    }
}

run().catch((err) => {
    console.error('Échec du seed :', err);
    process.exit(1);
});
