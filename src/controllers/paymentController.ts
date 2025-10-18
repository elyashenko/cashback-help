import { Context } from 'telegraf';
import { PaymentService } from '../services/paymentService';
import { SubscriptionService } from '../services/subscriptionService';
import { UserService } from '../services/userService';
import { PRO_SUBSCRIPTION } from '../config/constants';
import { formatExpiryDate } from '../utils/helpers';
import { logger } from '../utils/logger';

export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
  ) {}

  async handleSubscription(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getUserByTelegramId(ctx.from.id);
      if (!user) {
        await ctx.reply('Используйте /start для начала работы.');
        return;
      }

      const status = await this.subscriptionService.getSubscriptionStatus(user.id);

      let message = '💳 *Информация о подписке*\n\n';

      if (status.type === 'pro' && status.isActive && status.expiryDate) {
        message += `✨ Тариф: *Pro*\n`;
        message += `📅 Действует до: ${formatExpiryDate(status.expiryDate)}\n\n`;
        message += `✅ Неограниченное количество банков\n`;
        message += `✅ Неограниченное количество категорий\n`;
        message += `✅ Приоритетная обработка запросов`;
      } else {
        message += `📦 Тариф: *Free*\n\n`;
        message += `🏦 Банков: до ${status.limits.maxBanks}\n`;
        message += `📁 Категорий на банк: до ${status.limits.maxCategoriesPerBank}\n\n`;
        message += `*Upgrade до Pro:*\n`;
        message += `✨ Неограниченное количество банков и категорий\n`;
        message += `⚡️ Приоритетная обработка запросов\n`;
        message += `💰 Цена: ${PRO_SUBSCRIPTION.price} Telegram Stars/месяц\n\n`;
        message += `Нажмите кнопку ниже для оформления Pro подписки\\!`;

        await ctx.replyWithMarkdownV2(message, {
          reply_markup: {
            inline_keyboard: [[{ text: '✨ Купить Pro подписку', callback_data: 'buy_pro' }]],
          },
        });
        return;
      }

      await ctx.replyWithMarkdownV2(message);
    } catch (error) {
      logger.error('Error in handleSubscription:', { error, userId: ctx.from.id });
      throw error;
    }
  }

  async handleBuyProCallback(ctx: Context) {
    if (!ctx.from || !ctx.chat) return;

    try {
      const user = await this.userService.getUserByTelegramId(ctx.from.id);
      if (!user) {
        await ctx.answerCbQuery('Ошибка: пользователь не найден');
        return;
      }

      // Check if already Pro
      const status = await this.subscriptionService.getSubscriptionStatus(user.id);
      if (status.type === 'pro' && status.isActive) {
        await ctx.answerCbQuery('У вас уже есть активная Pro подписка');
        return;
      }

      await this.paymentService.createProSubscriptionInvoice(ctx.chat.id, user.id);
      await ctx.answerCbQuery('Счет отправлен');

      logger.info('Pro subscription invoice requested:', { userId: user.id });
    } catch (error) {
      logger.error('Error in handleBuyProCallback:', { error, userId: ctx.from.id });
      await ctx.answerCbQuery('Произошла ошибка. Попробуйте позже.');
    }
  }
}
