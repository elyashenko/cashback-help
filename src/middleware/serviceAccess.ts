import { Context, NextFunction } from 'telegraf';
import { AdminSettingsService } from '../services/adminSettingsService';
import { ServiceType } from '../database/entities/AdminSettings';
import { logger } from '../utils/logger';

/**
 * Middleware для проверки доступности сервисов
 */
export function createServiceAccessMiddleware(adminSettingsService: AdminSettingsService) {
  return async (ctx: Context, next: NextFunction) => {
    if (!ctx.from) {
      return next();
    }

    try {
      // Определяем тип сервиса на основе команды или контекста
      const serviceType = getServiceTypeFromContext(ctx);
      
      if (!serviceType) {
        // Если не удалось определить сервис, пропускаем проверку
        return next();
      }

      // Проверяем доступность сервиса для пользователя
      const isEnabled = await adminSettingsService.isServiceEnabledForUser(ctx.from.id, serviceType);
      
      if (!isEnabled) {
        await ctx.reply(
          '🚫 *Сервис временно недоступен*\n\n' +
          'Данная функция временно отключена администратором.\n' +
          'Попробуйте позже или обратитесь в поддержку.',
          { parse_mode: 'Markdown' }
        );
        
        logger.info('Service access denied', {
          userId: ctx.from.id,
          username: ctx.from.username,
          serviceType,
          command: ctx.message && 'text' in ctx.message ? ctx.message.text : 'unknown',
        });
        
        return; // Не вызываем next(), блокируем выполнение
      }

      // Сервис доступен, продолжаем выполнение
      return next();
    } catch (error) {
      logger.error('Error in service access middleware:', {
        error,
        userId: ctx.from.id,
        username: ctx.from.username,
      });
      
      // В случае ошибки разрешаем доступ (fail-open)
      return next();
    }
  };
}

/**
 * Определяет тип сервиса на основе контекста
 */
function getServiceTypeFromContext(ctx: Context): ServiceType | null {
  // Проверяем команды
  if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    
    if (text.startsWith('/set_cashback')) {
      return ServiceType.SET_CASHBACK;
    }
    if (text.startsWith('/my_cashback')) {
      return ServiceType.MY_CASHBACK;
    }
    if (text.startsWith('/remove_cashback')) {
      return ServiceType.REMOVE_CASHBACK;
    }
    if (text.startsWith('/search')) {
      return ServiceType.SEARCH;
    }
    if (text.startsWith('/favorites')) {
      return ServiceType.FAVORITES;
    }
    if (text.startsWith('/subscription')) {
      return ServiceType.SUBSCRIPTION;
    }
    if (text.startsWith('/stats')) {
      return ServiceType.STATS;
    }
    if (text.startsWith('/banks')) {
      return ServiceType.BANKS;
    }
  }

  // Проверяем callback queries для cashback функций
  if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('select_bank:') || 
        data.startsWith('toggle_category:') || 
        data.startsWith('confirm_categories') ||
        data.startsWith('remove_cashback:')) {
      return ServiceType.SET_CASHBACK;
    }
    
    if (data.startsWith('fav_')) {
      return ServiceType.FAVORITES;
    }
    
    if (data === 'buy_pro') {
      return ServiceType.SUBSCRIPTION;
    }
  }

  // Проверяем сессию для определения контекста
  const session = ctx.session;
  if (session) {
    // Если пользователь находится в процессе настройки кэшбэка
    if (session.cashback?.waitingForRates || 
        session.cashback?.selectedBank || 
        session.cashback?.selectedCategories) {
      return ServiceType.SET_CASHBACK;
    }
    
    // Если пользователь находится в процессе работы с избранным
    if (session.favorites?.waitingForCashbackRate ||
        session.favorites?.selectedBank) {
      return ServiceType.FAVORITES;
    }
  }

  return null;
}

/**
 * Middleware для проверки доступа к админским функциям
 */
export function createAdminAccessMiddleware(adminSettingsService: AdminSettingsService) {
  return async (ctx: Context, next: NextFunction) => {
    if (!ctx.from) {
      return next();
    }

    try {
      const isAdmin = adminSettingsService.isAdmin(ctx.from.id);
      
      if (!isAdmin) {
        await ctx.reply('⛔️ У вас нет доступа к этой команде.');
        
        logger.warn('Admin access denied', {
          userId: ctx.from.id,
          username: ctx.from.username,
          command: ctx.message && 'text' in ctx.message ? ctx.message.text : 'unknown',
        });
        
        return; // Блокируем выполнение
      }

      return next();
    } catch (error) {
      logger.error('Error in admin access middleware:', {
        error,
        userId: ctx.from.id,
        username: ctx.from.username,
      });
      
      await ctx.reply('❌ Произошла ошибка при проверке доступа.');
      return;
    }
  };
}
