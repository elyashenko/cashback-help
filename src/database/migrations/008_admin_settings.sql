-- Migration: Create admin_settings table
-- Description: Creates table for storing admin service settings

CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    scope VARCHAR(20) NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'user')),
    user_id BIGINT NULL, -- Telegram ID пользователя для индивидуальных настроек
    description TEXT NULL, -- Дополнительная информация о настройке
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_service_type ON admin_settings(service_type);
CREATE INDEX IF NOT EXISTS idx_admin_settings_user_id ON admin_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_scope ON admin_settings(scope);

-- Insert default settings for all services
INSERT INTO admin_settings (service_type, is_enabled, scope, description) VALUES
('set_cashback', true, 'global', 'Глобальная настройка для set_cashback'),
('my_cashback', true, 'global', 'Глобальная настройка для my_cashback'),
('remove_cashback', true, 'global', 'Глобальная настройка для remove_cashback'),
('search', true, 'global', 'Глобальная настройка для search'),
('favorites', true, 'global', 'Глобальная настройка для favorites'),
('subscription', true, 'global', 'Глобальная настройка для subscription'),
('stats', true, 'global', 'Глобальная настройка для stats'),
('banks', true, 'global', 'Глобальная настройка для banks')
ON CONFLICT (service_type) DO UPDATE SET 
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
