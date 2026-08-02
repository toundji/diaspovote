import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785660516356 implements MigrationInterface {
    name = 'Migration1785660516356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`positions\` ADD \`fee_amount\` decimal(12,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`positions\` ADD \`fee_currency\` varchar(3) NULL`);
        await queryRunner.query(`CREATE TABLE \`candidacy_payments\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` varchar(255) NULL, \`updated_by\` varchar(255) NULL, \`deleted_at\` timestamp(6) NULL, \`candidacy_id\` varchar(255) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`currency\` varchar(3) NOT NULL, \`proof_url\` varchar(255) NOT NULL, \`reviewed_by_id\` varchar(255) NULL, \`approved_at\` timestamp NULL, \`rejected_at\` timestamp NULL, \`code\` varchar(255) NULL, UNIQUE INDEX \`IDX_candidacy_payments_candidacy_id\` (\`candidacy_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`candidacy_payments\``);
        await queryRunner.query(`ALTER TABLE \`positions\` DROP COLUMN \`fee_currency\``);
        await queryRunner.query(`ALTER TABLE \`positions\` DROP COLUMN \`fee_amount\``);
    }

}
