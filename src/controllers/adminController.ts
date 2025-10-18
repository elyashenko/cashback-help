import { Context } from 'telegraf';
import { CategoryService } from '../services/categoryService';
import { PDFService } from '../services/pdfService';
import { AnalyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';

export class AdminController {
  private adminUserIds: Set<number>;

  constructor(
    private categoryService: CategoryService,
    private pdfService: PDFService,
    private analyticsService: AnalyticsService,
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
}
