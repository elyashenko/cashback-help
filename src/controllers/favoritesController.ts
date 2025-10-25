import { Context, Markup } from 'telegraf';
import { FavoriteRepository } from '../database/repositories/FavoriteRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { BankService } from '../services/bankService';
import { SubscriptionService } from '../services/subscriptionService';
import { UserService } from '../services/userService';
import { escapeMarkdown } from '../utils/helpers';
import { logger } from '../utils/logger';

interface FavoritesSession {
  selectedBank?: string;
  searchQuery?: string;
  waitingForCashbackRate?: boolean;
  selectedCategory?: number;
}

export class FavoritesController {
  constructor(
    private favoriteRepository: FavoriteRepository,
    private categoryRepository: CategoryRepository,
    private bankService: BankService,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
  ) {}

  /**
   * Команда: /favorites
   * Главное меню управления избранными категориями
   */
  async handleFavorites(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const favorites = await this.favoriteRepository.findByUserId(user.id);

      if (favorites.length === 0) {
        const keyboard = [[Markup.button.callback('➕ Добавить категории', 'favorites_add')]];

        await ctx.reply(
          '⭐️ У вас пока нет избранных категорий.\n\n' +
            'Добавьте категории для быстрого доступа к MCC-кодам.',
          {
            reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
          },
        );
        return;
      }

      // Группируем по банкам
      const byBank = new Map<number, any[]>();
      for (const fav of favorites) {
        if (!byBank.has(fav.bankId)) {
          byBank.set(fav.bankId, []);
        }
        byBank.get(fav.bankId)!.push(fav);
      }

      let message = '⭐️ Избранные категории:\n\n';

      for (const [bankId, favs] of byBank) {
        const bank = await this.bankService.getBankById(bankId);
        if (!bank) continue;

        message += `🏦 ${escapeMarkdown(bank.name)}:\n`;

        for (const fav of favs) {
          const cashbackText = fav.cashbackRate ? ` (${fav.cashbackRate}%)` : '';
          message += `• ${escapeMarkdown(fav.category.name)}${cashbackText}\n`;
        }
        message += '\n';
      }

      // Показываем лимиты для Free пользователей
      const status = await this.subscriptionService.getSubscriptionStatus(ctx.from.id);
      if (status.type === 'free') {
        const bankCount = byBank.size;
        message += `📊 Использовано банков: ${bankCount}/${status.limits.maxBanks}\n`;
      }

      const keyboard = [
        [Markup.button.callback('➕ Добавить категории', 'favorites_add')],
        [Markup.button.callback('🗑 Удалить категории', 'favorites_remove')],
      ];

      await ctx.reply(message, {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      });
    } catch (error) {
      logger.error('Error in handleFavorites:', { error, telegramId: ctx.from.id });
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка добавления избранных категорий
   */
  async handleAddFavorites(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      // Проверяем лимиты подписки
      const status = await this.subscriptionService.getSubscriptionStatus(ctx.from.id);
      const bankCount = await this.favoriteRepository.getBankIdsForUser(user.id);

      if (status.type === 'free' && bankCount.length >= status.limits.maxBanks) {
        await ctx.editMessageText(
          '⚠️ Достигнут лимит банков для Free тарифа.\n\n' +
            'Оформите Pro подписку для безлимитного использования:\n' +
            '/subscription',
        );
        return;
      }

      const banks = await this.bankService.getActiveBanks();
      const keyboard = banks.map((bank: any) => [
        Markup.button.callback(bank.name, `fav_select_bank:${bank.code}`),
      ]);

      await ctx.editMessageText('🏦 Выберите банк для добавления категорий:', {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      });
    } catch (error) {
      logger.error('Error in handleAddFavorites:', { error, telegramId: ctx.from.id });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка выбора банка для добавления категорий
   */
  async handleSelectBank(ctx: Context, bankCode: string) {
    if (!ctx.from) return;

    try {
      const bank = await this.bankService.getBankByCode(bankCode);
      if (!bank) {
        await ctx.editMessageText('❌ Банк не найден');
        return;
      }

      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      // Проверяем лимиты для конкретного банка
      const status = await this.subscriptionService.getSubscriptionStatus(ctx.from.id);
      const categoriesInBank = await this.favoriteRepository.countByUserAndBank(user.id, bank.id);

      if (status.type === 'free' && categoriesInBank >= status.limits.maxCategoriesPerBank) {
        await ctx.editMessageText(
          '⚠️ Достигнут лимит категорий для этого банка на Free тарифе.\n\n' +
            'Оформите Pro подписку для безлимитного использования:\n' +
            '/subscription',
        );
        return;
      }

      const categories = await this.categoryRepository.findByBankId(bank.id);
      const existingFavorites = await this.favoriteRepository.findByUserAndBank(user.id, bank.id);
      const existingCategoryIds = existingFavorites.map((fav) => fav.categoryId);

      // Фильтруем уже добавленные категории
      const availableCategories = categories.filter((cat) => !existingCategoryIds.includes(cat.id));

      if (availableCategories.length === 0) {
        await ctx.editMessageText(
          `📝 Все доступные категории для ${bank.name} уже добавлены в избранное.`,
        );
        return;
      }

      const keyboard = [
        [Markup.button.callback('🔍 Поиск по названию', `fav_search:${bankCode}`)],
        ...availableCategories
          .slice(0, 10)
          .map((cat) => [
            Markup.button.callback(cat.name, `fav_select_category:${bankCode}:${cat.id}`),
          ]),
      ];

      if (availableCategories.length > 10) {
        keyboard.push([Markup.button.callback('📄 Показать все', `fav_show_all:${bankCode}`)]);
      }

      await ctx.editMessageText(`🏦 ${bank.name}\n\n📂 Выберите категорию для добавления:`, {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      });
    } catch (error) {
      logger.error('Error in handleSelectBank:', { error, telegramId: ctx.from.id, bankCode });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка поиска категорий
   */
  async handleSearchCategories(ctx: Context, bankCode: string) {
    if (!ctx.from) return;

    try {
      const bank = await this.bankService.getBankByCode(bankCode);
      if (!bank) {
        await ctx.editMessageText('❌ Банк не найден');
        return;
      }

      // Сохраняем банк в сессии для следующего шага
      (ctx as any).session = (ctx as any).session || {};
      (ctx as any).session.selectedBank = bankCode;

      await ctx.editMessageText(
        `🔍 Поиск категорий в ${bank.name}\n\n` + 'Введите название категории для поиска:',
      );
    } catch (error) {
      logger.error('Error in handleSearchCategories:', {
        error,
        telegramId: ctx.from.id,
        bankCode,
      });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка результатов поиска
   */
  async handleSearchResults(ctx: Context, searchQuery: string) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const session = (ctx as any).session as FavoritesSession;
    if (!session?.selectedBank) return;

    try {
      const bank = await this.bankService.getBankByCode(session.selectedBank);
      if (!bank) {
        await ctx.reply('❌ Банк не найден');
        return;
      }

      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const categories = await this.categoryRepository.findByBankId(bank.id);
      const existingFavorites = await this.favoriteRepository.findByUserAndBank(user.id, bank.id);
      const existingCategoryIds = existingFavorites.map((fav) => fav.categoryId);

      // Фильтруем по поисковому запросу и исключаем уже добавленные
      const searchResults = categories.filter(
        (cat) =>
          !existingCategoryIds.includes(cat.id) &&
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      if (searchResults.length === 0) {
        await ctx.reply(
          `🔍 По запросу "${searchQuery}" ничего не найдено.\n\n` +
            'Попробуйте другой поисковый запрос.',
        );
        return;
      }

      const keyboard = searchResults
        .slice(0, 10)
        .map((cat) => [
          Markup.button.callback(cat.name, `fav_select_category:${session.selectedBank}:${cat.id}`),
        ]);

      await ctx.reply(
        `🔍 Результаты поиска "${searchQuery}" в ${bank.name}:\n\n` +
          `Найдено: ${searchResults.length} категорий`,
        {
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );
    } catch (error) {
      logger.error('Error in handleSearchResults:', {
        error,
        telegramId: ctx.from.id,
        searchQuery,
      });
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка выбора категории
   */
  async handleSelectCategory(ctx: Context, bankCode: string, categoryId: number) {
    if (!ctx.from) return;

    try {
      const bank = await this.bankService.getBankByCode(bankCode);
      const category = await this.categoryRepository.findById(categoryId);

      if (!bank || !category) {
        await ctx.editMessageText('❌ Данные не найдены');
        return;
      }

      // Сохраняем выбранную категорию в сессии
      (ctx as any).session = (ctx as any).session || {};
      (ctx as any).session.selectedCategory = categoryId;
      (ctx as any).session.waitingForCashbackRate = true;

      const keyboard = [
        [Markup.button.callback('📋 Показать MCC-коды', `fav_show_mcc:${categoryId}`)],
        [
          Markup.button.callback(
            '✅ Добавить без процента',
            `fav_add_no_rate:${bankCode}:${categoryId}`,
          ),
        ],
      ];

      await ctx.editMessageText(
        `📂 ${category.name}\n` +
          `🏦 ${bank.name}\n\n` +
          `💰 Введите процент кэшбэка (от 0 до 100) или выберите действие:`,
        {
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );
    } catch (error) {
      logger.error('Error in handleSelectCategory:', {
        error,
        telegramId: ctx.from.id,
        bankCode,
        categoryId,
      });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Показать MCC-коды для категории
   */
  async handleShowMccCodes(ctx: Context, categoryId: number) {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        await ctx.editMessageText('❌ Категория не найдена');
        return;
      }

      const mccCodes = category.mccCodes.join(', ');
      const message = `📋 MCC-коды для "${category.name}":\n\n${mccCodes}`;

      await ctx.editMessageText(message);
    } catch (error) {
      logger.error('Error in handleShowMccCodes:', { error, categoryId });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Добавить категорию без указания процента
   */
  async handleAddNoRate(ctx: Context, bankCode: string, categoryId: number) {
    await this.addFavoriteCategory(ctx, bankCode, categoryId, null);
  }

  /**
   * Обработка ввода процента кэшбэка
   */
  async handleCashbackRateInput(ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const session = (ctx as any).session as FavoritesSession;
    if (!session?.waitingForCashbackRate || !session?.selectedBank || !session?.selectedCategory) {
      return;
    }

    try {
      const text = ctx.message.text.trim();
      const cashbackRate = parseFloat(text);

      if (isNaN(cashbackRate) || cashbackRate < 0 || cashbackRate > 100) {
        await ctx.reply(
          '❌ Неверный формат\n\n' + 'Введите число от 0 до 100\n' + 'Примеры: 5, 10.5, 15',
        );
        return;
      }

      await this.addFavoriteCategory(
        ctx,
        session.selectedBank,
        session.selectedCategory,
        cashbackRate,
      );

      // Очищаем сессию
      session.selectedBank = undefined;
      session.selectedCategory = undefined;
      session.waitingForCashbackRate = false;
    } catch (error) {
      logger.error('Error in handleCashbackRateInput:', {
        error,
        telegramId: ctx.from.id,
        message: ctx.message.text,
      });

      if (error instanceof Error && error.message.includes('лимит')) {
        await ctx.reply(`❌ ${error.message}`);
      } else {
        await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      }
    }
  }

  /**
   * Добавить категорию в избранное
   */
  private async addFavoriteCategory(
    ctx: Context,
    bankCode: string,
    categoryId: number,
    cashbackRate: number | null,
  ) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const bank = await this.bankService.getBankByCode(bankCode);
      const category = await this.categoryRepository.findById(categoryId);

      if (!bank || !category) {
        await ctx.reply('❌ Данные не найдены');
        return;
      }

      // Проверяем, не добавлена ли уже категория
      const exists = await this.favoriteRepository.exists(user.id, bank.id, categoryId);
      if (exists) {
        await ctx.reply('⚠️ Эта категория уже в избранном');
        return;
      }

      // Проверяем лимиты
      const canAddBank = await this.subscriptionService.canAddFavoriteBank(user.id);
      if (!canAddBank) {
        throw new Error('Достигнут лимит банков. Оформите Pro для безлимита.');
      }

      const canAddCategory = await this.subscriptionService.canAddFavoriteCategory(
        user.id,
        bank.id,
      );
      if (!canAddCategory) {
        throw new Error('Достигнут лимит категорий для этого банка. Оформите Pro.');
      }

      await this.favoriteRepository.add(user.id, bank.id, categoryId, cashbackRate || undefined);

      const rateText = cashbackRate ? ` с кэшбэком ${cashbackRate}%` : '';
      await ctx.reply(`✅ Категория "${category.name}" добавлена в избранное${rateText}!`);

      logger.info('Category added to favorites', {
        userId: user.id,
        telegramId: ctx.from.id,
        bankCode,
        categoryId,
        cashbackRate,
      });
    } catch (error) {
      logger.error('Error adding favorite category:', {
        error,
        telegramId: ctx.from.id,
        bankCode,
        categoryId,
        cashbackRate,
      });
      throw error;
    }
  }
  /**
   * Обработка удаления избранных категорий
   */
  async handleRemoveFavorites(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const favorites = await this.favoriteRepository.findByUserId(user.id);

      if (favorites.length === 0) {
        await ctx.editMessageText('📝 У вас нет избранных категорий для удаления');
        return;
      }

      const keyboard = favorites.map((fav) => [
        Markup.button.callback(
          `${fav.bank?.name} - ${fav.category?.name}${fav.cashbackRate ? ` (${fav.cashbackRate}%)` : ''}`,
          `fav_remove:${fav.bankId}:${fav.categoryId}`,
        ),
      ]);

      await ctx.editMessageText('🗑 Выберите категорию для удаления:', {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      });
    } catch (error) {
      logger.error('Error in handleRemoveFavorites:', { error, telegramId: ctx.from.id });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка удаления конкретной категории
   */
  async handleRemoveCategory(ctx: Context, bankId: number, categoryId: number) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        await ctx.editMessageText('❌ Категория не найдена');
        return;
      }

      await this.favoriteRepository.remove(user.id, bankId, categoryId);

      await ctx.editMessageText(`✅ Категория "${category.name}" удалена из избранного.`);

      logger.info('Category removed from favorites', {
        userId: user.id,
        telegramId: ctx.from.id,
        bankId,
        categoryId,
      });
    } catch (error) {
      logger.error('Error in handleRemoveCategory:', {
        error,
        telegramId: ctx.from.id,
        bankId,
        categoryId,
      });
      await ctx.editMessageText('❌ Произошла ошибка при удалении.');
    }
  }
}
