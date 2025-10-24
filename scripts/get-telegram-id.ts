#!/usr/bin/env tsx

/**
 * Скрипт для получения Telegram ID пользователя
 * Используйте этот скрипт, чтобы узнать свой Telegram ID для настройки админки
 */

import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Необходимо установить переменную окружения BOT_TOKEN');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  const user = ctx.from;
  console.log('\n✅ Ваш Telegram ID:', user?.id);
  console.log('👤 Username:', user?.username || 'не указан');
  console.log('📝 Имя:', user?.first_name || 'не указано');
  console.log('\n📋 Добавьте этот ID в переменную окружения ADMIN_USER_IDS:');
  console.log(`ADMIN_USER_IDS=${user?.id}`);
  console.log('\n🔄 Перезапустите бота после добавления переменной окружения.');
  
  ctx.reply(
    `✅ Ваш Telegram ID: ${user?.id}\n\n` +
    `Добавьте этот ID в переменную окружения ADMIN_USER_IDS и перезапустите бота.`
  );
});

bot.launch()
  .then(() => {
    console.log('🤖 Бот запущен для получения Telegram ID');
    console.log('📱 Отправьте команду /start боту, чтобы узнать свой ID');
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));