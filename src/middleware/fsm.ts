import { Context } from 'telegraf';
import { FSMManager } from '../services/fsmService';
import { BotState } from '../types/fsm';
import { logger } from '../utils/logger';

type NextFunction = () => Promise<void>;

/**
 * FSM Middleware для проверки состояний пользователей
 */
export function createFSMMiddleware() {
  return async (ctx: Context, next: NextFunction) => {
    try {
      // Логируем текущее состояние FSM
      const currentState = FSMManager.getState(ctx.session!);
      if (currentState !== BotState.IDLE) {
        logger.debug('FSM State check', {
          userId: ctx.from?.id,
          state: currentState,
          messageType: ctx.message ? 'message' : 'callback',
          text: ctx.message && 'text' in ctx.message ? ctx.message.text : undefined,
        });
      }

      // Проверяем, не истекла ли сессия (например, если пользователь долго не отвечал)
      const sessionData = FSMManager.getData(ctx.session!);
      if (sessionData?.lastActivity) {
        const lastActivity = new Date(sessionData.lastActivity);
        const now = new Date();
        const timeDiff = now.getTime() - lastActivity.getTime();
        
        // Если прошло больше 30 минут, сбрасываем состояние
        if (timeDiff > 30 * 60 * 1000) {
          logger.info('Session expired, resetting FSM', {
            userId: ctx.from?.id,
            state: currentState,
            timeDiffMinutes: Math.round(timeDiff / (60 * 1000)),
          });
          FSMManager.reset(ctx.session!);
        }
      }

      // Обновляем время последней активности
      FSMManager.setData(ctx.session!, 'lastActivity', new Date().toISOString());

      await next();
    } catch (error) {
      logger.error('FSM Middleware error:', error);
      await next();
    }
  };
}

/**
 * Middleware для проверки конкретного состояния
 */
export function requireState(states: BotState | BotState[]) {
  const allowedStates = Array.isArray(states) ? states : [states];
  
  return async (ctx: Context, next: NextFunction) => {
    const currentState = FSMManager.getState(ctx.session!);
    
    if (!allowedStates.includes(currentState)) {
      logger.warn('Invalid FSM state for action', {
        userId: ctx.from?.id,
        currentState,
        allowedStates,
      });
      
      await ctx.reply('❌ Неожиданное действие. Пожалуйста, начните заново.');
      FSMManager.reset(ctx.session!);
      return;
    }
    
    await next();
  };
}

/**
 * Middleware для автоматического сброса состояния при ошибках
 */
export function withFSMErrorHandling() {
  return async (ctx: Context, next: NextFunction) => {
    try {
      await next();
    } catch (error) {
      logger.error('FSM Error occurred:', {
        error,
        userId: ctx.from?.id,
        state: FSMManager.getState(ctx.session!),
      });
      
      // Сбрасываем состояние при ошибке
      FSMManager.reset(ctx.session!);
      
      // Отправляем сообщение об ошибке
      try {
        await ctx.reply('❌ Произошла ошибка. Состояние сброшено. Попробуйте заново.');
      } catch (replyError) {
        logger.error('Failed to send error message:', replyError);
      }
      
      throw error;
    }
  };
}
