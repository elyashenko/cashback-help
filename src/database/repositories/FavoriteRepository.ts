import { AppDataSource } from '../../config/database';
import { UserFavoriteCategory } from '../entities/UserFavoriteCategory';

export class FavoriteRepository {
  private repository = AppDataSource.getRepository(UserFavoriteCategory);

  async findByUserId(userId: number): Promise<UserFavoriteCategory[]> {
    return this.repository.find({
      where: { userId },
      relations: ['bank', 'category'],
      order: { addedAt: 'DESC' },
    });
  }

  async findByUserAndBank(userId: number, bankId: number): Promise<UserFavoriteCategory[]> {
    return this.repository.find({
      where: { userId, bankId },
      relations: ['category'],
      order: { addedAt: 'DESC' },
    });
  }

  async countByUser(userId: number): Promise<number> {
    return this.repository.count({ where: { userId } });
  }

  async countByUserAndBank(userId: number, bankId: number): Promise<number> {
    return this.repository.count({ where: { userId, bankId } });
  }

  async exists(userId: number, bankId: number, categoryId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, bankId, categoryId },
    });
    return count > 0;
  }

  async add(
    userId: number,
    bankId: number,
    categoryId: number,
    cashbackRate?: number,
  ): Promise<UserFavoriteCategory> {
    const favorite = this.repository.create({
      userId,
      bankId,
      categoryId,
      cashbackRate,
    });
    return this.repository.save(favorite);
  }

  async updateCashbackRate(
    userId: number,
    bankId: number,
    categoryId: number,
    cashbackRate: number,
  ): Promise<void> {
    await this.repository.update({ userId, bankId, categoryId }, { cashbackRate });
  }

  async findByUserWithCashback(userId: number): Promise<UserFavoriteCategory[]> {
    return this.repository.find({
      where: { userId },
      relations: ['bank', 'category'],
      order: { addedAt: 'DESC' },
    });
  }

  async remove(userId: number, bankId: number, categoryId: number): Promise<void> {
    await this.repository.delete({ userId, bankId, categoryId });
  }

  async removeByCategory(categoryId: number): Promise<void> {
    await this.repository.delete({ categoryId });
  }

  async getBankIdsForUser(userId: number): Promise<number[]> {
    const favorites = await this.repository
      .createQueryBuilder('favorite')
      .select('DISTINCT favorite.bank_id', 'bankId')
      .where('favorite.user_id = :userId', { userId })
      .getRawMany();

    return favorites.map((f) => f.bankId);
  }
}
