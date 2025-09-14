const jwt = require("jsonwebtoken")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"]

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({
      error: "Unauthorized admin access",
      message: "Invalid or missing admin key",
    })
  }

  req.isAdmin = true
  next()
}

// User authentication middleware
const userAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verify user exists in database
    const { data: user, error } = await supabase.from("users").select("*").eq("id", decoded.userId).single()

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token or user not found" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Auth error:", error)
    res.status(401).json({ error: "Invalid token" })
  }
}

// Telegram WebApp data validation
const validateTelegramWebApp = (req, res, next) => {
  const { initData } = req.body

  if (!initData) {
    return res.status(400).json({ error: "Missing Telegram WebApp init data" })
  }

  // Parse and validate Telegram WebApp init data
  try {
    const urlParams = new URLSearchParams(initData)
    const user = JSON.parse(urlParams.get("user") || "{}")

    if (!user.id) {
      return res.status(400).json({ error: "Invalid Telegram user data" })
    }

    req.telegramUser = user
    next()
  } catch (error) {
    console.error("Telegram validation error:", error)
    res.status(400).json({ error: "Invalid Telegram WebApp data" })
  }
}

module.exports = {
  adminAuth,
  userAuth,
  validateTelegramWebApp,
}
