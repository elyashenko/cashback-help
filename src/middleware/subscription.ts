import { Context, MiddlewareFn } from 'telegraf';
import { SubscriptionService } from '../services/subscriptionService';
import { logger } from '../utils/logger';

export const createSubscriptionMiddleware = (
  subscriptionService: SubscriptionService,
): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    if (!ctx.from) {
      return next();
    }

    try {
      const userId = ctx.from.id;

      // Attach subscription status to context for use in handlers
      const status = await subscriptionService.getSubscriptionStatus(userId);

      // @ts-ignore - extending context
      ctx.subscriptionStatus = status;

      return next();
    } catch (error) {
      logger.error('Error in subscription middleware:', { error, userId: ctx.from?.id });
      // Set default free subscription if user not found
      // @ts-ignore
      ctx.subscriptionStatus = {
        type: 'free',
        isActive: true,
        limits: { maxBanks: 4, maxCategoriesPerBank: 4 },
      };
      return next();
    }
  };
};

export const requireProSubscription: MiddlewareFn<Context> = async (ctx, next) => {
  // @ts-ignore
  const status = ctx.subscriptionStatus;

  if (!status || status.type !== 'pro' || !status.isActive) {
    await ctx.reply(
      '⚠️ Эта функция доступна только для Pro подписчиков.\n\n' +
        'Используйте команду /subscription для получения дополнительной информации.',
    );
    return;
  }

  return next();
};
