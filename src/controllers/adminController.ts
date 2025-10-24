import { Context, Markup } from 'telegraf';
import { CategoryService } from '../services/categoryService';
import { PDFService } from '../services/pdfService';
import { AnalyticsService } from '../services/analyticsService';
import { AdminSettingsService } from '../services/adminSettingsService';
import { ServiceType } from '../database/entities/AdminSettings';
import { logger } from '../utils/logger';
import { escapeMarkdown } from '../utils/helpers';

export class AdminController {
  private adminUserIds: Set<number>;

  constructor(
    private categoryService: CategoryService,
    private pdfService: PDFService,
    private analyticsService: AnalyticsService,
    private adminSettingsService: AdminSettingsService,
  ) {
    // Parse admin user IDs from environment
    const adminIds =
      process.env.ADMIN_USER_IDS?.split(',').map((id) => parseInt(id.trim(), 10)) || [];
    this.adminUserIds = new Set(adminIds);
  }

  private isAdmin(userId: number): boolean {
    return this.adminUserIds.has(userId);
  }

  async handleAdminAddBank(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.reply('⛔️ У вас нет доступа к этой команде.');
      return;
    }

    await ctx.reply(
      '🏦 *Добавление банка*\n\n' +
        'Отправьте информацию в формате:\n' +
        '```\nНазвание банка\nКод банка\nURL логотипа (опционально)\n```',
      { parse_mode: 'MarkdownV2' },
    );
  }

  async handleAdminParsePDF(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.reply('⛔️ У вас нет доступа к этой команде.');
      return;
    }

    await ctx.reply(
      '📄 *Парсинг PDF*\n\n' +
        'Отправьте PDF файл с таблицей категорий кэшбэка.\n' +
        'Формат должен содержать названия категорий и соответствующие MCC\\-коды\\.',
      { parse_mode: 'MarkdownV2' },
    );
  }

  async handlePDFDocument(ctx: Context, bankId: number) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.reply('⛔️ У вас нет доступа к этой функции.');
      return;
    }

    try {
      if (!ctx.message || !('document' in ctx.message)) {
        await ctx.reply('❌ Пожалуйста, отправьте PDF файл.');
        return;
      }

      const document = ctx.message.document;
      if (!document.mime_type?.includes('pdf')) {
        await ctx.reply('❌ Файл должен быть в формате PDF.');
        return;
      }

      await ctx.reply('⏳ Обработка PDF файла...');

      // Download file
      const fileLink = await ctx.telegram.getFileLink(document.file_id);
      const response = await fetch(fileLink.href);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Parse PDF
      const categories = await this.pdfService.parsePDF(buffer);

      if (!this.pdfService.validateCategories(categories)) {
        await ctx.reply('❌ Ошибка: некорректный формат данных в PDF.');
        return;
      }

      // Replace bank categories
      const created = await this.categoryService.replaceBankCategories(bankId, categories);

      await ctx.reply(
        `✅ PDF успешно обработан!\n\n` +
          `Загружено категорий: ${created.length}\n` +
          `Всего MCC-кодов: ${created.reduce((sum, cat) => sum + cat.mccCodes.length, 0)}`,
      );

      logger.info('PDF parsed and categories created:', {
        bankId,
        categoriesCount: created.length,
        userId: ctx.from.id,
      });
    } catch (error) {
      logger.error('Error parsing PDF:', { error, userId: ctx.from.id });
      await ctx.reply('❌ Произошла ошибка при обработке PDF. Проверьте формат файла.');
    }
  }

  async handleAdminStats(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.reply('⛔️ У вас нет доступа к этой команде.');
      return;
    }

    try {
      const stats = await this.analyticsService.getAdminStats();

      let message = '📊 *Статистика бота:*\n\n';
      message += `👥 Всего пользователей: ${stats.totalUsers}\n`;
      message += `✅ Активных за неделю: ${stats.activeUsers}\n`;
      message += `✨ Pro подписчиков: ${stats.proUsers}\n\n`;
      message += `🔍 Всего запросов: ${stats.totalQueries}\n`;
      message += `⚡️ Среднее время ответа: ${Math.round(stats.averageResponseTime)}ms\n\n`;

      if (stats.popularBanks.length > 0) {
        message += `🏦 *Популярные банки:*\n`;
        for (const bank of stats.popularBanks.slice(0, 5)) {
          message += `• ${bank.name}: ${bank.count} запросов\n`;
        }
      }

      await ctx.replyWithMarkdownV2(message);
    } catch (error) {
      logger.error('Error in handleAdminStats:', { error, userId: ctx.from.id });
      throw error;
    }
  }

  /**
   * Команда: /admin_services
   * Управление сервисами
   */
  async handleAdminServices(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.reply('⛔️ У вас нет доступа к этой команде.');
      return;
    }

    try {
      const services = this.adminSettingsService.getAvailableServices();
      const keyboard = services.map(service => [
        Markup.button.callback(
          `${service.name}`,
          `admin_service:${service.type}`,
        ),
      ]);

      keyboard.push([
        Markup.button.callback('📊 Статус всех сервисов', 'admin_status_all'),
        Markup.button.callback('🔄 Сбросить настройки', 'admin_reset_settings'),
      ]);

      await ctx.reply(
        '⚙️ *Управление сервисами*\n\n' +
        'Выберите сервис для настройки:',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );
    } catch (error) {
      logger.error('Error in handleAdminServices:', { error, userId: ctx.from.id });
      await ctx.reply('❌ Произошла ошибка.');
    }
  }

  /**
   * Обработка выбора сервиса для настройки
   */
  async handleServiceSelection(ctx: Context, serviceType: ServiceType) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      const services = this.adminSettingsService.getAvailableServices();
      const service = services.find(s => s.type === serviceType);
      
      if (!service) {
        await ctx.answerCbQuery('❌ Сервис не найден');
        return;
      }

      const isEnabled = await this.adminSettingsService.isServiceEnabledForUser(ctx.from.id, serviceType);
      
      const keyboard = [
        [
          Markup.button.callback(
            `${isEnabled ? '🔴 Отключить глобально' : '🟢 Включить глобально'}`,
            `admin_toggle_global:${serviceType}`,
          ),
        ],
        [
          Markup.button.callback(
            '👤 Настройки для пользователя',
            `admin_user_settings:${serviceType}`,
          ),
        ],
        [
          Markup.button.callback('⬅️ Назад к списку', 'admin_services'),
        ],
      ];

      await ctx.editMessageText(
        `⚙️ *${escapeMarkdown(service.name)}*\n\n` +
        `📝 ${escapeMarkdown(service.description)}\n\n` +
        `🌍 Глобальный статус: ${isEnabled ? '🟢 Включен' : '🔴 Отключен'}\n\n` +
        `Выберите действие:`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );
    } catch (error) {
      logger.error('Error in handleServiceSelection:', { error, userId: ctx.from.id, serviceType });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Переключение глобального статуса сервиса
   */
  async handleToggleGlobalService(ctx: Context, serviceType: ServiceType) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      const currentStatus = await this.adminSettingsService.isServiceEnabledForUser(ctx.from.id, serviceType);
      const newStatus = !currentStatus;
      
      await this.adminSettingsService.toggleGlobalService(
        serviceType,
        newStatus,
        `Изменено админом ${ctx.from.username || ctx.from.id}`
      );

      const services = this.adminSettingsService.getAvailableServices();
      const service = services.find(s => s.type === serviceType);

      await ctx.editMessageText(
        `✅ *${escapeMarkdown(service?.name || 'Сервис')}*\n\n` +
        `Статус изменен на: ${newStatus ? '🟢 Включен' : '🔴 Отключен'}\n\n` +
        `Это изменение влияет на всех пользователей.`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад к сервису', `admin_service:${serviceType}`)],
            [Markup.button.callback('📋 Все сервисы', 'admin_services')],
          ]).reply_markup,
        },
      );

      logger.info('Global service toggled', {
        adminId: ctx.from.id,
        serviceType,
        newStatus,
      });
    } catch (error) {
      logger.error('Error in handleToggleGlobalService:', { error, userId: ctx.from.id, serviceType });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Настройки сервиса для конкретного пользователя
   */
  async handleUserServiceSettings(ctx: Context, serviceType: ServiceType) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      const services = this.adminSettingsService.getAvailableServices();
      const service = services.find(s => s.type === serviceType);

      await ctx.editMessageText(
        `👤 *Настройки для пользователя*\n\n` +
        `Сервис: ${escapeMarkdown(service?.name || 'Неизвестный')}\n\n` +
        `Отправьте Telegram ID пользователя для настройки индивидуальных параметров.\n\n` +
        `*Пример:* 123456789`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад к сервису', `admin_service:${serviceType}`)],
          ]).reply_markup,
        },
      );

      // Устанавливаем состояние ожидания ввода пользователя
      ctx.session = ctx.session || {};
      ctx.session.admin = ctx.session.admin || {};
      ctx.session.admin.waitingForUserId = serviceType;
    } catch (error) {
      logger.error('Error in handleUserServiceSettings:', { error, userId: ctx.from.id, serviceType });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Обработка ввода пользователя для индивидуальных настроек
   */
  async handleUserIdInput(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      return;
    }

    const session = ctx.session;
    const adminSession = session?.admin;
    
    if (!adminSession?.waitingForUserId || !ctx.message || !('text' in ctx.message)) {
      return;
    }

    try {
      const userId = parseInt(ctx.message.text.trim());
      
      if (isNaN(userId)) {
        await ctx.reply('❌ Неверный формат ID. Введите числовой Telegram ID.');
        return;
      }

      const serviceType = adminSession.waitingForUserId;
      const services = this.adminSettingsService.getAvailableServices();
      const service = services.find(s => s.type === serviceType);
      
      const isEnabled = await this.adminSettingsService.isServiceEnabledForUser(userId, serviceType);
      
      const keyboard = [
        [
          Markup.button.callback(
            `${isEnabled ? '🔴 Отключить для пользователя' : '🟢 Включить для пользователя'}`,
            `admin_toggle_user:${serviceType}:${userId}`,
          ),
        ],
        [
          Markup.button.callback(
            '🗑 Удалить индивидуальную настройку',
            `admin_remove_user:${serviceType}:${userId}`,
          ),
        ],
        [
          Markup.button.callback('⬅️ Назад к сервису', `admin_service:${serviceType}`),
        ],
      ];

      await ctx.reply(
        `👤 *Настройки для пользователя ${userId}*\n\n` +
        `Сервис: ${escapeMarkdown(service?.name || 'Неизвестный')}\n` +
        `Текущий статус: ${isEnabled ? '🟢 Включен' : '🔴 Отключен'}\n\n` +
        `Выберите действие:`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );

      // Очищаем состояние ожидания
      adminSession.waitingForUserId = undefined;
    } catch (error) {
      logger.error('Error in handleUserIdInput:', { error, userId: ctx.from.id });
      await ctx.reply('❌ Произошла ошибка при обработке ID пользователя.');
    }
  }

  /**
   * Переключение статуса сервиса для пользователя
   */
  async handleToggleUserService(ctx: Context, serviceType: ServiceType, targetUserId: number) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      const currentStatus = await this.adminSettingsService.isServiceEnabledForUser(targetUserId, serviceType);
      const newStatus = !currentStatus;
      
      await this.adminSettingsService.toggleUserService(
        targetUserId,
        serviceType,
        newStatus,
        `Настроено админом ${ctx.from.username || ctx.from.id}`
      );

      const services = this.adminSettingsService.getAvailableServices();
      const service = services.find(s => s.type === serviceType);

      await ctx.editMessageText(
        `✅ *Настройка для пользователя ${targetUserId}*\n\n` +
        `Сервис: ${escapeMarkdown(service?.name || 'Неизвестный')}\n` +
        `Статус изменен на: ${newStatus ? '🟢 Включен' : '🔴 Отключен'}\n\n` +
        `Эта настройка переопределяет глобальную.`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад к сервису', `admin_service:${serviceType}`)],
          ]).reply_markup,
        },
      );

      logger.info('User service toggled', {
        adminId: ctx.from.id,
        targetUserId,
        serviceType,
        newStatus,
      });
    } catch (error) {
      logger.error('Error in handleToggleUserService:', { error, userId: ctx.from.id, serviceType, targetUserId });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Удаление индивидуальной настройки пользователя
   */
  async handleRemoveUserSetting(ctx: Context, serviceType: ServiceType, targetUserId: number) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      await this.adminSettingsService.removeUserSetting(targetUserId, serviceType);

      const services = this.adminSettingsService.getAvailableServices();
      const service = services.find(s => s.type === serviceType);

      await ctx.editMessageText(
        `✅ *Индивидуальная настройка удалена*\n\n` +
        `Пользователь: ${targetUserId}\n` +
        `Сервис: ${escapeMarkdown(service?.name || 'Неизвестный')}\n\n` +
        `Теперь для этого пользователя действует глобальная настройка.`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад к сервису', `admin_service:${serviceType}`)],
          ]).reply_markup,
        },
      );

      logger.info('User setting removed', {
        adminId: ctx.from.id,
        targetUserId,
        serviceType,
      });
    } catch (error) {
      logger.error('Error in handleRemoveUserSetting:', { error, userId: ctx.from.id, serviceType, targetUserId });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Показать статус всех сервисов
   */
  async handleStatusAllServices(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      const services = this.adminSettingsService.getAvailableServices();
      let message = '📊 *Статус всех сервисов:*\n\n';

      for (const service of services) {
        const isEnabled = await this.adminSettingsService.isServiceEnabledForUser(ctx.from.id, service.type);
        message += `${isEnabled ? '🟢' : '🔴'} ${escapeMarkdown(service.name)}\n`;
      }

      message += '\n🟢 - Включен\n🔴 - Отключен';

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('⬅️ Назад к управлению', 'admin_services')],
        ]).reply_markup,
      });
    } catch (error) {
      logger.error('Error in handleStatusAllServices:', { error, userId: ctx.from.id });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Сброс настроек к значениям по умолчанию
   */
  async handleResetSettings(ctx: Context) {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.answerCbQuery('⛔️ Нет доступа');
      return;
    }

    try {
      await this.adminSettingsService.initializeDefaultSettings();

      await ctx.editMessageText(
        '✅ *Настройки сброшены*\n\n' +
        'Все сервисы включены по умолчанию.\n' +
        'Индивидуальные настройки пользователей сохранены.',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад к управлению', 'admin_services')],
          ]).reply_markup,
        },
      );

      logger.info('Settings reset', { adminId: ctx.from.id });
    } catch (error) {
      logger.error('Error in handleResetSettings:', { error, userId: ctx.from.id });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }
}
