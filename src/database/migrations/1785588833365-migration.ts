import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785588833365 implements MigrationInterface {
    name = 'Migration1785588833365'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`positions\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`deleted_at\` timestamp(6) NULL, \`label\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`code\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`candidacies\` ADD \`position_id\` varchar(255) NOT NULL AFTER \`election_id\``);
        await queryRunner.query(`CREATE INDEX \`IDX_candidacy_position_id\` ON \`candidacies\` (\`position_id\`)`);
        await queryRunner.query(`ALTER TABLE \`candidacies\` DROP COLUMN \`position\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`candidacies\` ADD \`position\` varchar(255) NOT NULL AFTER \`election_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_candidacy_position_id\` ON \`candidacies\``);
        await queryRunner.query(`ALTER TABLE \`candidacies\` DROP COLUMN \`position_id\``);
        await queryRunner.query(`DROP TABLE \`positions\``);
    }
}
