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

// Services
import { UserService } from './services/userService';
import { BankService } from './services/bankService';
import { CategoryService } from './services/categoryService';
import { SubscriptionService } from './services/subscriptionService';
import { PaymentService } from './services/paymentService';
import { LLMService } from './services/llmService';
import { AnalyticsService } from './services/analyticsService';
import { PDFService } from './services/pdfService';

// Controllers
import { BotController } from './controllers/botController';
import { SearchController } from './controllers/searchController';
import { FavoritesController } from './controllers/favoritesController';
import { PaymentController } from './controllers/paymentController';
import { AdminController } from './controllers/adminController';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { createRateLimitMiddleware } from './middleware/rateLimit';
import { createSubscriptionMiddleware } from './middleware/subscription';
import { createAnalyticsMiddleware } from './middleware/analytics';

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
    const adminController = new AdminController(
      bankService,
      categoryService,
      pdfService,
      analyticsService,
    );

    // Apply middleware
    bot.use(errorHandler);
    bot.use(createAnalyticsMiddleware(analyticsService));
    bot.use(createSubscriptionMiddleware(subscriptionService));
    bot.use(createRateLimitMiddleware());

    // Register commands
    bot.command('start', (ctx) => botController.handleStart(ctx));
    bot.command('help', (ctx) => botController.handleHelp(ctx));
    bot.command('banks', (ctx) => botController.handleBanks(ctx));
    bot.command('stats', (ctx) => botController.handleStats(ctx));
    bot.command('search', (ctx) => searchController.handleSearch(ctx));
    bot.command('favorites', (ctx) => favoritesController.handleFavorites(ctx));
    bot.command('subscription', (ctx) => paymentController.handleSubscription(ctx));

    // Admin commands
    bot.command('admin_add_bank', (ctx) => adminController.handleAdminAddBank(ctx));
    bot.command('admin_parse_pdf', (ctx) => adminController.handleAdminParsePDF(ctx));
    bot.command('admin_stats', (ctx) => adminController.handleAdminStats(ctx));

    // Handle text queries
    bot.on('text', (ctx) => searchController.handleTextQuery(ctx));

    // Handle callback queries
    bot.action('buy_pro', (ctx) => paymentController.handleBuyProCallback(ctx));

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

