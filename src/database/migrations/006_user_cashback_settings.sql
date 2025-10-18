-- Миграция 006: Удаление cashback_rate из cashback_categories и добавление user_cashback_settings
-- Дата: 2024-12-19

-- 1. Удаляем столбец cashback_rate из таблицы категорий
ALTER TABLE cashback_categories DROP COLUMN IF EXISTS cashback_rate;

-- 2. Добавляем столбец cashback_rate в избранные категории
ALTER TABLE user_favorite_categories 
ADD COLUMN IF NOT EXISTS cashback_rate DECIMAL(5,2) CHECK (cashback_rate >= 0 AND cashback_rate <= 100);

-- Комментарий к столбцу
COMMENT ON COLUMN user_favorite_categories.cashback_rate IS 'Процент кэшбэка, указанный пользователем';

-- 3. Создаем таблицу для пользовательских настроек кэшбэка
CREATE TABLE user_cashback_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bank_id INTEGER REFERENCES banks(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES cashback_categories(id) ON DELETE CASCADE,
    cashback_rate DECIMAL(5,2) NOT NULL CHECK (cashback_rate >= 0 AND cashback_rate <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bank_id, category_id)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_user_cashback_user ON user_cashback_settings(user_id);
CREATE INDEX idx_user_cashback_bank ON user_cashback_settings(bank_id);
CREATE INDEX idx_user_cashback_category ON user_cashback_settings(category_id);
CREATE INDEX idx_user_cashback_active ON user_cashback_settings(is_active);

-- Комментарий к таблице
COMMENT ON TABLE user_cashback_settings IS 'Пользовательские настройки процента кэшбэка для категорий в банках';

-- 4. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_user_cashback_settings_updated_at 
    BEFORE UPDATE ON user_cashback_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
