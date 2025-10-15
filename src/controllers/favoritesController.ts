import { Context } from 'telegraf';
import { FavoriteRepository } from '../database/repositories/FavoriteRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { BankService } from '../services/bankService';
import { SubscriptionService } from '../services/subscriptionService';
import { UserService } from '../services/userService';
import { escapeMarkdown } from '../utils/helpers';
import { logger } from '../utils/logger';

export class FavoritesController {
  constructor(
    private favoriteRepository: FavoriteRepository,
    private categoryRepository: CategoryRepository,
    private bankService: BankService,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
  ) {}

  async handleFavorites(ctx: Context) {
    if (!ctx.from) return;

    try {
      const user = await this.userService.getUserByTelegramId(ctx.from.id);
      if (!user) {
        await ctx.reply('Используйте /start для начала работы.');
        return;
      }

      const favorites = await this.favoriteRepository.findByUserId(user.id);

      if (favorites.length === 0) {
        await ctx.reply(
          '⭐️ У вас пока нет избранных категорий.\n\n' +
            'Используйте /search для поиска категорий и добавления их в избранное.',
        );
        return;
      }

      // Group by bank
      const byBank = new Map<number, any[]>();
      
      for (const fav of favorites) {
        if (!byBank.has(fav.bankId)) {
          byBank.set(fav.bankId, []);
        }
        byBank.get(fav.bankId)!.push(fav);
      }

      let message = '⭐️ *Избранные категории:*\n\n';

      for (const [bankId, favs] of byBank) {
        const bank = await this.bankService.getBankById(bankId);
        if (!bank) continue;

        message += `🏦 *${escapeMarkdown(bank.name)}*\n`;
        
        for (const fav of favs) {
          message += `• ${escapeMarkdown(fav.category.name)}\n`;
          message += `  MCC: ${fav.category.mccCodes.slice(0, 3).join(', ')}`;
          if (fav.category.mccCodes.length > 3) {
            message += ` \\.\\.\\. \\+${fav.category.mccCodes.length - 3}`;
          }
          message += '\n';
        }
        message += '\n';
      }

      // Show limits for free users
      const status = await this.subscriptionService.getSubscriptionStatus(user.id);
      if (status.type === 'free') {
        const bankCount = byBank.size;
        message += `\n📊 Использовано банков: ${bankCount}/${status.limits.maxBanks}`;
      }

      await ctx.replyWithMarkdownV2(message);
    } catch (error) {
      logger.error('Error in handleFavorites:', { error, userId: ctx.from.id });
      throw error;
    }
  }

  async addFavorite(userId: number, categoryId: number, ctx: Context) {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        await ctx.reply('❌ Категория не найдена.');
        return;
      }

      // Check if already in favorites
      const exists = await this.favoriteRepository.exists(userId, category.bankId, categoryId);
      if (exists) {
        await ctx.reply('⚠️ Эта категория уже в избранном.');
        return;
      }

      // Check limits
      const canAddBank = await this.subscriptionService.canAddFavoriteBank(userId);
      if (!canAddBank) {
        await ctx.reply(
          '⚠️ Вы достигли лимита банков для Free тарифа.\n\n' +
            'Используйте /subscription для обновления до Pro.',
        );
        return;
      }

      const canAddCategory = await this.subscriptionService.canAddFavoriteCategory(
        userId,
        category.bankId,
      );
      if (!canAddCategory) {
        await ctx.reply(
          '⚠️ Вы достигли лимита категорий для этого банка на Free тарифе.\n\n' +
            'Используйте /subscription для обновления до Pro.',
        );
        return;
      }

      await this.favoriteRepository.add(userId, category.bankId, categoryId);

      await ctx.reply(`✅ Категория "${category.name}" добавлена в избранное!`);

      logger.info('Category added to favorites:', { userId, categoryId });
    } catch (error) {
      logger.error('Error adding favorite:', { error, userId, categoryId });
      throw error;
    }
  }

  async removeFavorite(userId: number, categoryId: number, ctx: Context) {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        await ctx.reply('❌ Категория не найдена.');
        return;
      }

      await this.favoriteRepository.remove(userId, category.bankId, categoryId);

      await ctx.reply(`✅ Категория "${category.name}" удалена из избранного.`);

      logger.info('Category removed from favorites:', { userId, categoryId });
    } catch (error) {
      logger.error('Error removing favorite:', { error, userId, categoryId });
      throw error;
    }
  }
}

