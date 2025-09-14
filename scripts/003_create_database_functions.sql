-- Create function to update user balance atomically
CREATE OR REPLACE FUNCTION update_user_balance(user_id UUID, amount_change DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET ton_balance = GREATEST(0, ton_balance + amount_change),
      updated_at = NOW()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.users (id, ton_balance) 
    VALUES (user_id, GREATEST(0, amount_change));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to simulate online users fluctuation
CREATE OR REPLACE FUNCTION update_online_count()
RETURNS VOID AS $$
DECLARE
  current_count INTEGER;
  base_count INTEGER := 127;
  variation INTEGER;
  new_count INTEGER;
BEGIN
  -- Get current count
  SELECT online_count INTO current_count FROM public.online_stats LIMIT 1;
  
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO public.online_stats (online_count) VALUES (base_count);
    RETURN;
  END IF;
  
  -- Calculate variation (-20 to +20)
  variation := (random() * 40)::INTEGER - 20;
  new_count := GREATEST(100, LEAST(150, base_count + variation));
  
  -- Update the count
  UPDATE public.online_stats SET 
    online_count = new_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add fake recent wins
CREATE OR REPLACE FUNCTION add_fake_recent_win()
RETURNS VOID AS $$
DECLARE
  fake_usernames TEXT[] := ARRAY[
    'CryptoKing', 'DiamondHands', 'MoonWalker', 'StarCollector', 'GiftHunter',
    'LuckyPlayer', 'CrystalMaster', 'DragonSlayer', 'PhoenixRider', 'UnicornLord',
    'BlockchainBoss', 'TokenTrader', 'NFTNinja', 'CoinCollector', 'DigitalDuke'
  ];
  case_names TEXT[] := ARRAY['Starter Case', 'Premium Case', 'Elite Case', 'Legendary Case'];
  random_username TEXT;
  random_case TEXT;
  random_gift_id UUID;
  is_upgrade_win BOOLEAN;
BEGIN
  -- Select random elements
  random_username := fake_usernames[1 + (random() * array_length(fake_usernames, 1))::INTEGER];
  random_case := case_names[1 + (random() * array_length(case_names, 1))::INTEGER];
  is_upgrade_win := random() < 0.3; -- 30% chance of upgrade win
  
  -- Get random gift (weighted towards higher value items for more excitement)
  SELECT id INTO random_gift_id 
  FROM public.telegram_gifts 
  WHERE (random() < 0.3 AND rarity IN ('epic', 'legendary')) 
     OR (random() < 0.7 AND rarity = 'rare')
     OR rarity = 'common'
  ORDER BY random() 
  LIMIT 1;
  
  -- Insert the fake win
  INSERT INTO public.recent_wins (fake_username, gift_id, case_name, is_upgrade)
  VALUES (random_username, random_gift_id, random_case, is_upgrade_win);
  
  -- Keep only the last 25 wins
  DELETE FROM public.recent_wins 
  WHERE id NOT IN (
    SELECT id FROM public.recent_wins 
    ORDER BY created_at DESC 
    LIMIT 25
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_cases_opened', COALESCE(cases_opened.count, 0),
    'total_spent', COALESCE(cases_opened.total_spent, 0),
    'total_won_value', COALESCE(inventory_value.total_value, 0),
    'upgrade_attempts', COALESCE(upgrades.attempts, 0),
    'successful_upgrades', COALESCE(upgrades.successes, 0),
    'inventory_count', COALESCE(inventory_count.count, 0)
  ) INTO result
  FROM (
    SELECT 
      COUNT(*) as count,
      SUM(ton_spent) as total_spent
    FROM public.case_openings 
    WHERE user_id = get_user_stats.user_id
  ) cases_opened
  CROSS JOIN (
    SELECT SUM(ui.quantity * tg.price_ton) as total_value
    FROM public.user_inventory ui
    JOIN public.telegram_gifts tg ON ui.gift_id = tg.id
    WHERE ui.user_id = get_user_stats.user_id
  ) inventory_value
  CROSS JOIN (
    SELECT 
      COUNT(*) as attempts,
      COUNT(*) FILTER (WHERE status = 'success') as successes
    FROM public.upgrade_contracts
    WHERE user_id = get_user_stats.user_id
  ) upgrades
  CROSS JOIN (
    SELECT SUM(quantity) as count
    FROM public.user_inventory
    WHERE user_id = get_user_stats.user_id
  ) inventory_count;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, ton_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
