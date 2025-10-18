import { AppDataSource } from '../../config/database';
import { PaymentHistory } from '../entities/PaymentHistory';

export class PaymentRepository {
  private repository = AppDataSource.getRepository(PaymentHistory);

  async create(data: {
    userId: number;
    transactionId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    subscriptionType: string;
  }): Promise<PaymentHistory> {
    const payment = this.repository.create(data);
    return this.repository.save(payment);
  }

  async findByTransactionId(transactionId: string): Promise<PaymentHistory | null> {
    return this.repository.findOne({ where: { transactionId } });
  }

  async findByUserId(userId: number): Promise<PaymentHistory[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'failed' | 'refunded',
  ): Promise<void> {
    await this.repository.update({ transactionId }, { status });
  }

  async countByStatus(status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    return parseInt(result.total, 10) || 0;
  }
}
