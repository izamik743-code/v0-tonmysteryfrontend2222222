-- Seeding database with Telegram gifts data
INSERT INTO public.telegram_gifts (name, image_url, price_ton, rarity, description) VALUES
-- Common gifts (60% probability)
('Blue Star', '/gifts/blue-star.png', 0.1, 'common', 'A shining blue star'),
('Green Heart', '/gifts/green-heart.png', 0.15, 'common', 'A lovely green heart'),
('Red Rose', '/gifts/red-rose.png', 0.2, 'common', 'A beautiful red rose'),
('Yellow Sun', '/gifts/yellow-sun.png', 0.25, 'common', 'A bright yellow sun'),

-- Rare gifts (25% probability)  
('Purple Diamond', '/gifts/purple-diamond.png', 0.5, 'rare', 'A precious purple diamond'),
('Golden Crown', '/gifts/golden-crown.png', 0.75, 'rare', 'A majestic golden crown'),
('Silver Moon', '/gifts/silver-moon.png', 1.0, 'rare', 'A mystical silver moon'),

-- Epic gifts (12% probability)
('Crystal Ball', '/gifts/crystal-ball.png', 2.0, 'epic', 'A magical crystal ball'),
('Dragon Egg', '/gifts/dragon-egg.png', 3.0, 'epic', 'A legendary dragon egg'),
('Phoenix Feather', '/gifts/phoenix-feather.png', 4.0, 'epic', 'A rare phoenix feather'),

-- Legendary gifts (3% probability)
('Unicorn Horn', '/gifts/unicorn-horn.png', 10.0, 'legendary', 'The rarest unicorn horn'),
('Time Crystal', '/gifts/time-crystal.png', 25.0, 'legendary', 'A crystal that controls time'),
('Infinity Stone', '/gifts/infinity-stone.png', 50.0, 'legendary', 'The ultimate power stone');

-- Create cases
INSERT INTO public.cases (name, price_ton, image_url, description) VALUES
('Starter Case', 0.1, '/cases/starter-case.png', 'Perfect for beginners'),
('Premium Case', 0.5, '/cases/premium-case.png', 'Better rewards await'),
('Elite Case', 1.0, '/cases/elite-case.png', 'For serious players'),
('Legendary Case', 2.0, '/cases/legendary-case.png', 'The ultimate challenge');

-- Set up case rewards with proper probabilities
-- Starter Case (0.1 TON)
INSERT INTO public.case_rewards (case_id, gift_id, probability)
SELECT c.id, g.id, 
  CASE g.rarity
    WHEN 'common' THEN 0.7
    WHEN 'rare' THEN 0.25
    WHEN 'epic' THEN 0.05
    ELSE 0.0
  END
FROM public.cases c, public.telegram_gifts g
WHERE c.name = 'Starter Case' AND g.rarity IN ('common', 'rare', 'epic');

-- Premium Case (0.5 TON)
INSERT INTO public.case_rewards (case_id, gift_id, probability)
SELECT c.id, g.id,
  CASE g.rarity
    WHEN 'common' THEN 0.5
    WHEN 'rare' THEN 0.35
    WHEN 'epic' THEN 0.14
    WHEN 'legendary' THEN 0.01
  END
FROM public.cases c, public.telegram_gifts g
WHERE c.name = 'Premium Case';

-- Elite Case (1.0 TON)
INSERT INTO public.case_rewards (case_id, gift_id, probability)
SELECT c.id, g.id,
  CASE g.rarity
    WHEN 'common' THEN 0.3
    WHEN 'rare' THEN 0.4
    WHEN 'epic' THEN 0.25
    WHEN 'legendary' THEN 0.05
  END
FROM public.cases c, public.telegram_gifts g
WHERE c.name = 'Elite Case';

-- Legendary Case (2.0 TON)
INSERT INTO public.case_rewards (case_id, gift_id, probability)
SELECT c.id, g.id,
  CASE g.rarity
    WHEN 'common' THEN 0.1
    WHEN 'rare' THEN 0.3
    WHEN 'epic' THEN 0.45
    WHEN 'legendary' THEN 0.15
  END
FROM public.cases c, public.telegram_gifts g
WHERE c.name = 'Legendary Case';

-- Initialize online stats
INSERT INTO public.online_stats (online_count) VALUES (127);

-- Add some fake recent wins
INSERT INTO public.recent_wins (fake_username, gift_id, case_name, is_upgrade)
SELECT 
  CASE (random() * 10)::int
    WHEN 0 THEN 'CryptoKing'
    WHEN 1 THEN 'DiamondHands'
    WHEN 2 THEN 'MoonWalker'
    WHEN 3 THEN 'StarCollector'
    WHEN 4 THEN 'GiftHunter'
    WHEN 5 THEN 'LuckyPlayer'
    WHEN 6 THEN 'CrystalMaster'
    WHEN 7 THEN 'DragonSlayer'
    WHEN 8 THEN 'PhoenixRider'
    ELSE 'UnicornLord'
  END,
  g.id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Starter Case'
    WHEN 1 THEN 'Premium Case'
    WHEN 2 THEN 'Elite Case'
    ELSE 'Legendary Case'
  END,
  random() < 0.3
FROM public.telegram_gifts g
ORDER BY random()
LIMIT 20;
