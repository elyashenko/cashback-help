import { Context } from 'telegraf';
import { UserService } from '../services/userService';
import { BankService } from '../services/bankService';
import { AnalyticsService } from '../services/analyticsService';
import { escapeMarkdown } from '../utils/helpers';
import { logger } from '../utils/logger';

export class BotController {
  constructor(
    private userService: UserService,
    private bankService: BankService,
    private analyticsService: AnalyticsService,
  ) {}

  async handleStart(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const welcomeMessage =
        `👋 Добро пожаловать в Cashback-Help Bot!\n\n` +
        `Я помогу вам:\n` +
        `🔍 Найти MCC-коды по категориям товаров/услуг\n` +
        `🏦 Определить категорию кэшбэка по MCC-коду\n` +
        `⭐️ Сохранять избранные категории для быстрого доступа\n` +
        `💰 Устанавливать персональные проценты кэшбэка\n\n` +
        `📊 Ваш тариф: ${user.subscriptionType === 'pro' ? 'Pro ✨' : 'Free'}\n\n` +
        `Используйте /help для просмотра всех команд.`;

      await ctx.reply(welcomeMessage);

      logger.info('User started bot:', { userId: user.id, telegramId: ctx.from.id });
    } catch (error) {
      logger.error('Error in handleStart:', { error, userId: ctx.from.id });
      throw error;
    }
  }

  async handleHelp(ctx: Context) {
    const helpMessage =
      `📖 *Список команд:*\n\n` +
      `🔍 *Поиск*\n` +
      `/search \\- Начать поиск по категории или MCC\\-коду\n` +
      `Или просто отправьте запрос текстом:\n` +
      `• "какие mcc\\-коды для одежды в Сбере"\n` +
      `• "к какой категории относится код 5722"\n\n` +
      `🏦 *Банки и избранное*\n` +
      `/banks \\- Список доступных банков\n` +
      `/favorites \\- Управление избранными категориями\n\n` +
      `💰 *Кэшбэк*\n` +
      `/set\\_cashback \\- Установить процент кэшбэка для категории\n` +
      `/my\\_cashback \\- Показать мои настройки кэшбэка\n` +
      `/remove\\_cashback \\- Удалить настройку кэшбэка\n\n` +
      `💳 *Подписка*\n` +
      `/subscription \\- Информация о подписке\n` +
      `/stats \\- Ваша статистика использования\n\n` +
      `❓ /help \\- Показать эту справку`;

    await ctx.replyWithMarkdownV2(helpMessage);
  }

  async handleBanks(ctx: Context) {
    try {
      const banks = await this.bankService.getAllBanks();

      if (banks.length === 0) {
        await ctx.reply('Банки пока не добавлены.');
        return;
      }

      let message = '🏦 *Доступные банки:*\n\n';

      for (const bank of banks) {
        message += `• ${escapeMarkdown(bank.name)}\n`;
      }

      await ctx.replyWithMarkdownV2(message);
    } catch (error) {
      logger.error('Error in handleBanks:', { error });
      throw error;
    }
  }

  async handleStats(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getUserByTelegramId(ctx.from.id);
      if (!user) {
        await ctx.reply('Пользователь не найден. Используйте /start для регистрации.');
        return;
      }

      const stats = await this.analyticsService.getUserStats(user.id);

      const message =
        `📊 *Ваша статистика:*\n\n` +
        `Всего запросов: ${stats.totalQueries}\n` +
        `• Поиск по категориям: ${stats.queriesByType.category_search}\n` +
        `• Поиск по MCC\\-кодам: ${stats.queriesByType.mcc_search}\n` +
        `• Просмотр избранного: ${stats.queriesByType.favorite_view}\n\n` +
        `⭐️ Избранных категорий: ${stats.favoriteCategories}\n` +
        `💳 Тариф: ${stats.subscriptionType === 'pro' ? 'Pro ✨' : 'Free'}`;

      await ctx.replyWithMarkdownV2(message);
    } catch (error) {
      logger.error('Error in handleStats:', { error, userId: ctx.from.id });
      throw error;
    }
  }
}
