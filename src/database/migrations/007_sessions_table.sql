-- Create sessions table for @telegraf/session storage
CREATE TABLE IF NOT EXISTS sessions (
    key VARCHAR(255) PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);

-- Add comment
COMMENT ON TABLE sessions IS 'Stores Telegram bot user sessions';
COMMENT ON COLUMN sessions.key IS 'Session key format: user_id:chat_id';
COMMENT ON COLUMN sessions.data IS 'JSON serialized session data';
COMMENT ON COLUMN sessions.updated_at IS 'Last session update timestamp';
