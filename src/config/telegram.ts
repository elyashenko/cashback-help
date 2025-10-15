import { Telegraf } from 'telegraf';
import { logger } from '../utils/logger';

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required');
}

export const bot = new Telegraf(process.env.BOT_TOKEN);

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

