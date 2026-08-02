import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785663286609 implements MigrationInterface {
    name = 'Migration1785663286609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sponsors\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`message\` text NULL, \`amount\` decimal(12,2) NULL, \`currency\` varchar(3) NULL, \`logo_url\` varchar(255) NULL, \`website_url\` varchar(255) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`reviewed_by_id\` varchar(255) NULL, \`approved_at\` timestamp NULL, \`rejected_at\` timestamp NULL, \`code\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`sponsors\``);
    }

}
