import { UserRepository } from '../database/repositories/UserRepository';
import { CreateUserDto } from '../types/user';
import { User } from '../database/entities/User';
import { logger } from '../utils/logger';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getOrCreateUser(data: CreateUserDto): Promise<User> {
    try {
      const user = await this.userRepository.findOrCreate(data);
      
      // Check and reset monthly limits if needed
      await this.userRepository.checkAndResetMonthlyLimits(user.id);
      
      return user;
    } catch (error) {
      logger.error('Error in getOrCreateUser:', { error, data });
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.userRepository.findByTelegramId(telegramId);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserStats() {
    const totalUsers = await this.userRepository.countTotal();
    const freeUsers = await this.userRepository.countBySubscriptionType('free');
    const proUsers = await this.userRepository.countBySubscriptionType('pro');
    const activeUsers = await this.userRepository.countActive(7);

    return {
      totalUsers,
      freeUsers,
      proUsers,
      activeUsers,
    };
  }
}

