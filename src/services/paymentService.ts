import { Telegraf, Context } from 'telegraf';
import { PaymentRepository } from '../database/repositories/PaymentRepository';
import { SubscriptionService } from './subscriptionService';
import { PRO_SUBSCRIPTION } from '../config/constants';
import { logger } from '../utils/logger';
import { metrics } from '../utils/monitoring';

export class PaymentService {
  constructor(
    private bot: Telegraf,
    private paymentRepository: PaymentRepository,
    private subscriptionService: SubscriptionService,
  ) {}

  async createProSubscriptionInvoice(chatId: number, userId: number): Promise<void> {
    try {
      await this.bot.telegram.sendInvoice(chatId, {
        title: 'Cashback-Help Pro подписка',
        description: 'Безлимитные банки и категории на 30 дней',
        payload: `sub_pro_${userId}_${Date.now()}`,
        currency: 'XTR', // Telegram Stars
        prices: [
          {
            label: 'Pro подписка',
            amount: PRO_SUBSCRIPTION.price,
          },
        ],
      });

      logger.info('Pro subscription invoice sent:', { userId, chatId });
    } catch (error) {
      logger.error('Error sending invoice:', { error, userId, chatId });
      throw error;
    }
  }

  async handleSuccessfulPayment(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !('successful_payment' in ctx.message)) {
        return;
      }

      const payment = ctx.message.successful_payment;
      const userId = ctx.from!.id;

      // Save payment to database
      await this.paymentRepository.create({
        userId,
        transactionId: payment.telegram_payment_charge_id,
        amount: PRO_SUBSCRIPTION.price,
        status: 'completed',
        subscriptionType: 'pro',
      });

      // Upgrade user to Pro
      await this.subscriptionService.upgradeToPro(userId);

      // Track metrics
      metrics.paymentsTotal.inc({ status: 'completed' });
      metrics.subscriptionsTotal.inc({ type: 'pro' });

      await ctx.reply(
        '✅ Оплата успешно завершена!\n\n' +
          '🎉 Подписка Pro активирована на 30 дней.\n' +
          'Теперь вы можете добавлять неограниченное количество банков и категорий!',
      );

      logger.info('Payment processed successfully:', {
        userId,
        transactionId: payment.telegram_payment_charge_id,
      });
    } catch (error) {
      logger.error('Error handling successful payment:', { error });
      metrics.paymentsTotal.inc({ status: 'failed' });
      throw error;
    }
  }

  async handlePreCheckoutQuery(ctx: Context): Promise<void> {
    try {
      if (!ctx.preCheckoutQuery) {
        return;
      }

      // Validate the pre-checkout query
      await ctx.answerPreCheckoutQuery(true);

      logger.info('Pre-checkout query answered:', {
        userId: ctx.from?.id,
        queryId: ctx.preCheckoutQuery.id,
      });
    } catch (error) {
      logger.error('Error in pre-checkout query:', { error });
      await ctx.answerPreCheckoutQuery(false, 'Произошла ошибка. Попробуйте позже.');
    }
  }

  async getUserPaymentHistory(userId: number) {
    return this.paymentRepository.findByUserId(userId);
  }
}

