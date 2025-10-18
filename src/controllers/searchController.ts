import { Context } from 'telegraf';
import { CategoryService } from '../services/categoryService';
import { BankService } from '../services/bankService';
import { LLMService } from '../services/llmService';
import { AnalyticsService } from '../services/analyticsService';
import { UserService } from '../services/userService';
import { measureTime, escapeMarkdown } from '../utils/helpers';
import { metrics } from '../utils/monitoring';
import { logger } from '../utils/logger';
import { QueryType } from '../types/analytics';

export class SearchController {
  constructor(
    private categoryService: CategoryService,
    private bankService: BankService,
    private llmService: LLMService,
    private analyticsService: AnalyticsService,
    private userService: UserService,
  ) {}

  async handleSearch(ctx: Context) {
    await ctx.reply(
      '🔍 *Поиск кэшбэк категорий*\n\n' +
        'Отправьте запрос в свободной форме, например:\n' +
        '• "какие mcc\\-коды для одежды в Сбере"\n' +
        '• "к какой категории относится код 5722"\n' +
        '• "рестораны Тинькофф"',
      { parse_mode: 'MarkdownV2' },
    );
  }

  async handleTextQuery(ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text;

    // Skip if it's a command
    if (text.startsWith('/')) return;

    try {
      await ctx.sendChatAction('typing');

      const user = await this.userService.getUserByTelegramId(ctx.from.id);
      if (!user) {
        await ctx.reply('Используйте /start для начала работы.');
        return;
      }

      // Parse query with LLM
      const { result: intent, duration: parseDuration } = await measureTime(() =>
        this.llmService.parseQuery(text),
      );

      logger.info('Query intent parsed:', { intent, parseDuration });

      let bank = null;
      if (intent.bankName) {
        bank = await this.bankService.getBankByCode(intent.bankName.toLowerCase());
      }

      let categories;
      let queryType: QueryType;
      let responseTimeMs: number;

      if (intent.queryType === 'mcc_search' && intent.mccCode) {
        // Search by MCC code
        const { result, duration } = await measureTime(() =>
          this.categoryService.findCategoriesByMccCode(intent.mccCode!, bank?.id),
        );
        categories = result;
        queryType = 'mcc_search';
        responseTimeMs = duration;

        await this.sendMccSearchResults(ctx, intent.mccCode, categories);
      } else {
        // Search by category name
        const searchTerm = intent.category || text;
        const { result, duration } = await measureTime(() =>
          this.categoryService.searchCategoriesByName(searchTerm, bank?.id),
        );
        categories = result;
        queryType = 'category_search';
        responseTimeMs = duration;

        await this.sendCategorySearchResults(ctx, searchTerm, categories);
      }

      // Log analytics
      await this.analyticsService.logQuery({
        userId: user.id,
        queryText: text,
        queryType,
        bankName: bank?.name,
        responseTimeMs,
      });

      // Track metrics
      metrics.queriesTotal.inc({ query_type: queryType, status: 'success' });
      metrics.queryDuration.observe({ query_type: queryType }, responseTimeMs / 1000);
    } catch (error) {
      logger.error('Error handling text query:', { error, text, userId: ctx.from.id });
      metrics.queriesTotal.inc({ query_type: 'unknown', status: 'error' });
      throw error;
    }
  }

  private async sendMccSearchResults(ctx: Context, mccCode: string, categories: any[]) {
    if (categories.length === 0) {
      await ctx.reply(
        `❌ MCC-код ${mccCode} не найден в базе данных.\n\n` +
          'Попробуйте другой код или используйте /banks для просмотра доступных банков.',
      );
      return;
    }

    let message = `✅ *MCC\\-код ${mccCode}*\n\n`;

    for (const category of categories) {
      message += `🏦 *${escapeMarkdown(category.bank.name)}*\n`;
      message += `📁 Категория: ${escapeMarkdown(category.name)}\n`;
      if (category.cashbackRate) {
        message += `💰 Кэшбэк: ${escapeMarkdown(category.cashbackRate.toString())}%\n`;
      }
      message += '\n';
    }

    await ctx.replyWithMarkdownV2(message);
  }

  private async sendCategorySearchResults(ctx: Context, searchTerm: string, categories: any[]) {
    if (categories.length === 0) {
      await ctx.reply(
        `❌ Категории по запросу "${searchTerm}" не найдены.\n\n` +
          'Попробуйте изменить запрос или используйте /banks для просмотра доступных банков.',
      );
      return;
    }

    let message = `✅ *Результаты поиска:* "${escapeMarkdown(searchTerm)}"\n\n`;

    // Limit to first 10 results
    const limitedCategories = categories.slice(0, 10);

    for (const category of limitedCategories) {
      message += `🏦 *${escapeMarkdown(category.bank.name)}*\n`;
      message += `📁 ${escapeMarkdown(category.name)}\n`;
      message += `🔢 MCC: ${category.mccCodes.join(', ')}\n`;
      if (category.cashbackRate) {
        message += `💰 Кэшбэк: ${escapeMarkdown(category.cashbackRate.toString())}%\n`;
      }
      message += '\n';
    }

    if (categories.length > 10) {
      message += `\n_\\.\\.\\. и еще ${categories.length - 10} результатов_`;
    }

    await ctx.replyWithMarkdownV2(message);
  }
}
