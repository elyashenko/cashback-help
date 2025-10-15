# 💳 Cashback-Help Bot

Telegram bot for searching MCC codes by cashback categories for various banks and identifying cashback categories by MCC codes.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)

## ✨ Features

### For Users
- 🔍 **Natural Language Search** - Ask questions in plain Russian
- 🏦 **Multi-Bank Support** - Search across different banks' cashback programs
- ⭐️ **Favorites** - Save frequently used categories for quick access
- 📊 **Statistics** - Track your search history and usage patterns
- 🤖 **AI-Powered** - Uses LangChain with DeepSeek/Yandex GPT for intelligent query parsing

### Free vs Pro Plans

| Feature | Free | Pro |
|---------|------|-----|
| Banks | Up to 4 | Unlimited ✨ |
| Favorite Categories per Bank | Up to 4 | Unlimited ✨ |
| Priority Processing | ❌ | ✅ |
| Rate Limit | 10 req/min | 50 req/min |
| Price | Free | 300 Telegram Stars/month |

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 18.0.0 | Runtime |
| TypeScript | 5.6 | Type Safety |
| Telegraf | 4.16+ | Telegram Bot Framework |
| PostgreSQL | 15+ | Database |
| TypeORM | 0.3.20 | ORM |
| LangChain | 0.3+ | AI/ML Integration |
| Winston | 3.14+ | Logging |
| Prometheus | - | Metrics |
| Sentry | 8.0+ | Error Tracking |
| Docker | - | Containerization |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js >= 18.0.0
- PostgreSQL >= 15
- npm >= 9.0.0
- Docker & Docker Compose (optional)

## 🚀 Installation

### Option 1: Local Development

```bash
# 1. Clone repository
git clone https://github.com/yourusername/cashback-help-bot.git
cd cashback-help-bot

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env file with your credentials

# 4. Setup database
# Create PostgreSQL database first
createdb cashback_bot

# 5. Run migrations
psql cashback_bot < src/database/migrations/001_initial_schema.sql

# 6. Seed data (optional)
npm run seed

# 7. Start development
npm run dev
```

### Option 2: Docker

```bash
# 1. Clone repository
git clone https://github.com/yourusername/cashback-help-bot.git
cd cashback-help-bot

# 2. Setup environment
cp .env.example .env
# Edit .env file with your credentials

# 3. Start with Docker Compose
docker-compose up -d

# 4. View logs
docker-compose logs -f bot
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token          # Get from @BotFather
BOT_MODE=polling                           # polling or webhook
WEBHOOK_URL=https://yourdomain.com/webhook # Only for webhook mode

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cashback_bot
DATABASE_LOGGING=true

# LLM Providers
LLM_PROVIDER=deepseek                      # deepseek or yandex
DEEPSEEK_API_KEY=your_deepseek_api_key    # Get from https://platform.deepseek.com
YANDEX_API_KEY=your_yandex_api_key        # Get from Yandex Cloud

# Monitoring
SENTRY_DSN=your_sentry_dsn                # Optional, for error tracking
PROMETHEUS_PORT=9090

# App Settings
NODE_ENV=development
LOG_LEVEL=info
CACHE_TTL=3600

# Subscription Limits
FREE_MAX_BANKS=4
FREE_MAX_CATEGORIES_PER_BANK=4
PRO_SUBSCRIPTION_PRICE=300

# Admin
ADMIN_USER_IDS=123456789,987654321        # Comma-separated Telegram user IDs
```

### Getting API Keys

#### Telegram Bot Token
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token

#### DeepSeek API Key
1. Visit [DeepSeek Platform](https://platform.deepseek.com)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key

#### Yandex GPT API Key
1. Go to [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Create a service account
3. Assign required roles
4. Create API key

## 📖 Usage

### User Commands

- `/start` - Start working with the bot
- `/help` - Show help message
- `/search` - Start searching for categories or MCC codes
- `/banks` - List available banks
- `/favorites` - Manage favorite categories
- `/subscription` - View subscription info and upgrade to Pro
- `/stats` - View your usage statistics

### Query Examples

Just send a message in natural language:

```
"какие mcc-коды для одежды в Сбере"
"к какой категории относится код 5722"
"категория кэшбэка для 4111 в Тинькофф"
"рестораны альфа банк"
```

### Admin Commands

- `/admin_add_bank` - Add a new bank
- `/admin_parse_pdf` - Upload and parse PDF with categories
- `/admin_stats` - View bot statistics

## 💻 Development

### Available Scripts

```bash
npm run dev          # Development mode with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Lint code
npm run lint:fix     # Fix linting errors
npm run format       # Format code with Prettier
npm run typecheck    # Type check without emitting
npm run seed         # Seed database with sample data
```

### Database Migrations

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration
npm run migration:generate -- -n MigrationName
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build image
docker build -t cashback-help-bot .

# Run container
docker run -d \
  --name cashback-bot \
  --env-file .env \
  -p 9090:9090 \
  cashback-help-bot
```

### Railway/Render Deployment

1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy from main branch

### Environment Variables for Production

Make sure to set these in production:

- `NODE_ENV=production`
- `BOT_MODE=webhook` (recommended)
- `WEBHOOK_URL=https://yourdomain.com/webhook`
- `DATABASE_LOGGING=false`
- `LOG_LEVEL=warn`
- Enable `SENTRY_DSN` for error tracking

## 📁 Project Structure

```
cashback-help-bot/
├── src/
│   ├── config/           # Configuration files
│   ├── database/         # Database entities, migrations, repositories
│   ├── services/         # Business logic
│   ├── controllers/      # Bot command handlers
│   ├── middleware/       # Bot middleware
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── app.ts           # Application entry point
├── data/                # Seed data
├── tests/               # Test files
├── docs/                # Documentation
├── migrations/          # SQL migrations
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── README.md           # This file
```

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- Telegram: [@yourusername](https://t.me/yourusername)

## 🙏 Acknowledgments

- [Telegraf](https://telegraf.js.org/) - Telegram Bot Framework
- [LangChain](https://js.langchain.com/) - AI/ML Integration
- [TypeORM](https://typeorm.io/) - ORM Framework
- All contributors and supporters

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](docs/)
2. Open an [issue](https://github.com/yourusername/cashback-help-bot/issues)
3. Contact via Telegram: [@yourusername](https://t.me/yourusername)

---

Made with ❤️ by [Your Name]

