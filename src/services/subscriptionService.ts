import { UserRepository } from '../database/repositories/UserRepository';
import { FavoriteRepository } from '../database/repositories/FavoriteRepository';
import { SUBSCRIPTION_LIMITS, PRO_SUBSCRIPTION } from '../config/constants';
import { SubscriptionStatus } from '../types/subscription';
import { isSubscriptionActive, calculateExpiryDate } from '../utils/helpers';
import { logger } from '../utils/logger';

export class SubscriptionService {
  constructor(
    private userRepository: UserRepository,
    private favoriteRepository: FavoriteRepository,
  ) {}

  async getSubscriptionStatus(telegramId: number): Promise<SubscriptionStatus> {
    const user = await this.userRepository.findByTelegramId(telegramId);
    if (!user) {
      throw new Error('User not found');
    }

    const isActive = isSubscriptionActive(user.subscriptionType, user.subscriptionExpiry);
    const limits = SUBSCRIPTION_LIMITS[user.subscriptionType];

    return {
      type: user.subscriptionType,
      isActive,
      expiryDate: user.subscriptionExpiry,
      limits,
    };
  }

  async canAddFavoriteBank(telegramId: number): Promise<boolean> {
    const status = await this.getSubscriptionStatus(telegramId);
    
    if (status.type === 'pro' && status.isActive) {
      return true;
    }

    const user = await this.userRepository.findByTelegramId(telegramId);
    if (!user) return false;

    const bankIds = await this.favoriteRepository.getBankIdsForUser(user.id);
    return bankIds.length < status.limits.maxBanks;
  }

  async canAddFavoriteCategory(telegramId: number, bankId: number): Promise<boolean> {
    const status = await this.getSubscriptionStatus(telegramId);
    
    if (status.type === 'pro' && status.isActive) {
      return true;
    }

    const user = await this.userRepository.findByTelegramId(telegramId);
    if (!user) return false;

    const count = await this.favoriteRepository.countByUserAndBank(user.id, bankId);
    return count < status.limits.maxCategoriesPerBank;
  }

  async upgradeToPro(telegramId: number, durationDays: number = PRO_SUBSCRIPTION.durationDays): Promise<void> {
    try {
      const user = await this.userRepository.findByTelegramId(telegramId);
      if (!user) throw new Error('User not found');

      const expiryDate = calculateExpiryDate(durationDays);
      
      await this.userRepository.updateSubscription(user.id, 'pro', expiryDate);
      
      logger.info('User upgraded to Pro:', {
        telegramId,
        userId: user.id,
        expiryDate,
        durationDays,
      });
    } catch (error) {
      logger.error('Error upgrading to Pro:', { error, telegramId });
      throw error;
    }
  }

  async downgradeToFree(telegramId: number): Promise<void> {
    try {
      const user = await this.userRepository.findByTelegramId(telegramId);
      if (!user) throw new Error('User not found');

      await this.userRepository.updateSubscription(user.id, 'free', undefined);
      
      logger.info('User downgraded to Free:', { telegramId, userId: user.id });
    } catch (error) {
      logger.error('Error downgrading to Free:', { error, telegramId });
      throw error;
    }
  }

  async checkAndUpdateExpiredSubscriptions(): Promise<void> {
    // This would be run as a cron job
    // Implementation would query for expired pro subscriptions and downgrade them
    logger.info('Checking expired subscriptions...');
  }
}

