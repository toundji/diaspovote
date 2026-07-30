import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDiasporaFields1785433800041 implements MigrationInterface {
    name = 'AddUserDiasporaFields1785433800041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`jurisdiction_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`pin_code\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`pin_code\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`jurisdiction_id\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phone\``);
    }

}
