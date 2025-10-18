import { AnalyticsRepository } from '../database/repositories/AnalyticsRepository';
import { UserRepository } from '../database/repositories/UserRepository';
import { FavoriteRepository } from '../database/repositories/FavoriteRepository';
import { QueryLogDto, UserStats, AdminStats } from '../types/analytics';
import { logger } from '../utils/logger';

export class AnalyticsService {
  constructor(
    private analyticsRepository: AnalyticsRepository,
    private userRepository: UserRepository,
    private favoriteRepository: FavoriteRepository,
  ) {}

  async logQuery(data: QueryLogDto): Promise<void> {
    try {
      await this.analyticsRepository.createLog(data);
    } catch (error) {
      // Don't throw - logging should not break the main flow
      logger.error('Error logging query:', { error, data });
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const totalQueries = await this.analyticsRepository.getUserQueryCount(userId);
      const queriesByType = await this.analyticsRepository.getUserQueriesByType(userId);
      const favoriteCategories = await this.favoriteRepository.countByUser(userId);

      const queriesByTypeMap = queriesByType.reduce(
        (acc, { queryType, count }) => {
          acc[queryType as keyof typeof acc] = Number(count);
          return acc;
        },
        { mcc_search: 0, category_search: 0, favorite_view: 0 },
      );

      return {
        totalQueries,
        queriesByType: queriesByTypeMap,
        favoriteCategories,
        subscriptionType: user.subscriptionType,
      };
    } catch (error) {
      logger.error('Error getting user stats:', { error, userId });
      throw error;
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      const totalUsers = await this.userRepository.countTotal();
      const activeUsers = await this.userRepository.countActive(7);
      const proUsers = await this.userRepository.countBySubscriptionType('pro');
      const totalQueries = await this.analyticsRepository.getTotalQueries();
      const averageResponseTime = await this.analyticsRepository.getAverageResponseTime();
      const popularBanks = await this.analyticsRepository.getPopularBanks(10);

      return {
        totalUsers,
        activeUsers,
        proUsers,
        totalQueries,
        averageResponseTime,
        popularBanks,
      };
    } catch (error) {
      logger.error('Error getting admin stats:', { error });
      throw error;
    }
  }
}
