import { Context, MiddlewareFn } from 'telegraf';
import { RATE_LIMIT } from '../config/constants';
import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<number, RateLimitEntry>();

export const createRateLimitMiddleware = (): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    if (!ctx.from) {
      return next();
    }

    const userId = ctx.from.id;
    // @ts-ignore
    const subscriptionType = ctx.subscriptionStatus?.type || 'free';
    const limits = RATE_LIMIT[subscriptionType as keyof typeof RATE_LIMIT];

    const now = Date.now();
    let entry = rateLimitStore.get(userId);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + limits.windowMs,
      };
      rateLimitStore.set(userId, entry);
    }

    entry.count++;

    if (entry.count > limits.maxRequests) {
      const remainingMs = entry.resetTime - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      logger.warn('Rate limit exceeded:', { userId, subscriptionType });

      await ctx.reply(
        `⏱ Вы превысили лимит запросов.\n\n` +
          `Попробуйте снова через ${remainingSeconds} секунд.\n\n` +
          `💡 Pro пользователи имеют более высокие лимиты. Используйте /subscription для деталей.`,
      );
      return;
    }

    return next();
  };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + 60000) {
      // Keep for 1 extra minute
      rateLimitStore.delete(userId);
    }
  }
}, 60000); // Run every minute
