import { UserCashbackRepository } from '../database/repositories/UserCashbackRepository';
import {
  UserCashbackSetting,
  CreateUserCashbackSettingDto,
  UserCashbackSettingWithRelations,
} from '../types/cashback';
import { SubscriptionService } from './subscriptionService';
import { logger } from '../utils/logger';

export class UserCashbackService {
  constructor(
    private userCashbackRepo: UserCashbackRepository,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Установить процент кэшбэка для категории
   */
  async setCashbackRate(
    userId: number,
    bankId: number,
    categoryId: number,
    cashbackRate: number,
  ): Promise<UserCashbackSetting> {
    // Валидация процента
    if (cashbackRate < 0 || cashbackRate > 100) {
      throw new Error('Процент кэшбэка должен быть от 0 до 100');
    }

    try {
      // Проверяем лимиты подписки
      const user = await this.subscriptionService.getUser(userId);
      const userSettings = await this.getUserCashbackSettings(userId);

      if (user.subscriptionType === 'free') {
        // Free: до 4 банков и до 4 категорий на банк
        const bankCount = await this.userCashbackRepo.getBankSettingsCount(userId);
        const categoriesInBank = await this.userCashbackRepo.getBankCategorySettingsCount(
          userId,
          bankId,
        );

        // Проверяем, есть ли уже настройка для этого банка
        const existingBankSetting = userSettings.find((s) => s.bankId === bankId);

        if (bankCount >= 4 && !existingBankSetting) {
          throw new Error('Достигнут лимит банков (4). Оформите Pro для безлимита.');
        }

        if (categoriesInBank >= 4 && !existingBankSetting) {
          throw new Error('Достигнут лимит категорий (4) для этого банка. Оформите Pro.');
        }
      }

      // Создаем или обновляем настройку
      const dto: CreateUserCashbackSettingDto = {
        userId,
        bankId,
        categoryId,
        cashbackRate,
      };

      const setting = await this.userCashbackRepo.upsert(dto);

      logger.info('Cashback rate set', {
        userId,
        bankId,
        categoryId,
        cashbackRate,
        subscriptionType: user.subscriptionType,
      });

      return setting;
    } catch (error) {
      logger.error('Failed to set cashback rate', {
        userId,
        bankId,
        categoryId,
        cashbackRate,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Получить все настройки кэшбэка пользователя
   */
  async getUserCashbackSettings(userId: number): Promise<UserCashbackSettingWithRelations[]> {
    try {
      return await this.userCashbackRepo.findByUserId(userId);
    } catch (error) {
      logger.error('Failed to get user cashback settings', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Получить процент кэшбэка для конкретной категории
   */
  async getCashbackRate(
    userId: number,
    bankId: number,
    categoryId: number,
  ): Promise<number | null> {
    try {
      return await this.userCashbackRepo.getCashbackRate(userId, bankId, categoryId);
    } catch (error) {
      logger.error('Failed to get cashback rate', {
        userId,
        bankId,
        categoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Удалить настройку кэшбэка
   */
  async removeCashbackSetting(userId: number, bankId: number, categoryId: number): Promise<void> {
    try {
      await this.userCashbackRepo.deactivate(userId, bankId, categoryId);

      logger.info('Cashback setting removed', {
        userId,
        bankId,
        categoryId,
      });
    } catch (error) {
      logger.error('Failed to remove cashback setting', {
        userId,
        bankId,
        categoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Получить настройки, сгруппированные по банкам
   */
  async getUserCashbackSettingsGrouped(
    userId: number,
  ): Promise<Record<string, UserCashbackSettingWithRelations[]>> {
    const settings = await this.getUserCashbackSettings(userId);

    return settings.reduce(
      (acc, setting) => {
        const bankName = setting.bank?.name || 'Неизвестный банк';
        if (!acc[bankName]) {
          acc[bankName] = [];
        }
        acc[bankName].push(setting);
        return acc;
      },
      {} as Record<string, UserCashbackSettingWithRelations[]>,
    );
  }

  /**
   * Проверить лимиты подписки
   */
  async checkSubscriptionLimits(
    userId: number,
    bankId: number,
  ): Promise<{
    canAddBank: boolean;
    canAddCategory: boolean;
    bankCount: number;
    categoryCount: number;
  }> {
    const user = await this.subscriptionService.getUser(userId);

    if (user.subscriptionType === 'pro') {
      return {
        canAddBank: true,
        canAddCategory: true,
        bankCount: 0,
        categoryCount: 0,
      };
    }

    const bankCount = await this.userCashbackRepo.getBankSettingsCount(userId);
    const categoryCount = await this.userCashbackRepo.getBankCategorySettingsCount(userId, bankId);

    return {
      canAddBank: bankCount < 4,
      canAddCategory: categoryCount < 4,
      bankCount,
      categoryCount,
    };
  }
}
