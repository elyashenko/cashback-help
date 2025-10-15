import { Context, MiddlewareFn } from 'telegraf';
import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger';
import { metrics } from '../utils/monitoring';

export const errorHandler: MiddlewareFn<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (error: any) {
    logger.error('Bot error:', {
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      error: error.message,
      stack: error.stack,
      update: ctx.update,
    });

    // Track error metrics
    metrics.errorsTotal.inc({ type: error.name || 'UnknownError' });

    // Send to Sentry if configured
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        user: {
          id: ctx.from?.id?.toString(),
          username: ctx.from?.username,
        },
        extra: {
          chatId: ctx.chat?.id,
          updateType: ctx.updateType,
        },
      });
    }

    // Send user-friendly error message
    try {
      await ctx.reply(
        '❌ Произошла ошибка при обработке вашего запроса.\n\n' +
          'Пожалуйста, попробуйте позже или обратитесь в поддержку.',
      );
    } catch (replyError) {
      logger.error('Failed to send error message to user:', { replyError });
    }
  }
};

