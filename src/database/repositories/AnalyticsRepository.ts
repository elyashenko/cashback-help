import { AppDataSource } from '../../config/database';
import { QueryLog } from '../entities/QueryLog';
import { QueryLogDto } from '../../types/analytics';

export class AnalyticsRepository {
  private repository = AppDataSource.getRepository(QueryLog);

  async createLog(data: QueryLogDto): Promise<QueryLog> {
    const log = this.repository.create(data);
    return this.repository.save(log);
  }

  async getUserQueryCount(userId: number): Promise<number> {
    return this.repository.count({ where: { userId } });
  }

  async getUserQueriesByType(
    userId: number,
  ): Promise<Array<{ queryType: string; count: number }>> {
    return this.repository
      .createQueryBuilder('log')
      .select('log.query_type', 'queryType')
      .addSelect('COUNT(*)', 'count')
      .where('log.user_id = :userId', { userId })
      .groupBy('log.query_type')
      .getRawMany();
  }

  async getTotalQueries(): Promise<number> {
    return this.repository.count();
  }

  async getAverageResponseTime(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('log')
      .select('AVG(log.response_time_ms)', 'avg')
      .getRawOne();

    return parseFloat(result.avg) || 0;
  }

  async getPopularBanks(limit: number = 10): Promise<Array<{ name: string; count: number }>> {
    return this.repository
      .createQueryBuilder('log')
      .select('log.bank_name', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('log.bank_name IS NOT NULL')
      .groupBy('log.bank_name')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getQueriesInTimeRange(startDate: Date, endDate: Date): Promise<QueryLog[]> {
    return this.repository
      .createQueryBuilder('log')
      .where('log.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('log.created_at', 'DESC')
      .getMany();
  }
}

