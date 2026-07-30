import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCandidacyTables1785434899795 implements MigrationInterface {
    name = 'CreateCandidacyTables1785434899795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`candidacies\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`user_id\` varchar(255) NOT NULL,
                \`election_id\` varchar(255) NOT NULL,
                \`position\` varchar(255) NOT NULL,
                \`photo_url\` varchar(255) NULL,
                \`reviewed_by_id\` varchar(255) NULL,
                \`approved_at\` timestamp NULL,
                \`rejected_at\` timestamp NULL,
                \`code\` varchar(255) NULL,
                UNIQUE INDEX \`uq_candidacy_user_election\` (\`user_id\`, \`election_id\`),
                INDEX \`IDX_candidacies_user_id\` (\`user_id\`),
                INDEX \`IDX_candidacies_election_id\` (\`election_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
            CREATE TABLE \`candidacy_programs\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`candidacy_id\` varchar(255) NOT NULL,
                \`content\` text NOT NULL,
                \`code\` varchar(255) NULL,
                UNIQUE INDEX \`IDX_candidacy_programs_candidacy_id\` (\`candidacy_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
            CREATE TABLE \`campaign_posts\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`candidacy_id\` varchar(255) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`content\` text NOT NULL,
                \`media_url\` varchar(255) NULL,
                \`published_at\` timestamp NULL,
                \`code\` varchar(255) NULL,
                INDEX \`IDX_campaign_posts_candidacy_id\` (\`candidacy_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`campaign_posts\``);
        await queryRunner.query(`DROP TABLE \`candidacy_programs\``);
        await queryRunner.query(`DROP TABLE \`candidacies\``);
    }

}
