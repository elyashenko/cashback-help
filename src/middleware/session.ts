import { Context, MiddlewareFn } from 'telegraf';
import { BotSession } from '../types/session';
import { logger } from '../utils/logger';

export const createSessionMiddleware = (): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    // Инициализируем сессию, если её нет
    if (!ctx.session) {
      ctx.session = {} as BotSession;
      logger.debug('Session initialized', { userId: ctx.from?.id });
    }
    
    return next();
  };
};
