# 🚀 Запуск проекта без Docker

## Вариант 1: Установка PostgreSQL локально

### macOS (через Homebrew)
```bash
# Установить PostgreSQL
brew install postgresql@15

# Запустить службу
brew services start postgresql@15

# Создать базу данных
createdb cashback_bot

# Применить миграции
psql cashback_bot < src/database/migrations/001_initial_schema.sql
```

### Ubuntu/Debian
```bash
# Установить PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Создать пользователя и базу данных
sudo -u postgres psql
CREATE USER cashback_user WITH PASSWORD 'password';
CREATE DATABASE cashback_bot OWNER cashback_user;
GRANT ALL PRIVILEGES ON DATABASE cashback_bot TO cashback_user;
\q

# Применить миграции
psql -U cashback_user -d cashback_bot -f src/database/migrations/001_initial_schema.sql
```

## Вариант 2: Использование SQLite (для разработки)

Если не хотите устанавливать PostgreSQL, можно временно использовать SQLite:

1. Измените `DATABASE_URL` в `.env`:
```env
DATABASE_URL=sqlite:./database.sqlite
```

2. Установите SQLite драйвер:
```bash
npm install sqlite3
```

3. Обновите `src/config/database.ts`:
```typescript
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true, // Включить для SQLite
  logging: process.env.DATABASE_LOGGING === 'true',
  entities: [User, Bank, CashbackCategory, UserFavoriteCategory, PaymentHistory, QueryLog],
});
```

## Вариант 3: Запуск Docker Desktop

1. Установите Docker Desktop для macOS
2. Запустите Docker Desktop
3. Выполните:
```bash
docker-compose up -d postgres
```

## После настройки базы данных

1. **Обновите .env файл** с правильными данными:
```env
# Для локального PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/cashback_bot

# Или для SQLite
DATABASE_URL=sqlite:./database.sqlite
```

2. **Добавьте токен бота**:
```env
BOT_TOKEN=your_actual_bot_token_from_botfather
```

3. **Запустите проект**:
```bash
npm run dev
```

4. **Загрузите тестовые данные** (опционально):
```bash
npm run seed
```

## Проверка работы

1. Откройте Telegram
2. Найдите вашего бота по токену
3. Отправьте `/start`
4. Попробуйте команды: `/help`, `/banks`

## Решение проблем

### Ошибка подключения к БД
```bash
# Проверьте, что PostgreSQL запущен
brew services list | grep postgresql

# Или для Linux
sudo systemctl status postgresql
```

### Ошибка токена бота
- Убедитесь, что токен получен от @BotFather
- Проверьте, что токен скопирован полностью без пробелов

### Ошибки TypeScript
```bash
npm run typecheck
```

### Ошибки линтинга
```bash
npm run lint:fix
```

