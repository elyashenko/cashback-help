# FSM (Finite State Machine) для Telegram Bot

## Обзор

Мы реализовали систему FSM для управления состояниями пользователей в Telegram боте, используя существующую архитектуру Telegraf с улучшенным хранением сессий в PostgreSQL.

## Что было сделано

### 1. Улучшение хранения сессий
- **До**: Сессии хранились в памяти (in-memory) - данные терялись при перезапуске
- **После**: Сессии хранятся в PostgreSQL с использованием Kysely ORM
- **Преимущества**: Персистентность данных, масштабируемость, надежность

### 2. Реализация FSM системы
- Создан `FSMManager` для управления состояниями
- Определены состояния для различных сценариев бота
- Добавлен middleware для автоматической проверки состояний

## Архитектура FSM

### Состояния (BotState)
```typescript
enum BotState {
  IDLE = 'idle',                                    // Пользователь не выполняет никаких действий
  SETTING_CASHBACK_BANK = 'setting_cashback_bank', // Выбор банка для настройки кэшбэка
  SETTING_CASHBACK_CATEGORIES = 'setting_cashback_categories', // Выбор категорий
  SETTING_CASHBACK_RATES = 'setting_cashback_rates', // Ввод процентов кэшбэка
  ADDING_FAVORITES_BANK = 'adding_favorites_bank', // Выбор банка для избранного
  ADDING_FAVORITES_CATEGORY = 'adding_favorites_category', // Выбор категории
  ADDING_FAVORITES_RATE = 'adding_favorites_rate', // Ввод процента для избранного
  SEARCHING = 'searching',                          // Поиск категорий
  WAITING_FOR_PAYMENT = 'waiting_for_payment',     // Ожидание платежа
}
```

### Переходы состояний
FSM автоматически управляет переходами между состояниями на основе действий пользователя:

```
IDLE → SETTING_CASHBACK_BANK → SETTING_CASHBACK_CATEGORIES → SETTING_CASHBACK_RATES → IDLE
IDLE → ADDING_FAVORITES_BANK → ADDING_FAVORITES_CATEGORY → ADDING_FAVORITES_RATE → IDLE
IDLE → SEARCHING → IDLE
IDLE → WAITING_FOR_PAYMENT → IDLE
```

## Использование

### В контроллерах

```typescript
import { FSMManager } from '../services/fsmService';
import { BotState } from '../types/fsm';

// Установка состояния
FSMManager.setState(ctx.session!, BotState.SETTING_CASHBACK_BANK);

// Проверка состояния
if (FSMManager.isInState(ctx.session!, BotState.SETTING_CASHBACK_BANK)) {
  // Пользователь находится в правильном состоянии
}

// Переход к следующему состоянию
FSMManager.transition(ctx.session!, 'bank_selected');

// Сохранение данных в состоянии
FSMManager.setData(ctx.session!, 'selectedBank', bankCode);

// Получение данных из состояния
const bankCode = FSMManager.getData(ctx.session!, 'selectedBank');

// Сброс состояния
FSMManager.reset(ctx.session!);
```

### Middleware

FSM middleware автоматически:
- Логирует переходы состояний
- Проверяет истечение сессий (30 минут неактивности)
- Обновляет время последней активности

## Преимущества

### 1. Надежность
- Сессии сохраняются в PostgreSQL
- Автоматический сброс при ошибках
- Проверка валидности состояний

### 2. Отладка
- Подробное логирование состояний
- Трассировка действий пользователей
- Легкая диагностика проблем

### 3. UX
- Защита от неожиданных действий
- Автоматическое восстановление после ошибок
- Четкие переходы между этапами

### 4. Масштабируемость
- Поддержка множественных инстансов бота
- Централизованное хранение состояний
- Возможность анализа пользовательских потоков

## Миграция базы данных

Для работы FSM необходимо выполнить миграцию:

```sql
-- Создание таблицы sessions
CREATE TABLE IF NOT EXISTS sessions (
    key VARCHAR(255) PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для производительности
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);
```

## Мониторинг

FSM система интегрирована с системой логирования:
- Все переходы состояний логируются
- Ошибки FSM отслеживаются
- Метрики производительности доступны

## Пример использования в CashbackController

```typescript
async handleSetCashback(ctx: Context) {
  // Устанавливаем начальное состояние
  FSMManager.setState(ctx.session!, BotState.SETTING_CASHBACK_BANK);
  
  // Показываем банки для выбора
  // ...
}

async handleBankSelect(ctx: Context, bankCode: string) {
  // Проверяем, что пользователь в правильном состоянии
  if (!FSMManager.isInState(ctx.session!, BotState.SETTING_CASHBACK_BANK)) {
    await ctx.editMessageText('❌ Неожиданное действие. Начните заново с /set_cashback');
    FSMManager.reset(ctx.session!);
    return;
  }
  
  // Сохраняем данные
  FSMManager.setData(ctx.session!, 'selectedBank', bankCode);
  
  // Переходим к следующему состоянию
  FSMManager.transition(ctx.session!, 'bank_selected');
  
  // Показываем категории для выбора
  // ...
}
```

## Заключение

Реализованная FSM система обеспечивает:
- ✅ Надежное хранение сессий в PostgreSQL
- ✅ Четкое управление состояниями пользователей
- ✅ Автоматическую обработку ошибок
- ✅ Подробное логирование для отладки
- ✅ Совместимость с существующей архитектурой

Система готова к использованию и может быть легко расширена для новых сценариев взаимодействия с пользователями.
