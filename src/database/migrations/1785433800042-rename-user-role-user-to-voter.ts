import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UserRole.user -> UserRole.voter (aligné sur le diagramme de classe DiaspoVote).
 * MySQL SET : on ajoute d'abord 'voter' à la liste, on migre les lignes existantes,
 * puis on retire 'user' de la liste des valeurs possibles.
 */
export class RenameUserRoleUserToVoter1785433800042 implements MigrationInterface {
    name = 'RenameUserRoleUserToVoter1785433800042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY COLUMN \`roles\` SET('user','voter','candidate','admin','commission') NOT NULL DEFAULT 'voter'`);
        await queryRunner.query(`UPDATE \`users\` SET \`roles\` = REPLACE(\`roles\`, 'user', 'voter') WHERE FIND_IN_SET('user', \`roles\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY COLUMN \`roles\` SET('voter','candidate','admin','commission') NOT NULL DEFAULT 'voter'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY COLUMN \`roles\` SET('voter','user','candidate','admin','commission') NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`UPDATE \`users\` SET \`roles\` = REPLACE(\`roles\`, 'voter', 'user') WHERE FIND_IN_SET('voter', \`roles\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` MODIFY COLUMN \`roles\` SET('user','candidate','admin','commission') NOT NULL DEFAULT 'user'`);
    }

}
