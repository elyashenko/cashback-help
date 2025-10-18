import { Context, MiddlewareFn } from 'telegraf';
import { metrics } from '../utils/monitoring';
import { logger } from '../utils/logger';

export const createAnalyticsMiddleware = (): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    const startTime = Date.now();

    try {
      await next();

      const duration = Date.now() - startTime;

      // Track metrics
      if (ctx.from) {
        metrics.activeUsers.inc();
      }

      logger.debug('Request processed:', {
        userId: ctx.from?.id,
        updateType: ctx.updateType,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Error in analytics middleware:', {
        error,
        userId: ctx.from?.id,
        duration,
      });

      throw error;
    }
  };
};
