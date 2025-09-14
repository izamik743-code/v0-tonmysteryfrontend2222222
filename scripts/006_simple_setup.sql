-- Simple database setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    wallet_address TEXT,
    ton_balance DECIMAL(20,9) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram gifts table
CREATE TABLE IF NOT EXISTS public.telegram_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    rarity TEXT NOT NULL,
    ton_value DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data
INSERT INTO public.telegram_gifts (name, emoji, rarity, ton_value) VALUES
('Star', '⭐', 'common', 0.1),
('Heart', '❤️', 'common', 0.15),
('Gem', '💎', 'rare', 0.5),
('Crown', '👑', 'rare', 0.75),
('Rocket', '🚀', 'epic', 2.0),
('Unicorn', '🦄', 'legendary', 5.0)
ON CONFLICT DO NOTHING;

INSERT INTO public.cases (name, price) VALUES
('Starter Pack', 1.0),
('Premium Box', 2.5),
('Elite Chest', 5.0),
('Legendary Vault', 10.0)
ON CONFLICT DO NOTHING;
