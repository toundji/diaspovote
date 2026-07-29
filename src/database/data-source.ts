import 'dotenv/config';
import { DataSource } from 'typeorm';
import { baseOrmConfig } from './base_orm_config';

const dataSource = new DataSource({
    ...baseOrmConfig,
    entities: ['dist/**/*/*.entity{.ts,.js}'],
    migrations: ['dist/database/migrations/*.js'],
} as any);

export default dataSource;