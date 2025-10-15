# 🚀 Quick Start Guide

## Быстрый старт для разработки

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` и заполните необходимые переменные:

```bash
# Минимальная конфигурация для запуска
BOT_TOKEN=your_telegram_bot_token_from_botfather
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cashback_bot
DEEPSEEK_API_KEY=your_deepseek_api_key  # Или используйте Yandex GPT
```

### 3. Запуск базы данных

#### Вариант A: Docker Compose (рекомендуется)

```bash
docker-compose up -d postgres
```

#### Вариант B: Локальный PostgreSQL

```bash
# Создайте базу данных
createdb cashback_bot

# Примените миграции
psql cashback_bot < src/database/migrations/001_initial_schema.sql
```

### 4. Заполните тестовыми данными (опционально)

```bash
npm run seed
```

Это добавит:
- 2 банка (Сбербанк, Тинькофф)
- Несколько категорий кэшбэка для каждого банка
- MCC-коды

### 5. Запуск бота

```bash
npm run dev
```

Бот запустится в режиме разработки с автоматической перезагрузкой при изменении файлов.

## 🐳 Запуск через Docker

Самый простой способ запустить весь проект:

```bash
# Создайте .env файл
cp .env.example .env
# Отредактируйте .env

# Запустите все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f bot

# Остановка
docker-compose down
```

## 🧪 Тестирование

```bash
# Запустить все тесты
npm test

# Запустить в watch режиме
npm run test:watch

# Проверить покрытие
npm run test:coverage
```

## 📝 Проверка кода

```bash
# Линтинг
npm run lint

# Исправление ошибок линтинга
npm run lint:fix

# Форматирование кода
npm run format

# Проверка типов
npm run typecheck
```

## 🔧 Production Build

```bash
# Сборка
npm run build

# Запуск production версии
npm start
```

## 📱 Команды бота для тестирования

После запуска откройте своего бота в Telegram и попробуйте:

1. `/start` - Регистрация
2. `/help` - Справка
3. `/banks` - Список банков
4. Отправьте текст: "какие mcc-коды для одежды в Сбере"
5. Отправьте текст: "к какой категории относится код 5811"

## 🐛 Решение проблем

### База данных не подключается

```bash
# Проверьте, что PostgreSQL запущен
docker-compose ps

# Или для локального PostgreSQL
pg_isready
```

### Бот не отвечает

1. Проверьте `BOT_TOKEN` в `.env`
2. Убедитесь, что токен валидный (получен от @BotFather)
3. Проверьте логи: `docker-compose logs bot` или терминал

### LangChain ошибки

1. Проверьте `DEEPSEEK_API_KEY` или `YANDEX_API_KEY`
2. Убедитесь, что у вас есть доступ к API
3. Попробуйте переключить провайдера в `.env`

## 📚 Дополнительная информация

- [Полная документация](README.md)
- [API документация](docs/API.md)
- [Схема базы данных](docs/DATABASE.md)
- [Правила разработки](.cursorrules)

## 🎯 Следующие шаги

1. **Добавьте больше банков**: Используйте `/admin_add_bank` (нужно быть в `ADMIN_USER_IDS`)
2. **Загрузите PDF с категориями**: `/admin_parse_pdf`
3. **Настройте webhook** для production (вместо polling)
4. **Добавьте Sentry** для мониторинга ошибок
5. **Настройте Prometheus** для метрик

## 💡 Полезные команды

```bash
# Просмотр структуры базы данных
psql cashback_bot -c "\dt"

# Экспорт базы данных
pg_dump cashback_bot > backup.sql

# Просмотр логов в реальном времени
tail -f logs/combined.log

# Очистка
npm run clean  # (нужно добавить в package.json)
rm -rf dist node_modules
```

---

Удачи в разработке! 🚀

