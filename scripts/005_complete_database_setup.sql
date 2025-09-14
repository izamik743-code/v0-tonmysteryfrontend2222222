-- Creating complete database schema with all tables
-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.user_inventory CASCADE;
DROP TABLE IF EXISTS public.case_openings CASCADE;
DROP TABLE IF EXISTS public.upgrade_attempts CASCADE;
DROP TABLE IF EXISTS public.gift_claims CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.case_items CASCADE;
DROP TABLE IF EXISTS public.telegram_gifts CASCADE;
DROP TABLE IF EXISTS public.upgrade_paths CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    wallet_address TEXT,
    ton_balance DECIMAL(20,9) DEFAULT 0,
    total_spent DECIMAL(20,9) DEFAULT 0,
    total_won DECIMAL(20,9) DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram gifts table
CREATE TABLE public.telegram_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    ton_value DECIMAL(10,4) NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases table
CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,4) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case items table
CREATE TABLE public.case_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    gift_id UUID NOT NULL REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
    drop_chance DECIMAL(5,4) NOT NULL CHECK (drop_chance > 0 AND drop_chance <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inventory table
CREATE TABLE public.user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gift_id UUID NOT NULL REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case openings table
CREATE TABLE public.case_openings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    gift_won_id UUID NOT NULL REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
    cost DECIMAL(10,4) NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upgrade paths table
CREATE TABLE public.upgrade_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_gift_id UUID NOT NULL REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
    to_gift_id UUID NOT NULL REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
    success_chance DECIMAL(5,4) NOT NULL CHECK (success_chance > 0 AND success_chance <= 1),
    cost DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upgrade attempts table
CREATE TABLE public.upgrade_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    upgrade_path_id UUID NOT NULL REFERENCES public.upgrade_paths(id) ON DELETE CASCADE,
    was_successful BOOLEAN NOT NULL,
    cost DECIMAL(10,4) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift claims table
CREATE TABLE public.gift_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gift_id UUID NOT NULL REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    bonus_amount DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Telegram gifts
INSERT INTO public.telegram_gifts (name, emoji, rarity, ton_value, description) VALUES
('Star', '⭐', 'common', 0.1, 'A shining star gift'),
('Heart', '❤️', 'common', 0.15, 'A lovely heart gift'),
('Fire', '🔥', 'common', 0.2, 'A blazing fire gift'),
('Gem', '💎', 'rare', 0.5, 'A precious gem gift'),
('Crown', '👑', 'rare', 0.75, 'A royal crown gift'),
('Trophy', '🏆', 'rare', 1.0, 'A victory trophy gift'),
('Rocket', '🚀', 'epic', 2.0, 'A space rocket gift'),
('Lightning', '⚡', 'epic', 2.5, 'A lightning bolt gift'),
('Rainbow', '🌈', 'epic', 3.0, 'A colorful rainbow gift'),
('Unicorn', '🦄', 'legendary', 5.0, 'A magical unicorn gift'),
('Dragon', '🐉', 'legendary', 7.5, 'A mighty dragon gift'),
('Phoenix', '🔥🦅', 'legendary', 10.0, 'A legendary phoenix gift'),
('Golden Star', '🌟', 'legendary', 15.0, 'The ultimate golden star gift');

-- Insert cases
INSERT INTO public.cases (name, description, price, image_url) VALUES
('Starter Pack', 'Perfect for beginners', 1.0, '/images/cases/starter.png'),
('Premium Box', 'Better rewards await', 2.5, '/images/cases/premium.png'),
('Elite Chest', 'For the serious collectors', 5.0, '/images/cases/elite.png'),
('Legendary Vault', 'The ultimate mystery', 10.0, '/images/cases/legendary.png');

-- Insert case items with proper probabilities
-- Starter Pack (70% common, 25% rare, 5% epic)
INSERT INTO public.case_items (case_id, gift_id, drop_chance) 
SELECT c.id, g.id, 
    CASE 
        WHEN g.rarity = 'common' THEN 0.2333
        WHEN g.rarity = 'rare' THEN 0.0833
        WHEN g.rarity = 'epic' THEN 0.0167
        ELSE 0
    END
FROM public.cases c, public.telegram_gifts g 
WHERE c.name = 'Starter Pack' AND g.rarity IN ('common', 'rare', 'epic');

-- Premium Box (50% common, 35% rare, 13% epic, 2% legendary)
INSERT INTO public.case_items (case_id, gift_id, drop_chance) 
SELECT c.id, g.id, 
    CASE 
        WHEN g.rarity = 'common' THEN 0.1667
        WHEN g.rarity = 'rare' THEN 0.1167
        WHEN g.rarity = 'epic' THEN 0.0433
        WHEN g.rarity = 'legendary' THEN 0.005
        ELSE 0
    END
FROM public.cases c, public.telegram_gifts g 
WHERE c.name = 'Premium Box';

-- Elite Chest (30% common, 40% rare, 25% epic, 5% legendary)
INSERT INTO public.case_items (case_id, gift_id, drop_chance) 
SELECT c.id, g.id, 
    CASE 
        WHEN g.rarity = 'common' THEN 0.1
        WHEN g.rarity = 'rare' THEN 0.1333
        WHEN g.rarity = 'epic' THEN 0.0833
        WHEN g.rarity = 'legendary' THEN 0.0125
        ELSE 0
    END
FROM public.cases c, public.telegram_gifts g 
WHERE c.name = 'Elite Chest';

-- Legendary Vault (10% common, 30% rare, 40% epic, 20% legendary)
INSERT INTO public.case_items (case_id, gift_id, drop_chance) 
SELECT c.id, g.id, 
    CASE 
        WHEN g.rarity = 'common' THEN 0.0333
        WHEN g.rarity = 'rare' THEN 0.1
        WHEN g.rarity = 'epic' THEN 0.1333
        WHEN g.rarity = 'legendary' THEN 0.05
        ELSE 0
    END
FROM public.cases c, public.telegram_gifts g 
WHERE c.name = 'Legendary Vault';

-- Create upgrade paths
INSERT INTO public.upgrade_paths (from_gift_id, to_gift_id, success_chance, cost)
SELECT 
    g1.id, g2.id, 0.5, 0.5
FROM public.telegram_gifts g1, public.telegram_gifts g2
WHERE g1.rarity = 'common' AND g2.rarity = 'rare'
LIMIT 5;

INSERT INTO public.upgrade_paths (from_gift_id, to_gift_id, success_chance, cost)
SELECT 
    g1.id, g2.id, 0.3, 1.0
FROM public.telegram_gifts g1, public.telegram_gifts g2
WHERE g1.rarity = 'rare' AND g2.rarity = 'epic'
LIMIT 3;

INSERT INTO public.upgrade_paths (from_gift_id, to_gift_id, success_chance, cost)
SELECT 
    g1.id, g2.id, 0.1, 2.0
FROM public.telegram_gifts g1, public.telegram_gifts g2
WHERE g1.rarity = 'epic' AND g2.rarity = 'legendary'
LIMIT 2;

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Inventory policies
CREATE POLICY "Users can view own inventory" ON public.user_inventory
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own inventory" ON public.user_inventory
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Case opening policies
CREATE POLICY "Users can view own case openings" ON public.case_openings
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own case openings" ON public.case_openings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Public read access for reference tables
CREATE POLICY "Anyone can view cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Anyone can view case items" ON public.case_items FOR SELECT USING (true);
CREATE POLICY "Anyone can view telegram gifts" ON public.telegram_gifts FOR SELECT USING (true);
CREATE POLICY "Anyone can view upgrade paths" ON public.upgrade_paths FOR SELECT USING (true);

-- Create functions
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_cases_opened', COALESCE(COUNT(co.id), 0),
        'total_spent', COALESCE(SUM(co.cost), 0),
        'inventory_count', (
            SELECT COALESCE(SUM(ui.quantity), 0) 
            FROM public.user_inventory ui 
            WHERE ui.user_id = user_uuid
        ),
        'referrals_count', (
            SELECT COUNT(*) 
            FROM public.referrals r 
            WHERE r.referrer_id = user_uuid
        )
    ) INTO result
    FROM public.case_openings co
    WHERE co.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_users_wallet_address ON public.users(wallet_address);
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_case_openings_user_id ON public.case_openings(user_id);
CREATE INDEX idx_case_items_case_id ON public.case_items(case_id);
CREATE INDEX idx_upgrade_attempts_user_id ON public.upgrade_attempts(user_id);
