import { AppDataSource } from '../../config/database';
import { User } from '../entities/User';
import { CreateUserDto } from '../../types/user';
import { isMonthlyResetDay } from '../../utils/helpers';

export class UserRepository {
  private repository = AppDataSource.getRepository(User);

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.repository.findOne({ where: { telegramId } });
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateUserDto): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async findOrCreate(data: CreateUserDto): Promise<User> {
    let user = await this.findByTelegramId(data.telegramId);
    
    if (!user) {
      user = await this.create(data);
    }

    return user;
  }

  async updateSubscription(
    userId: number,
    type: 'free' | 'pro',
    expiryDate?: Date,
  ): Promise<void> {
    await this.repository.update(userId, {
      subscriptionType: type,
      subscriptionExpiry: expiryDate,
    });
  }

  async checkAndResetMonthlyLimits(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    if (isMonthlyResetDay(user.monthlyResetDate)) {
      await this.repository.update(userId, {
        monthlyResetDate: new Date(),
      });
    }
  }

  async countTotal(): Promise<number> {
    return this.repository.count();
  }

  async countBySubscriptionType(type: 'free' | 'pro'): Promise<number> {
    return this.repository.count({ where: { subscriptionType: type } });
  }

  async countActive(daysThreshold: number = 7): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysThreshold);

    return this.repository
      .createQueryBuilder('user')
      .where('user.updatedAt > :threshold', { threshold })
      .getCount();
  }
}

