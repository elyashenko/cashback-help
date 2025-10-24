import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { AdminSettings, ServiceType, SettingScope } from '../entities/AdminSettings';

export class AdminSettingsRepository {
  private repository: Repository<AdminSettings>;

  constructor() {
    this.repository = AppDataSource.getRepository(AdminSettings);
  }

  /**
   * Получить все настройки
   */
  async findAll(): Promise<AdminSettings[]> {
    return this.repository.find({
      order: { serviceType: 'ASC' },
    });
  }

  /**
   * Получить настройку для конкретного сервиса
   */
  async findByServiceType(serviceType: ServiceType): Promise<AdminSettings | null> {
    return this.repository.findOne({
      where: { serviceType },
    });
  }

  /**
   * Получить индивидуальную настройку для пользователя
   */
  async findByUserAndService(userId: number, serviceType: ServiceType): Promise<AdminSettings | null> {
    return this.repository.findOne({
      where: {
        userId,
        serviceType,
        scope: SettingScope.USER,
      },
    });
  }

  /**
   * Проверить доступность сервиса для пользователя
   */
  async isServiceEnabledForUser(userId: number, serviceType: ServiceType): Promise<boolean> {
    // Сначала проверяем индивидуальную настройку пользователя
    const userSetting = await this.findByUserAndService(userId, serviceType);
    if (userSetting) {
      return userSetting.isEnabled;
    }

    // Если индивидуальной настройки нет, проверяем глобальную
    const globalSetting = await this.findByServiceType(serviceType);
    return globalSetting?.isEnabled ?? true; // По умолчанию включено
  }

  /**
   * Создать или обновить настройку
   */
  async upsertSetting(
    serviceType: ServiceType,
    isEnabled: boolean,
    scope: SettingScope = SettingScope.GLOBAL,
    userId?: number,
    description?: string,
  ): Promise<AdminSettings> {
    const existingSetting = scope === SettingScope.USER && userId
      ? await this.findByUserAndService(userId, serviceType)
      : await this.findByServiceType(serviceType);

    if (existingSetting) {
      existingSetting.isEnabled = isEnabled;
      existingSetting.description = description || existingSetting.description;
      return this.repository.save(existingSetting);
    }

    const newSetting = this.repository.create({
      serviceType,
      isEnabled,
      scope,
      userId: scope === SettingScope.USER ? userId : null,
      description,
    });

    return this.repository.save(newSetting);
  }

  /**
   * Удалить индивидуальную настройку пользователя
   */
  async removeUserSetting(userId: number, serviceType: ServiceType): Promise<void> {
    await this.repository.delete({
      userId,
      serviceType,
      scope: SettingScope.USER,
    });
  }

  /**
   * Получить все индивидуальные настройки пользователя
   */
  async getUserSettings(userId: number): Promise<AdminSettings[]> {
    return this.repository.find({
      where: {
        userId,
        scope: SettingScope.USER,
      },
      order: { serviceType: 'ASC' },
    });
  }

  /**
   * Инициализировать настройки по умолчанию
   */
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = Object.values(ServiceType).map(serviceType => ({
      serviceType,
      isEnabled: true,
      scope: SettingScope.GLOBAL,
      description: `Глобальная настройка для ${serviceType}`,
    }));

    for (const setting of defaultSettings) {
      const existing = await this.findByServiceType(setting.serviceType);
      if (!existing) {
        await this.repository.save(this.repository.create(setting));
      }
    }
  }
}
