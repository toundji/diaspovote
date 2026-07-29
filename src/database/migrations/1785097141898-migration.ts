import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785097141898 implements MigrationInterface {
    name = 'Migration1785097141898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`img_prof\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`image_profile\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`image_profile\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`img_prof\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`img_prof\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`image_profile\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`image_profile\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`img_prof\` varchar(255) NULL`);
    }

}
