import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionsTable1700000000007 implements MigrationInterface {
  name = 'CreateSessionsTable1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        key VARCHAR(255) PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at)
    `);

    await queryRunner.query(`
      COMMENT ON TABLE sessions IS 'Stores Telegram bot user sessions'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN sessions.key IS 'Session key format: user_id:chat_id'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN sessions.data IS 'JSON serialized session data'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN sessions.updated_at IS 'Last session update timestamp'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_updated_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
  }
}
