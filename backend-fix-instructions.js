// ИНСТРУКЦИИ ДЛЯ ИСПРАВЛЕНИЯ БЕКЕНДА (server.js)
// Добавьте этот код в ваш server.js на Render

const express = require("express")
const { createClient } = require("@supabase/supabase-js")

const app = express() // Declare the app variable

// 1. Добавьте зависимости в начало файла:
// Already added above

// 2. Создайте клиент Supabase (добавьте после других импортов):
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Используйте SERVICE_ROLE_KEY для записи
)

// 3. Замените эндпоинт app.post('/api/user') на этот код:
app.post("/api/user", async (req, res) => {
  try {
    const { tg_id, username, first_name, last_name } = req.body

    console.log("Received user data:", { tg_id, username, first_name, last_name })

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabase.from("users").select("*").eq("telegram_id", tg_id).single()

    if (existingUser) {
      // Обновляем статус онлайн
      const { data: updatedUser } = await supabase
        .from("users")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq("telegram_id", tg_id)
        .select()
        .single()

      res.json({ success: true, user: updatedUser })
    } else {
      // Создаем нового пользователя
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            telegram_id: tg_id,
            username: username,
            first_name: first_name,
            last_name: last_name,
            ton_balance: 0.05, // Стартовый баланс
            is_online: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      res.json({ success: true, user: newUser })
    }
  } catch (error) {
    console.error("User creation/update error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 4. Добавьте эндпоинт для получения инвентаря:
app.get("/api/user/:tg_id/inventory", async (req, res) => {
  try {
    const { tg_id } = req.params

    const { data: inventory, error } = await supabase
      .from("user_inventory")
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
      .eq("user_id", tg_id)

    if (error) throw error

    res.json({ success: true, inventory: inventory || [] })
  } catch (error) {
    console.error("Inventory fetch error:", error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 5. Убедитесь, что в переменных окружения Render есть:
// SUPABASE_URL=ваш_supabase_url
// SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
