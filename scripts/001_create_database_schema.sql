-- Creating comprehensive database schema for TON Mystery Cases
-- Users table with Telegram integration
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  ton_balance DECIMAL(18, 9) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram gifts catalog
CREATE TABLE IF NOT EXISTS public.telegram_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price_ton DECIMAL(18, 9) NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inventory
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gift_id)
);

-- Cases definition
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_ton DECIMAL(18, 9) NOT NULL,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case rewards (what can be won from each case)
CREATE TABLE IF NOT EXISTS public.case_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  gift_id UUID REFERENCES public.telegram_gifts(id) ON DELETE CASCADE,
  probability DECIMAL(5, 4) NOT NULL, -- 0.0001 to 1.0000
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case openings history
CREATE TABLE IF NOT EXISTS public.case_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  gift_won_id UUID REFERENCES public.telegram_gifts(id),
  ton_spent DECIMAL(18, 9) NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upgrade contracts
CREATE TABLE IF NOT EXISTS public.upgrade_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  input_gifts JSONB NOT NULL, -- Array of gift IDs and quantities
  target_gift_id UUID REFERENCES public.telegram_gifts(id),
  success_chance DECIMAL(5, 4) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  result_gift_id UUID REFERENCES public.telegram_gifts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Referral system
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  commission_rate DECIMAL(3, 2) DEFAULT 0.10, -- 10%
  total_earned DECIMAL(18, 9) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Online statistics (for fake online users)
CREATE TABLE IF NOT EXISTS public.online_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  online_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recent wins (for fake recent wins display)
CREATE TABLE IF NOT EXISTS public.recent_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fake_username TEXT NOT NULL,
  gift_id UUID REFERENCES public.telegram_gifts(id),
  case_name TEXT,
  is_upgrade BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_inventory
CREATE POLICY "inventory_select_own" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "inventory_insert_own" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inventory_update_own" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for case_openings
CREATE POLICY "case_openings_select_own" ON public.case_openings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "case_openings_insert_own" ON public.case_openings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for upgrade_contracts
CREATE POLICY "upgrade_contracts_select_own" ON public.upgrade_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "upgrade_contracts_insert_own" ON public.upgrade_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upgrade_contracts_update_own" ON public.upgrade_contracts FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "referrals_insert_own" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Public read access for catalog tables
CREATE POLICY "telegram_gifts_select_all" ON public.telegram_gifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "cases_select_active" ON public.cases FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "case_rewards_select_all" ON public.case_rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "online_stats_select_all" ON public.online_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "recent_wins_select_all" ON public.recent_wins FOR SELECT TO authenticated USING (true);
