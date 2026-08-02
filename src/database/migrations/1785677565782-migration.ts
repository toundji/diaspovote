import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785677565782 implements MigrationInterface {
    name = 'Migration1785677565782'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`universities\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`deleted_at\` timestamp(6) NULL, \`name\` varchar(255) NOT NULL, \`city\` varchar(255) NOT NULL, \`jurisdiction_id\` varchar(255) NULL, \`code\` varchar(255) NULL, INDEX \`IDX_universities_jurisdiction_id\` (\`jurisdiction_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`university_id\` varchar(255) NULL AFTER \`jurisdiction_id\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`university_id\``);
        await queryRunner.query(`DROP TABLE \`universities\``);
    }
}
