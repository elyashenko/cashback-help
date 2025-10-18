import { AppDataSource } from '../../config/database';
import { UserCashbackSetting } from '../entities/UserCashbackSetting';
import {
  CreateUserCashbackSettingDto,
  UserCashbackSettingWithRelations,
} from '../../types/cashback';

export class UserCashbackRepository {
  private repository = AppDataSource.getRepository(UserCashbackSetting);

  /**
   * Создать или обновить настройку кэшбэка
   */
  async upsert(dto: CreateUserCashbackSettingDto): Promise<UserCashbackSetting> {
    const existing = await this.repository.findOne({
      where: {
        userId: dto.userId,
        bankId: dto.bankId,
        categoryId: dto.categoryId,
      },
    });

    if (existing) {
      await this.repository.update(existing.id, {
        cashbackRate: dto.cashbackRate,
        isActive: true,
        updatedAt: new Date(),
      });
      const updated = await this.repository.findOne({
        where: { id: existing.id },
        relations: ['bank', 'category'],
      });
      return updated!;
    } else {
      const setting = this.repository.create(dto);
      return await this.repository.save(setting);
    }
  }

  /**
   * Получить все настройки пользователя
   */
  async findByUserId(userId: number): Promise<UserCashbackSettingWithRelations[]> {
    return await this.repository.find({
      where: { userId, isActive: true },
      relations: ['bank', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Получить настройку для конкретной категории
   */
  async findByUserBankCategory(
    userId: number,
    bankId: number,
    categoryId: number,
  ): Promise<UserCashbackSetting | null> {
    return await this.repository.findOne({
      where: { userId, bankId, categoryId, isActive: true },
      relations: ['bank', 'category'],
    });
  }

  /**
   * Получить процент кэшбэка для категории
   */
  async getCashbackRate(
    userId: number,
    bankId: number,
    categoryId: number,
  ): Promise<number | null> {
    const setting = await this.repository.findOne({
      where: { userId, bankId, categoryId, isActive: true },
      select: ['cashbackRate'],
    });
    return setting?.cashbackRate ?? null;
  }

  /**
   * Деактивировать настройку
   */
  async deactivate(userId: number, bankId: number, categoryId: number): Promise<void> {
    await this.repository.update(
      { userId, bankId, categoryId },
      { isActive: false, updatedAt: new Date() },
    );
  }

  /**
   * Получить количество активных настроек пользователя
   */
  async getActiveSettingsCount(userId: number): Promise<number> {
    return await this.repository.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Получить количество настроек по банкам
   */
  async getBankSettingsCount(userId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('setting')
      .select('COUNT(DISTINCT setting.bankId)', 'count')
      .where('setting.userId = :userId', { userId })
      .andWhere('setting.isActive = :isActive', { isActive: true })
      .getRawOne();

    return parseInt(result.count) || 0;
  }

  /**
   * Получить количество настроек в конкретном банке
   */
  async getBankCategorySettingsCount(userId: number, bankId: number): Promise<number> {
    return await this.repository.count({
      where: { userId, bankId, isActive: true },
    });
  }

  /**
   * Удалить все настройки пользователя
   */
  async deleteByUserId(userId: number): Promise<void> {
    await this.repository.delete({ userId });
  }
}
