import { Telegraf, session } from 'telegraf';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { Database } from '../types/database';

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const bot = new Telegraf(process.env.BOT_TOKEN);

// Создаем Kysely instance для PostgreSQL
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }),
  }),
});

// Настройка сессий с PostgreSQL storage
bot.use(
  session({
    defaultSession: () => ({}),
    getSessionKey: (ctx) => {
      if (ctx.from && ctx.chat) {
        return `${ctx.from.id}:${ctx.chat.id}`;
      }
      return undefined;
    },
    store: {
      get: async (key: string) => {
        try {
          const result = await db
            .selectFrom('sessions')
            .select('data')
            .where('key', '=', key)
            .executeTakeFirst();
          
          return result ? JSON.parse(result.data) : undefined;
        } catch (error) {
          logger.error('Failed to get session:', error);
          return undefined;
        }
      },
      set: async (key: string, data: any) => {
        try {
          await db
            .insertInto('sessions')
            .values({
              key,
              data: JSON.stringify(data),
              updated_at: new Date(),
            })
            .onConflict((oc) => oc.column('key').doUpdateSet({
              data: JSON.stringify(data),
              updated_at: new Date(),
            }))
            .execute();
        } catch (error) {
          logger.error('Failed to set session:', error);
        }
      },
      delete: async (key: string) => {
        try {
          await db
            .deleteFrom('sessions')
            .where('key', '=', key)
            .execute();
        } catch (error) {
          logger.error('Failed to delete session:', error);
        }
      },
    },
  }),
);

export const startBot = async () => {
  try {
    const mode = process.env.BOT_MODE || 'polling';

    if (mode === 'webhook') {
      if (!process.env.WEBHOOK_URL) {
        throw new Error('WEBHOOK_URL is required for webhook mode');
      }
      await bot.telegram.setWebhook(process.env.WEBHOOK_URL);
      logger.info(`Bot started in webhook mode: ${process.env.WEBHOOK_URL}`);
    } else {
      await bot.launch();
      logger.info('Bot started in polling mode');
    }
  } catch (error) {
    logger.error('Failed to start bot:', error);
    throw error;
  }
};

export const stopBot = async () => {
  await bot.stop('SIGINT');
  logger.info('Bot stopped');
};

// Enable graceful stop
process.once('SIGINT', () => stopBot());
process.once('SIGTERM', () => stopBot());
