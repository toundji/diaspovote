import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOversightTables1785439067632 implements MigrationInterface {
    name = 'CreateOversightTables1785439067632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`action_categories\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`label\` varchar(255) NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`code\` varchar(255) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
            CREATE TABLE \`achievements\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`candidacy_id\` varchar(255) NOT NULL,
                \`category_id\` varchar(255) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`proof_url\` varchar(255) NULL,
                \`proof_snapshot\` text NULL,
                \`reviewed_by_id\` varchar(255) NULL,
                \`approved_at\` timestamp NULL,
                \`rejected_at\` timestamp NULL,
                \`code\` varchar(255) NULL,
                INDEX \`IDX_achievements_candidacy_id\` (\`candidacy_id\`),
                INDEX \`IDX_achievements_category_id\` (\`category_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
            CREATE TABLE \`contestations\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`achievement_id\` varchar(255) NOT NULL,
                \`reporter_id\` varchar(255) NOT NULL,
                \`reason\` text NOT NULL,
                \`resolved_by_id\` varchar(255) NULL,
                \`resolved_at\` timestamp NULL,
                \`code\` varchar(255) NULL,
                INDEX \`IDX_contestations_achievement_id\` (\`achievement_id\`),
                INDEX \`IDX_contestations_reporter_id\` (\`reporter_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
            CREATE TABLE \`questions\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`candidacy_id\` varchar(255) NOT NULL,
                \`author_id\` varchar(255) NOT NULL,
                \`content\` text NOT NULL,
                \`answer\` text NULL,
                \`answered_at\` timestamp NULL,
                \`hidden_at\` timestamp NULL,
                \`code\` varchar(255) NULL,
                INDEX \`IDX_questions_candidacy_id\` (\`candidacy_id\`),
                INDEX \`IDX_questions_author_id\` (\`author_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
            CREATE TABLE \`audit_logs\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`created_by\` varchar(255) NULL,
                \`updated_by\` varchar(255) NULL,
                \`deleted_at\` timestamp NULL DEFAULT NULL,
                \`actor_id\` varchar(255) NOT NULL,
                \`action\` varchar(255) NOT NULL,
                \`entity_type\` varchar(255) NOT NULL,
                \`entity_id\` varchar(255) NOT NULL,
                \`details\` text NULL,
                INDEX \`IDX_audit_logs_actor_id\` (\`actor_id\`),
                INDEX \`IDX_audit_logs_entity_type\` (\`entity_type\`),
                INDEX \`IDX_audit_logs_entity_id\` (\`entity_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`questions\``);
        await queryRunner.query(`DROP TABLE \`contestations\``);
        await queryRunner.query(`DROP TABLE \`achievements\``);
        await queryRunner.query(`DROP TABLE \`action_categories\``);
    }

}
