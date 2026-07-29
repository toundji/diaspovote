// ============================================================
// base_orm_config.ts
// Configuration TypeORM — MySQL/MariaDB
// Charge toutes les entités du projet automatiquement.
// ============================================================
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const baseOrmConfig: TypeOrmModuleOptions = {
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306'),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? 'app',

    // Charge toutes les entités dans src/**/*.entity.ts
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],

    //


    // synchronize: true uniquement en développement
    // En production : utilisez les migrations TypeORM
    synchronize: false,

    // Logs SQL en développement
    logging: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],

    charset: 'utf8mb4',
    timezone: '+00:00',
};
