// ============================================================
// seeder.ts
// Point d'entrée CLI du seeding — lifecycle uniquement (connexion
// DB, flag --refresh). La logique de chaque seed vit dans
// database/seeds/ (un fichier par concern, ex: seed-admin.ts).
//
// Usage :
//   npm run seed          — idempotent, ne duplique pas les données existantes
//   npm run seed:refresh  — supprime puis recrée (admin pour l'instant)
// ============================================================
import 'dotenv/config';
import dataSource from './database/data-source';
import { readSeedAdminConfig, seedAdmin } from './database/seeds/seed-admin';
import { seedUniversities } from './database/seeds/seed-universities';

async function run(): Promise<void> {
    const refresh = process.argv.includes('--refresh');

    // Valide la config .env avant d'ouvrir une connexion DB — échoue vite.
    readSeedAdminConfig();

    await dataSource.initialize();
    try {
        await seedAdmin(dataSource, refresh);
        // Idempotent par nom, pas de flag --refresh (universités potentiellement
        // déjà référencées par des comptes existants — voir seed-universities.ts).
        await seedUniversities(dataSource);
    } finally {
        await dataSource.destroy();
    }
}

run().catch((err) => {
    console.error('Échec du seed :', err);
    process.exit(1);
});
