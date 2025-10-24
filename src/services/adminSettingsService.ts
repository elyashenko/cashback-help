import { AdminSettingsRepository } from '../database/repositories/AdminSettingsRepository';
import { ServiceType, SettingScope } from '../database/entities/AdminSettings';
import { logger } from '../utils/logger';

export class AdminSettingsService {
  private adminUserIds: Set<number>;

  constructor(private adminSettingsRepository: AdminSettingsRepository) {
    // Parse admin user IDs from environment
    const adminIds =
      process.env.ADMIN_USER_IDS?.split(',').map((id) => parseInt(id.trim(), 10)) || [];
    this.adminUserIds = new Set(adminIds);
    
    // Добавляем пользователя @elyashenko по умолчанию (замените на реальный Telegram ID)
    // this.adminUserIds.add(123456789);
  }

  /**
   * Проверить, является ли пользователь админом
   */
  isAdmin(userId: number): boolean {
    return this.adminUserIds.has(userId);
  }

  /**
   * Проверить доступность сервиса для пользователя
   */
  async isServiceEnabledForUser(userId: number, serviceType: ServiceType): Promise<boolean> {
    try {
      return await this.adminSettingsRepository.isServiceEnabledForUser(userId, serviceType);
    } catch (error) {
      logger.error('Error checking service availability:', { error, userId, serviceType });
      return true; // По умолчанию разрешаем, если произошла ошибка
    }
  }

  /**
   * Получить все настройки
   */
  async getAllSettings(): Promise<any[]> {
    return this.adminSettingsRepository.findAll();
  }

  /**
   * Включить/отключить сервис глобально
   */
  async toggleGlobalService(serviceType: ServiceType, isEnabled: boolean, description?: string): Promise<void> {
    await this.adminSettingsRepository.upsertSetting(
      serviceType,
      isEnabled,
      SettingScope.GLOBAL,
      undefined,
      description,
    );

    logger.info('Global service toggled', { serviceType, isEnabled, description });
  }

  /**
   * Включить/отключить сервис для конкретного пользователя
   */
  async toggleUserService(
    userId: number,
    serviceType: ServiceType,
    isEnabled: boolean,
    description?: string,
  ): Promise<void> {
    await this.adminSettingsRepository.upsertSetting(
      serviceType,
      isEnabled,
      SettingScope.USER,
      userId,
      description,
    );

    logger.info('User service toggled', { userId, serviceType, isEnabled, description });
  }

  /**
   * Удалить индивидуальную настройку пользователя
   */
  async removeUserSetting(userId: number, serviceType: ServiceType): Promise<void> {
    await this.adminSettingsRepository.removeUserSetting(userId, serviceType);
    logger.info('User setting removed', { userId, serviceType });
  }

  /**
   * Получить настройки пользователя
   */
  async getUserSettings(userId: number): Promise<any[]> {
    return this.adminSettingsRepository.getUserSettings(userId);
  }

  /**
   * Инициализировать настройки по умолчанию
   */
  async initializeDefaultSettings(): Promise<void> {
    await this.adminSettingsRepository.initializeDefaultSettings();
    logger.info('Default admin settings initialized');
  }

  /**
   * Получить статус всех сервисов для пользователя
   */
  async getServiceStatusForUser(userId: number): Promise<Record<ServiceType, boolean>> {
    const status: Record<ServiceType, boolean> = {} as Record<ServiceType, boolean>;

    for (const serviceType of Object.values(ServiceType)) {
      status[serviceType] = await this.isServiceEnabledForUser(userId, serviceType);
    }

    return status;
  }

  /**
   * Получить список доступных сервисов
   */
  getAvailableServices(): Array<{ type: ServiceType; name: string; description: string }> {
    return [
      {
        type: ServiceType.SET_CASHBACK,
        name: 'Установка кэшбэка',
        description: 'Команда /set_cashback для настройки процентов кэшбэка',
      },
      {
        type: ServiceType.MY_CASHBACK,
        name: 'Мои настройки кэшбэка',
        description: 'Команда /my_cashback для просмотра настроек',
      },
      {
        type: ServiceType.REMOVE_CASHBACK,
        name: 'Удаление кэшбэка',
        description: 'Команда /remove_cashback для удаления настроек',
      },
      {
        type: ServiceType.SEARCH,
        name: 'Поиск категорий',
        description: 'Команда /search для поиска MCC-кодов',
      },
      {
        type: ServiceType.FAVORITES,
        name: 'Избранные категории',
        description: 'Команда /favorites для управления избранным',
      },
      {
        type: ServiceType.SUBSCRIPTION,
        name: 'Управление подпиской',
        description: 'Команда /subscription для покупки Pro',
      },
      {
        type: ServiceType.STATS,
        name: 'Статистика пользователя',
        description: 'Команда /stats для просмотра статистики',
      },
      {
        type: ServiceType.BANKS,
        name: 'Список банков',
        description: 'Команда /banks для просмотра доступных банков',
      },
    ];
  }
}
