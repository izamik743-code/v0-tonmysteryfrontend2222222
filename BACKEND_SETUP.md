# Инструкции для настройки бекенда

## Проблема
Фронтенд отправляет данные пользователя на бекенд, но бекенд не сохраняет их в Supabase.

## Решение
Добавьте этот код в ваш `server.js` на Render:

### 1. Добавьте зависимости
\`\`\`javascript
const { createClient } = require('@supabase/supabase-js');
\`\`\`

### 2. Создайте клиент Supabase
\`\`\`javascript
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
\`\`\`

### 3. Замените эндпоинт /api/user
\`\`\`javascript
app.post('/api/user', async (req, res) => {
  try {
    const { tg_id, username, first_name, last_name } = req.body;
    
    // Проверяем существующего пользователя
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', tg_id)
      .single();
    
    if (existingUser) {
      // Обновляем статус
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('telegram_id', tg_id)
        .select()
        .single();
        
      res.json({ success: true, user: updatedUser });
    } else {
      // Создаем нового пользователя
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          telegram_id: tg_id,
          username: username,
          first_name: first_name,
          last_name: last_name,
          ton_balance: 0.05,
          is_online: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, user: newUser });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
\`\`\`

### 4. Добавьте эндпоинт для инвентаря
\`\`\`javascript
app.get('/api/user/:tg_id/inventory', async (req, res) => {
  try {
    const { tg_id } = req.params;
    
    const { data: inventory, error } = await supabase
      .from('user_inventory')
      .select(`
        *,
        telegram_gifts (
          id,
          name,
          emoji,
          price_ton,
          rarity,
          image_url
        )
      `)
      .eq('user_id', tg_id);
    
    if (error) throw error;
    res.json({ success: true, inventory: inventory || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
\`\`\`

### 5. Переменные окружения
Убедитесь, что в Render настроены:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
