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

  async getSubscriptionStatus(userId: number): Promise<SubscriptionStatus> {
    const user = await this.userRepository.findById(userId);
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

  async canAddFavoriteBank(userId: number): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId);
    
    if (status.type === 'pro' && status.isActive) {
      return true;
    }

    const bankIds = await this.favoriteRepository.getBankIdsForUser(userId);
    return bankIds.length < status.limits.maxBanks;
  }

  async canAddFavoriteCategory(userId: number, bankId: number): Promise<boolean> {
    const status = await this.getSubscriptionStatus(userId);
    
    if (status.type === 'pro' && status.isActive) {
      return true;
    }

    const count = await this.favoriteRepository.countByUserAndBank(userId, bankId);
    return count < status.limits.maxCategoriesPerBank;
  }

  async upgradeToPro(userId: number, durationDays: number = PRO_SUBSCRIPTION.durationDays): Promise<void> {
    try {
      const expiryDate = calculateExpiryDate(durationDays);
      
      await this.userRepository.updateSubscription(userId, 'pro', expiryDate);
      
      logger.info('User upgraded to Pro:', {
        userId,
        expiryDate,
        durationDays,
      });
    } catch (error) {
      logger.error('Error upgrading to Pro:', { error, userId });
      throw error;
    }
  }

  async downgradeToFree(userId: number): Promise<void> {
    try {
      await this.userRepository.updateSubscription(userId, 'free', undefined);
      
      logger.info('User downgraded to Free:', { userId });
    } catch (error) {
      logger.error('Error downgrading to Free:', { error, userId });
      throw error;
    }
  }

  async checkAndUpdateExpiredSubscriptions(): Promise<void> {
    // This would be run as a cron job
    // Implementation would query for expired pro subscriptions and downgrade them
    logger.info('Checking expired subscriptions...');
  }
}

