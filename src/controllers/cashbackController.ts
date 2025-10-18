import { Context, Markup } from 'telegraf';
import { UserCashbackService } from '../services/userCashbackService';
import { CategoryService } from '../services/categoryService';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { BankService } from '../services/bankService';
import { UserService } from '../services/userService';
import { FSMManager } from '../services/fsmService';
import { BotState } from '../types/fsm';
import { logger } from '../utils/logger';
import { escapeMarkdown } from '../utils/helpers';

// Удаляем неиспользуемый интерфейс

export class CashbackController {
  constructor(
    private cashbackService: UserCashbackService,
    private categoryService: CategoryService,
    private categoryRepository: CategoryRepository,
    private bankService: BankService,
    private userService: UserService,
  ) {}

  /**
   * Команда: /set_cashback
   * Установить процент кэшбэка для категории
   */
  async handleSetCashback(ctx: Context) {
    if (!ctx.from) return;

    try {
      // Set FSM state
      FSMManager.setState(ctx.session!, BotState.SETTING_CASHBACK_BANK);

      const banks = await this.bankService.getActiveBanks();
      const keyboard = banks.map((bank) => [
        Markup.button.callback(bank.name, `select_bank:${bank.code}`),
      ]);

      await ctx.reply('🏦 *Выберите банк:*', {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      });

      logger.info('User started cashback setup', { 
        telegramId: ctx.from.id,
        fsmState: FSMManager.getState(ctx.session!)
      });
    } catch (error) {
      logger.error('Error in handleSetCashback:', { error, telegramId: ctx.from?.id });
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      // Reset FSM state on error
      FSMManager.reset(ctx.session!);
    }
  }

  /**
   * Обработка выбора банка
   */
  async handleBankSelect(ctx: Context, bankCode: string) {
    if (!ctx.from) return;

    try {
      // Check FSM state
      if (!FSMManager.isInState(ctx.session!, BotState.SETTING_CASHBACK_BANK)) {
        await ctx.editMessageText('❌ Неожиданное действие. Начните заново с /set_cashback');
        FSMManager.reset(ctx.session!);
        return;
      }

      logger.info('Bank selection started', { telegramId: ctx.from.id, bankCode });

      const bank = await this.bankService.getBankByCode(bankCode);
      if (!bank) {
        logger.warn('Bank not found', { telegramId: ctx.from.id, bankCode });
        await ctx.editMessageText('❌ Банк не найден');
        return;
      }

      // Store bank data in FSM
      FSMManager.setData(ctx.session!, 'selectedBank', bankCode);
      FSMManager.setData(ctx.session!, 'bankId', bank.id);

      logger.info('Bank found', { telegramId: ctx.from.id, bankCode, bankId: bank.id });

      const categories = await this.categoryService.getCategoriesByBank(bank.id);
      logger.info('Categories retrieved', {
        telegramId: ctx.from.id,
        bankCode,
        bankId: bank.id,
        categoriesCount: categories.length,
      });

      if (categories.length === 0) {
        await ctx.editMessageText('❌ Для этого банка пока нет категорий');
        FSMManager.reset(ctx.session!);
        return;
      }

      // Инициализируем сессию
      ctx.session = ctx.session || {};
      ctx.session.cashback = ctx.session.cashback || {};
      ctx.session.cashback.selectedBank = bankCode;
      ctx.session.cashback.selectedCategories = [];

      logger.info('Session initialized', {
        telegramId: ctx.from.id,
        bankCode,
        session: JSON.stringify(ctx.session),
      });

      const keyboard = categories.map((cat) => [
        Markup.button.callback(`☐ ${cat.name}`, `toggle_category:${cat.id}`),
      ]);

      keyboard.push([Markup.button.callback('✅ Готово', 'confirm_categories')]);

      // Transition to next state
      FSMManager.transition(ctx.session!, 'bank_selected');

      await ctx.editMessageText(
        `🏦 *${bank.name}*\n\n📂 Выберите категории для настройки кэшбэка:\n\n` +
          `☐ - не выбрано\n` +
          `☑ - выбрано`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );

      logger.info('Bank selection completed successfully', {
        telegramId: ctx.from.id,
        bankCode,
        bankId: bank.id,
        fsmState: FSMManager.getState(ctx.session!)
      });
    } catch (error) {
      logger.error('Error in handleBankSelect:', {
        error,
        telegramId: ctx.from.id,
        bankCode,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка переключения категории (чекбокс)
   */
  async handleToggleCategory(ctx: Context, categoryId: number) {
    if (!ctx.from) return;

    try {
      logger.info('Category toggle started', { telegramId: ctx.from.id, categoryId });

      const session = ctx.session;
      const cashbackSession = session?.cashback;

      logger.info('Session check in toggle', {
        telegramId: ctx.from.id,
        categoryId,
        session: JSON.stringify(session),
        cashbackSession: JSON.stringify(cashbackSession),
      });

      if (!cashbackSession?.selectedBank || !cashbackSession?.selectedCategories) {
        logger.warn('Session expired', { telegramId: ctx.from.id, categoryId });
        await ctx.answerCbQuery('❌ Сессия истекла. Начните заново.');
        return;
      }

      const bank = await this.bankService.getBankByCode(cashbackSession.selectedBank!);
      if (!bank) {
        logger.warn('Bank not found in toggle', {
          telegramId: ctx.from.id,
          bankCode: cashbackSession.selectedBank,
        });
        await ctx.editMessageText('❌ Банк не найден');
        return;
      }

      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        logger.warn('Category not found', { telegramId: ctx.from.id, categoryId });
        await ctx.answerCbQuery('❌ Категория не найдена');
        return;
      }

      // Переключаем состояние категории
      const index = cashbackSession.selectedCategories.indexOf(categoryId);
      const wasSelected = index > -1;

      if (wasSelected) {
        cashbackSession.selectedCategories.splice(index, 1);
      } else {
        cashbackSession.selectedCategories.push(categoryId);
      }

      logger.info('Category toggled', {
        telegramId: ctx.from.id,
        categoryId,
        categoryName: category.name,
        wasSelected,
        nowSelected: !wasSelected,
        totalSelected: cashbackSession.selectedCategories.length,
      });

      // Обновляем интерфейс
      const categories = await this.categoryService.getCategoriesByBank(bank.id);
      const keyboard = categories.map((cat) => {
        const isSelected = cashbackSession.selectedCategories?.includes(cat.id) || false;
        return [
          Markup.button.callback(
            `${isSelected ? '☑' : '☐'} ${cat.name}`,
            `toggle_category:${cat.id}`,
          ),
        ];
      });

      keyboard.push([Markup.button.callback('✅ Готово', 'confirm_categories')]);

      await ctx.editMessageText(
        `🏦 *${bank.name}*\n\n📂 Выберите категории для настройки кэшбэка:\n\n` +
          `☐ - не выбрано\n` +
          `☑ - выбрано\n\n` +
          `Выбрано: ${cashbackSession.selectedCategories.length}`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
        },
      );

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in handleToggleCategory:', {
        error,
        telegramId: ctx.from.id,
        categoryId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  /**
   * Обработка подтверждения выбранных категорий
   */
  async handleConfirmCategories(ctx: Context) {
    if (!ctx.from) return;

    try {
      const session = ctx.session;
      const cashbackSession = session?.cashback;
      if (!cashbackSession?.selectedBank || !cashbackSession?.selectedCategories) {
        await ctx.editMessageText('❌ Сессия истекла. Начните заново.');
        return;
      }

      if (cashbackSession.selectedCategories.length === 0) {
        await ctx.answerCbQuery('❌ Выберите хотя бы одну категорию');
        return;
      }

      const bank = await this.bankService.getBankByCode(cashbackSession.selectedBank!);
      if (!bank) {
        await ctx.editMessageText('❌ Банк не найден');
        return;
      }

      // Проверяем лимиты подписки
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const limits = await this.cashbackService.checkSubscriptionLimits(user.id, bank.id);

      if (!limits.canAddBank) {
        await ctx.editMessageText(
          '❌ *Достигнут лимит банков (4)*\n\n' +
            'Оформите Pro подписку для безлимитного использования:\n' +
            '/subscription',
          { parse_mode: 'Markdown' },
        );
        return;
      }

      if (!limits.canAddCategory) {
        await ctx.editMessageText(
          '❌ *Достигнут лимит категорий (4) для этого банка*\n\n' +
            'Оформите Pro подписку для безлимитного использования:\n' +
            '/subscription',
          { parse_mode: 'Markdown' },
        );
        return;
      }

      // Начинаем ввод процентов
      cashbackSession.waitingForRates = true;
      cashbackSession.currentCategoryIndex = 0;

      await this.showNextCategoryForRate(ctx);
    } catch (error) {
      logger.error('Error in handleConfirmCategories:', {
        error,
        telegramId: ctx.from.id,
      });
      await ctx.editMessageText('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Показать следующую категорию для ввода процента
   */
  private async showNextCategoryForRate(ctx: Context) {
    const session = ctx.session;
    const cashbackSession = session?.cashback;
    if (
      !cashbackSession?.selectedCategories ||
      cashbackSession.currentCategoryIndex === undefined
    ) {
      await ctx.editMessageText('❌ Ошибка сессии');
      return;
    }

    const categoryId = cashbackSession.selectedCategories[cashbackSession.currentCategoryIndex];

    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      await ctx.editMessageText('❌ Категория не найдена');
      return;
    }

    const bank = await this.bankService.getBankByCode(cashbackSession.selectedBank!);
    if (!bank) {
      await ctx.editMessageText('❌ Банк не найден');
      return;
    }

    const currentNum = cashbackSession.currentCategoryIndex + 1;
    const totalNum = cashbackSession.selectedCategories.length;

    await ctx.editMessageText(
      `🏦 *${escapeMarkdown(bank.name)}*\n` +
        `📂 *${escapeMarkdown(category.name)}*\n\n` +
        `💰 Введите процент кэшбэка \\(целое число от 0 до 100\\):\n\n` +
        `*Прогресс:* ${currentNum}/${totalNum}`,
      { parse_mode: 'Markdown' },
    );
  }

  /**
   * Обработка ввода процента кэшбэка
   */
  async handleCashbackRateInput(ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const session = ctx.session;
    const cashbackSession = session?.cashback;
    if (
      !cashbackSession?.waitingForRates ||
      !cashbackSession?.selectedBank ||
      !cashbackSession?.selectedCategories
    ) {
      return;
    }

    try {
      const text = ctx.message.text.trim();
      const cashbackRate = parseInt(text);

      if (isNaN(cashbackRate) || cashbackRate < 0 || cashbackRate > 100) {
        await ctx.reply(
          '❌ *Неверный формат*\n\n' + 'Введите целое число от 0 до 100\n' + '*Примеры:* 5, 10, 15',
          { parse_mode: 'Markdown' },
        );
        return;
      }

      const bank = await this.bankService.getBankByCode(cashbackSession.selectedBank!);
      if (!bank) {
        await ctx.reply('❌ Банк не найден');
        return;
      }

      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const categoryId = cashbackSession.selectedCategories[cashbackSession.currentCategoryIndex!];
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        await ctx.reply('❌ Категория не найдена');
        return;
      }

      // Сохраняем настройку кэшбэка
      await this.cashbackService.setCashbackRate(user.id, bank.id, categoryId, cashbackRate);

      // Переходим к следующей категории
      cashbackSession.currentCategoryIndex!++;

      if (cashbackSession.currentCategoryIndex! >= cashbackSession.selectedCategories.length) {
        // Все категории обработаны
        await ctx.reply(
          `✅ *Настройка кэшбэка завершена\\!*\n\n` +
            `Установлены проценты для ${cashbackSession.selectedCategories.length} категорий в банке ${escapeMarkdown(bank.name)}\\.`,
          { parse_mode: 'Markdown' },
        );

        // Очищаем сессию
        cashbackSession.selectedBank = undefined;
        cashbackSession.selectedCategories = undefined;
        cashbackSession.waitingForRates = false;
        cashbackSession.currentCategoryIndex = undefined;
      } else {
        // Показываем следующую категорию
        await this.showNextCategoryForRate(ctx);
      }

      logger.info('Cashback rate set', {
        userId: user.id,
        telegramId: ctx.from.id,
        bankCode: cashbackSession.selectedBank,
        categoryId,
        cashbackRate,
      });
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
   * Команда: /my_cashback
   * Показать все настройки кэшбэка
   */
  async handleMyCashback(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const settings = await this.cashbackService.getUserCashbackSettings(user.id);

      if (settings.length === 0) {
        await ctx.reply(
          '📝 У вас пока нет настроек кэшбэка\n\n' + 'Используйте /set_cashback для добавления.',
        );
        return;
      }

      // Группируем по банкам
      const groupedByBank = await this.cashbackService.getUserCashbackSettingsGrouped(user.id);

      let message = '💰 Ваши настройки кэшбэка:\n\n';

      for (const [bankName, bankSettings] of Object.entries(groupedByBank)) {
        message += `🏦 ${escapeMarkdown(bankName)}:\n`;
        bankSettings.forEach((setting) => {
          const categoryName = setting.category?.name || 'Неизвестная категория';
          message += `• ${escapeMarkdown(categoryName)}: ${setting.cashbackRate}%\n`;
        });
        message += '\n';
      }

      message += 'Используйте /set_cashback для добавления новых настроек.';

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in handleMyCashback:', { error, telegramId: ctx.from.id });
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Команда: /remove_cashback
   * Удалить настройку кэшбэка
   */
  async handleRemoveCashback(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      const settings = await this.cashbackService.getUserCashbackSettings(user.id);

      if (settings.length === 0) {
        await ctx.reply('📝 У вас нет настроек кэшбэка для удаления');
        return;
      }

      const keyboard = settings.map((setting) => [
        Markup.button.callback(
          `${setting.bank?.name || 'Неизвестный банк'} - ${setting.category?.name || 'Неизвестная категория'} (${setting.cashbackRate}%)`,
          `remove_cashback:${setting.bankId}:${setting.categoryId}`,
        ),
      ]);

      await ctx.reply('🗑 Выберите настройку для удаления:', {
        reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
      });
    } catch (error) {
      logger.error('Error in handleRemoveCashback:', { error, telegramId: ctx.from.id });
      await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработка удаления настройки кэшбэка
   */
  async handleRemoveCashbackConfirm(ctx: Context, bankId: number, categoryId: number) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getOrCreateUser({
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      });

      await this.cashbackService.removeCashbackSetting(user.id, bankId, categoryId);

      await ctx.editMessageText(
        '✅ Настройка кэшбэка удалена\n\n' +
          'Используйте /my_cashback для просмотра оставшихся настроек.',
      );

      logger.info('Cashback setting removed', {
        userId: user.id,
        telegramId: ctx.from.id,
        bankId,
        categoryId,
      });
    } catch (error) {
      logger.error('Error in handleRemoveCashbackConfirm:', {
        error,
        telegramId: ctx.from.id,
        bankId,
        categoryId,
      });
      await ctx.editMessageText('❌ Произошла ошибка при удалении.');
    }
  }
}
