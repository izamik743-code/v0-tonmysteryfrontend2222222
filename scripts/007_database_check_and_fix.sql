-- Database Check and Fix Script
-- Run this to ensure all data is properly set up

-- Check if telegram_gifts table has data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM telegram_gifts LIMIT 1) THEN
        -- Insert telegram gifts if missing
        INSERT INTO telegram_gifts (id, name, emoji, description, price_ton, rarity, image_url) VALUES
        (gen_random_uuid(), 'Delicious Cake', '🎂', 'A sweet birthday cake', 443.00, 'common', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Green Heart', '💚', 'A loving green heart', 870.00, 'uncommon', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Crystal Ball', '🔮', 'Mystical crystal ball', 5299.00, 'rare', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Star', '⭐', 'Shining bright star', 2150.00, 'uncommon', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Fire', '🔥', 'Blazing fire element', 8750.00, 'epic', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Diamond', '💎', 'Precious diamond gem', 12500.00, 'legendary', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Crown', '👑', 'Royal golden crown', 15000.00, 'legendary', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Rocket', '🚀', 'Space rocket ship', 3200.00, 'rare', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Lightning', '⚡', 'Electric lightning bolt', 4500.00, 'rare', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Rainbow', '🌈', 'Beautiful rainbow arc', 6800.00, 'epic', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Unicorn', '🦄', 'Magical unicorn', 9999.00, 'epic', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Phoenix', '🦅', 'Legendary phoenix bird', 25000.00, 'legendary', '/placeholder.svg?height=64&width=64'),
        (gen_random_uuid(), 'Galaxy', '🌌', 'Infinite galaxy', 50000.00, 'mythic', '/placeholder.svg?height=64&width=64');
        
        RAISE NOTICE 'Telegram gifts inserted successfully';
    ELSE
        RAISE NOTICE 'Telegram gifts already exist';
    END IF;
END $$;

-- Check if cases table has data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cases LIMIT 1) THEN
        -- Insert cases if missing
        INSERT INTO cases (id, name, description, price_ton, image_url, is_active) VALUES
        (gen_random_uuid(), 'Starter Case', 'Perfect for beginners', 0.1, '/placeholder.svg?height=200&width=200', true),
        (gen_random_uuid(), 'Premium Case', 'Better rewards await', 0.5, '/placeholder.svg?height=200&width=200', true),
        (gen_random_uuid(), 'Elite Case', 'High-value items inside', 1.0, '/placeholder.svg?height=200&width=200', true),
        (gen_random_uuid(), 'Legendary Case', 'The ultimate mystery', 2.0, '/placeholder.svg?height=200&width=200', true);
        
        RAISE NOTICE 'Cases inserted successfully';
    ELSE
        RAISE NOTICE 'Cases already exist';
    END IF;
END $$;

-- Set up case rewards if missing
DO $$
DECLARE
    starter_case_id uuid;
    premium_case_id uuid;
    elite_case_id uuid;
    legendary_case_id uuid;
    gift_record record;
BEGIN
    -- Get case IDs
    SELECT id INTO starter_case_id FROM cases WHERE name = 'Starter Case' LIMIT 1;
    SELECT id INTO premium_case_id FROM cases WHERE name = 'Premium Case' LIMIT 1;
    SELECT id INTO elite_case_id FROM cases WHERE name = 'Elite Case' LIMIT 1;
    SELECT id INTO legendary_case_id FROM cases WHERE name = 'Legendary Case' LIMIT 1;
    
    -- Clear existing case rewards
    DELETE FROM case_rewards;
    
    -- Set up probabilities for each case
    FOR gift_record IN SELECT id, rarity FROM telegram_gifts LOOP
        -- Starter Case (0.1 TON) - mostly common items
        IF gift_record.rarity = 'common' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (starter_case_id, gift_record.id, 0.6);
        ELSIF gift_record.rarity = 'uncommon' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (starter_case_id, gift_record.id, 0.3);
        ELSIF gift_record.rarity = 'rare' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (starter_case_id, gift_record.id, 0.1);
        END IF;
        
        -- Premium Case (0.5 TON) - better odds
        IF gift_record.rarity = 'common' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (premium_case_id, gift_record.id, 0.4);
        ELSIF gift_record.rarity = 'uncommon' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (premium_case_id, gift_record.id, 0.35);
        ELSIF gift_record.rarity = 'rare' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (premium_case_id, gift_record.id, 0.2);
        ELSIF gift_record.rarity = 'epic' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (premium_case_id, gift_record.id, 0.05);
        END IF;
        
        -- Elite Case (1.0 TON) - rare items more common
        IF gift_record.rarity = 'uncommon' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (elite_case_id, gift_record.id, 0.3);
        ELSIF gift_record.rarity = 'rare' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (elite_case_id, gift_record.id, 0.4);
        ELSIF gift_record.rarity = 'epic' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (elite_case_id, gift_record.id, 0.25);
        ELSIF gift_record.rarity = 'legendary' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (elite_case_id, gift_record.id, 0.05);
        END IF;
        
        -- Legendary Case (2.0 TON) - best items
        IF gift_record.rarity = 'rare' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (legendary_case_id, gift_record.id, 0.3);
        ELSIF gift_record.rarity = 'epic' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (legendary_case_id, gift_record.id, 0.4);
        ELSIF gift_record.rarity = 'legendary' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (legendary_case_id, gift_record.id, 0.25);
        ELSIF gift_record.rarity = 'mythic' THEN
            INSERT INTO case_rewards (case_id, gift_id, probability) VALUES (legendary_case_id, gift_record.id, 0.05);
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Case rewards configured successfully';
END $$;

-- Add some fake recent wins for demo
INSERT INTO recent_wins (gift_id, fake_username, case_name, is_upgrade, created_at)
SELECT 
    (SELECT id FROM telegram_gifts ORDER BY RANDOM() LIMIT 1),
    (ARRAY['Alex', 'Maria', 'John', 'Anna', 'Mike', 'Lisa', 'Tom', 'Kate'])[floor(random() * 8 + 1)],
    (ARRAY['Starter Case', 'Premium Case', 'Elite Case', 'Legendary Case'])[floor(random() * 4 + 1)],
    random() > 0.8,
    NOW() - (random() * interval '1 hour')
FROM generate_series(1, 20);

-- Update online stats
INSERT INTO online_stats (online_count, updated_at) 
VALUES (floor(random() * 500 + 100), NOW())
ON CONFLICT (id) DO UPDATE SET 
    online_count = floor(random() * 500 + 100),
    updated_at = NOW();

-- Final check
SELECT 
    (SELECT COUNT(*) FROM telegram_gifts) as gifts_count,
    (SELECT COUNT(*) FROM cases) as cases_count,
    (SELECT COUNT(*) FROM case_rewards) as rewards_count,
    (SELECT COUNT(*) FROM recent_wins) as recent_wins_count;
