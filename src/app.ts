import 'reflect-metadata';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { bot, startBot } from './config/telegram';
import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';

// Repositories
import { UserRepository } from './database/repositories/UserRepository';
import { BankRepository } from './database/repositories/BankRepository';
import { CategoryRepository } from './database/repositories/CategoryRepository';
import { FavoriteRepository } from './database/repositories/FavoriteRepository';
import { PaymentRepository } from './database/repositories/PaymentRepository';
import { AnalyticsRepository } from './database/repositories/AnalyticsRepository';
import { UserCashbackRepository } from './database/repositories/UserCashbackRepository';
import { AdminSettingsRepository } from './database/repositories/AdminSettingsRepository';

// Services
import { UserService } from './services/userService';
import { BankService } from './services/bankService';
import { CategoryService } from './services/categoryService';
import { SubscriptionService } from './services/subscriptionService';
import { PaymentService } from './services/paymentService';
import { LLMService } from './services/llmService';
import { AnalyticsService } from './services/analyticsService';
import { PDFService } from './services/pdfService';
import { UserCashbackService } from './services/userCashbackService';
import { AdminSettingsService } from './services/adminSettingsService';
import { ServiceType } from './database/entities/AdminSettings';

// Controllers
import { BotController } from './controllers/botController';
import { SearchController } from './controllers/searchController';
import { FavoritesController } from './controllers/favoritesController';
import { PaymentController } from './controllers/paymentController';
import { AdminController } from './controllers/adminController';
import { CashbackController } from './controllers/cashbackController';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { createRateLimitMiddleware } from './middleware/rateLimit';
import { createSubscriptionMiddleware } from './middleware/subscription';
import { createAnalyticsMiddleware } from './middleware/analytics';
import { createFSMMiddleware } from './middleware/fsm';
import { createServiceAccessMiddleware } from './middleware/serviceAccess';
import { createSessionMiddleware } from './middleware/session';

// Load environment variables
dotenv.config();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

async function bootstrap() {
  try {
    logger.info('Starting Cashback-Help Bot...');

    // Initialize database
    await initializeDatabase();

    // Initialize repositories
    const userRepository = new UserRepository();
    const bankRepository = new BankRepository();
    const categoryRepository = new CategoryRepository();
    const favoriteRepository = new FavoriteRepository();
    const paymentRepository = new PaymentRepository();
    const analyticsRepository = new AnalyticsRepository();
    const userCashbackRepository = new UserCashbackRepository();
    const adminSettingsRepository = new AdminSettingsRepository();

    // Initialize admin settings
    await adminSettingsRepository.initializeDefaultSettings();

    // Initialize services
    const userService = new UserService(userRepository);
    const bankService = new BankService(bankRepository);
    const categoryService = new CategoryService(categoryRepository);
    const subscriptionService = new SubscriptionService(userRepository, favoriteRepository);
    const paymentService = new PaymentService(bot, paymentRepository, subscriptionService);
    const llmService = new LLMService();
    const analyticsService = new AnalyticsService(
      analyticsRepository,
      userRepository,
      favoriteRepository,
    );
    const pdfService = new PDFService();
    const userCashbackService = new UserCashbackService(
      userCashbackRepository,
      subscriptionService,
    );
    const adminSettingsService = new AdminSettingsService(adminSettingsRepository);

    // Initialize controllers
    const botController = new BotController(userService, bankService, analyticsService);
    const searchController = new SearchController(
      categoryService,
      bankService,
      llmService,
      analyticsService,
      userService,
    );
    const favoritesController = new FavoritesController(
      favoriteRepository,
      categoryRepository,
      bankService,
      subscriptionService,
      userService,
    );
    const paymentController = new PaymentController(
      paymentService,
      subscriptionService,
      userService,
    );
    const adminController = new AdminController(categoryService, pdfService, analyticsService, adminSettingsService);
    const cashbackController = new CashbackController(
      userCashbackService,
      categoryService,
      categoryRepository,
      bankService,
      userService,
    );

    // Apply middleware
    bot.use(errorHandler);
    bot.use(createSessionMiddleware());
    bot.use(createAnalyticsMiddleware());
    bot.use(createSubscriptionMiddleware(subscriptionService));
    bot.use(createRateLimitMiddleware());
    bot.use(createFSMMiddleware());
    bot.use(createServiceAccessMiddleware(adminSettingsService));

    // Register commands
    bot.command('start', (ctx) => botController.handleStart(ctx));
    bot.command('help', (ctx) => botController.handleHelp(ctx));
    bot.command('banks', (ctx) => botController.handleBanks(ctx));
    bot.command('stats', (ctx) => botController.handleStats(ctx));
    bot.command('search', (ctx) => searchController.handleSearch(ctx));
    bot.command('favorites', (ctx) => favoritesController.handleFavorites(ctx));
    bot.command('subscription', (ctx) => paymentController.handleSubscription(ctx));
    bot.command('set_cashback', (ctx) => cashbackController.handleSetCashback(ctx));
    bot.command('my_cashback', (ctx) => cashbackController.handleMyCashback(ctx));
    bot.command('remove_cashback', (ctx) => cashbackController.handleRemoveCashback(ctx));

    // Admin commands
    bot.command('admin_add_bank', (ctx) => adminController.handleAdminAddBank(ctx));
    bot.command('admin_parse_pdf', (ctx) => adminController.handleAdminParsePDF(ctx));
    bot.command('admin_stats', (ctx) => adminController.handleAdminStats(ctx));
    bot.command('admin_services', (ctx) => adminController.handleAdminServices(ctx));

    // Handle text queries
    bot.on('text', (ctx) => {
      const session = ctx.session;
      const cashbackSession = session?.cashback;
      const adminSession = session?.admin;

      logger.debug('Text message received', { 
        userId: ctx.from?.id, 
        text: ctx.message.text,
        hasSession: !!session,
        hasAdminSession: !!adminSession,
        waitingForUserId: adminSession?.waitingForUserId
      });

      // Check if admin is waiting for user ID input
      if (adminSession?.waitingForUserId) {
        logger.debug('Processing admin user ID input', { 
          userId: ctx.from?.id, 
          serviceType: adminSession.waitingForUserId 
        });
        adminController.handleUserIdInput(ctx);
      }
      // Check if user is waiting for cashback rate input
      else if (cashbackSession?.waitingForRates) {
        cashbackController.handleCashbackRateInput(ctx);
      } else if (session?.favorites?.waitingForCashbackRate) {
        favoritesController.handleCashbackRateInput(ctx);
      } else if (session?.favorites?.selectedBank && !session?.favorites?.waitingForCashbackRate) {
        favoritesController.handleSearchResults(ctx, ctx.message.text);
      } else {
        logger.debug('Processing as search query', { userId: ctx.from?.id });
        searchController.handleTextQuery(ctx);
      }
    });

    // Handle callback queries
    bot.action('buy_pro', (ctx) => paymentController.handleBuyProCallback(ctx));

    // Cashback callback handlers
    bot.action(/^select_bank:(.+)$/, (ctx) => {
      const bankCode = ctx.match[1];
      cashbackController.handleBankSelect(ctx, bankCode);
    });

    bot.action(/^toggle_category:(\d+)$/, (ctx) => {
      const categoryId = parseInt(ctx.match[1]);
      cashbackController.handleToggleCategory(ctx, categoryId);
    });

    bot.action('confirm_categories', (ctx) => {
      cashbackController.handleConfirmCategories(ctx);
    });

    bot.action(/^remove_cashback:(\d+):(\d+)$/, (ctx) => {
      const bankId = parseInt(ctx.match[1]);
      const categoryId = parseInt(ctx.match[2]);
      cashbackController.handleRemoveCashbackConfirm(ctx, bankId, categoryId);
    });

    // Favorites callback handlers
    bot.action('favorites_add', (ctx) => favoritesController.handleAddFavorites(ctx));
    bot.action('favorites_remove', (ctx) => favoritesController.handleRemoveFavorites(ctx));

    bot.action(/^fav_select_bank:(.+)$/, (ctx) => {
      const bankCode = ctx.match[1];
      favoritesController.handleSelectBank(ctx, bankCode);
    });

    bot.action(/^fav_search:(.+)$/, (ctx) => {
      const bankCode = ctx.match[1];
      favoritesController.handleSearchCategories(ctx, bankCode);
    });

    bot.action(/^fav_select_category:(.+):(\d+)$/, (ctx) => {
      const bankCode = ctx.match[1];
      const categoryId = parseInt(ctx.match[2]);
      favoritesController.handleSelectCategory(ctx, bankCode, categoryId);
    });

    bot.action(/^fav_show_mcc:(\d+)$/, (ctx) => {
      const categoryId = parseInt(ctx.match[1]);
      favoritesController.handleShowMccCodes(ctx, categoryId);
    });

    bot.action(/^fav_add_no_rate:(.+):(\d+)$/, (ctx) => {
      const bankCode = ctx.match[1];
      const categoryId = parseInt(ctx.match[2]);
      favoritesController.handleAddNoRate(ctx, bankCode, categoryId);
    });

    bot.action(/^fav_remove:(\d+):(\d+)$/, (ctx) => {
      const bankId = parseInt(ctx.match[1]);
      const categoryId = parseInt(ctx.match[2]);
      favoritesController.handleRemoveCategory(ctx, bankId, categoryId);
    });

    // Admin callback handlers
    bot.action(/^admin_service:(.+)$/, (ctx) => {
      const serviceType = ctx.match[1] as ServiceType;
      adminController.handleServiceSelection(ctx, serviceType);
    });

    bot.action(/^admin_toggle_global:(.+)$/, (ctx) => {
      const serviceType = ctx.match[1] as ServiceType;
      adminController.handleToggleGlobalService(ctx, serviceType);
    });

    bot.action(/^admin_user_settings:(.+)$/, (ctx) => {
      const serviceType = ctx.match[1] as ServiceType;
      adminController.handleUserServiceSettings(ctx, serviceType);
    });

    bot.action(/^admin_toggle_user:(.+):(\d+)$/, (ctx) => {
      const serviceType = ctx.match[1] as ServiceType;
      const userId = parseInt(ctx.match[2]);
      adminController.handleToggleUserService(ctx, serviceType, userId);
    });

    bot.action(/^admin_remove_user:(.+):(\d+)$/, (ctx) => {
      const serviceType = ctx.match[1] as ServiceType;
      const userId = parseInt(ctx.match[2]);
      adminController.handleRemoveUserSetting(ctx, serviceType, userId);
    });

    bot.action('admin_services', (ctx) => adminController.handleAdminServices(ctx));
    bot.action('admin_status_all', (ctx) => adminController.handleStatusAllServices(ctx));
    bot.action('admin_reset_settings', (ctx) => adminController.handleResetSettings(ctx));

    // Handle payments
    bot.on('pre_checkout_query', (ctx) => paymentService.handlePreCheckoutQuery(ctx));
    bot.on('successful_payment', (ctx) => paymentService.handleSuccessfulPayment(ctx));

    // Set bot commands for menu
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'help', description: 'Показать справку' },
      { command: 'search', description: 'Поиск категорий и MCC-кодов' },
      { command: 'banks', description: 'Список доступных банков' },
      { command: 'favorites', description: 'Избранные категории' },
      { command: 'set_cashback', description: 'Установить процент кэшбэка' },
      { command: 'my_cashback', description: 'Мои настройки кэшбэка' },
      { command: 'subscription', description: 'Управление подпиской' },
      { command: 'stats', description: 'Ваша статистика' },
    ]);

    // Start bot
    await startBot();

    logger.info('✅ Bot started successfully');
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  Sentry.captureException(error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  Sentry.captureException(error);
  process.exit(1);
});

// Start application
bootstrap();
