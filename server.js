const express = require("express")
const cors = require("cors")
const { createClient } = require("@supabase/supabase-js")
const WebSocket = require("ws")
const crypto = require("crypto")
const path = require("path")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(
  cors({
    origin: ["http://localhost:3000", "https://ton-mystery-cases.vercel.app"],
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.static("public"))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const wss = new WebSocket.Server({ port: 8080 })
const onlineUsers = new Set()

wss.on("connection", (ws) => {
  const userId = crypto.randomUUID()
  onlineUsers.add(userId)

  // Broadcast online count to all clients
  const onlineCount = Math.floor(Math.random() * 50) + 100 // 100-150 fake online
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "online_count", count: onlineCount }))
    }
  })

  ws.on("close", () => {
    onlineUsers.delete(userId)
  })
})

const adminAuth = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"]
  // Используем TELEGRAM_BOT_TOKEN как админ ключ, если ADMIN_SECRET_KEY не задан
  const secretKey = process.env.ADMIN_SECRET_KEY || process.env.TELEGRAM_BOT_TOKEN
  if (adminKey !== secretKey) {
    return res.status(401).json({ error: "Unauthorized admin access" })
  }
  next()
}

app.get("/tonconnect-manifest.json", (req, res) => {
  res.json({
    url: "https://ton-mini-app-backend.onrender.com",
    name: "TON Mystery Cases",
    iconUrl: "https://ton-mini-app-backend.onrender.com/icon.png",
    termsOfUseUrl: "https://ton-mini-app-backend.onrender.com/terms",
    privacyPolicyUrl: "https://ton-mini-app-backend.onrender.com/privacy",
  })
})

app.post("/api/user/init", async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName } = req.body

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("*").eq("telegram_id", telegramId).single()

    if (existingUser) {
      return res.json({ user: existingUser })
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        telegram_id: telegramId,
        username,
        first_name: firstName,
        last_name: lastName,
        balance: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    res.json({ user: newUser })
  } catch (error) {
    console.error("User init error:", error)
    res.status(500).json({ error: "Failed to initialize user" })
  }
})

app.post("/api/user/connect-wallet", async (req, res) => {
  try {
    const { userId, walletAddress, tonAmount } = req.body

    // Update user wallet and add balance
    const { data, error } = await supabase
      .from("users")
      .update({
        wallet_address: walletAddress,
        balance: tonAmount * 1000, // Convert TON to internal currency
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: tonAmount,
      currency: "TON",
      status: "completed",
      created_at: new Date().toISOString(),
    })

    res.json({ user: data })
  } catch (error) {
    console.error("Connect wallet error:", error)
    res.status(500).json({ error: "Failed to connect wallet" })
  }
})

app.post("/api/cases/open", async (req, res) => {
  try {
    const { userId, caseId, casePrice } = req.body

    // Check user balance
    const { data: user } = await supabase.from("users").select("balance").eq("id", userId).single()

    if (user.balance < casePrice) {
      return res.status(400).json({ error: "Insufficient balance" })
    }

    // Deduct balance
    await supabase
      .from("users")
      .update({ balance: user.balance - casePrice })
      .eq("id", userId)

    // Generate random NFT reward
    const nftRewards = [
      { name: "Delicious Cake", rarity: "common", value: 50 },
      { name: "Green Star", rarity: "rare", value: 150 },
      { name: "Blue Star", rarity: "epic", value: 300 },
      { name: "Telegram Premium", rarity: "legendary", value: 500 },
    ]

    const reward = nftRewards[Math.floor(Math.random() * nftRewards.length)]

    // Add to user inventory
    await supabase.from("inventory").insert({
      user_id: userId,
      item_name: reward.name,
      item_rarity: reward.rarity,
      item_value: reward.value,
      created_at: new Date().toISOString(),
    })

    // Log transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "case_open",
      amount: -casePrice,
      currency: "internal",
      status: "completed",
      created_at: new Date().toISOString(),
    })

    res.json({ reward, newBalance: user.balance - casePrice })
  } catch (error) {
    console.error("Open case error:", error)
    res.status(500).json({ error: "Failed to open case" })
  }
})

app.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        transactions(count),
        inventory(count)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    res.json({ users })
  } catch (error) {
    console.error("Admin users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

app.post("/admin/withdraw", adminAuth, async (req, res) => {
  try {
    const { userId, amount } = req.body

    const { data: user } = await supabase.from("users").select("balance, wallet_address").eq("id", userId).single()

    if (!user.wallet_address) {
      return res.status(400).json({ error: "User has no connected wallet" })
    }

    // Update user balance
    await supabase
      .from("users")
      .update({ balance: Math.max(0, user.balance - amount) })
      .eq("id", userId)

    // Log admin withdrawal
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "admin_withdraw",
      amount: -amount,
      currency: "TON",
      status: "completed",
      admin_action: true,
      created_at: new Date().toISOString(),
    })

    res.json({ success: true, message: `Withdrawn ${amount} TON from user ${userId}` })
  } catch (error) {
    console.error("Admin withdraw error:", error)
    res.status(500).json({ error: "Failed to withdraw TON" })
  }
})

app.get("/admin/stats", adminAuth, async (req, res) => {
  try {
    // Total deposits
    const { data: deposits } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "deposit")
      .eq("currency", "TON")

    const totalDeposits = deposits?.reduce((sum, t) => sum + t.amount, 0) || 0

    // Active users (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: activeUsers } = await supabase
      .from("transactions")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", yesterday)

    // Total users
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

    res.json({
      totalDeposits,
      activeUsers: activeUsers || 0,
      totalUsers: totalUsers || 0,
      onlineUsers: Math.floor(Math.random() * 50) + 100,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
})

app.get("/api/user/:id/balance", async (req, res) => {
  try {
    const { data: user } = await supabase.from("users").select("balance").eq("id", req.params.id).single()

    res.json({ balance: user?.balance || 0 })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch balance" })
  }
})

app.get("/api/user/:id/inventory", async (req, res) => {
  try {
    const { data: inventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", req.params.id)
      .order("created_at", { ascending: false })

    res.json({ inventory: inventory || [] })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" })
  }
})

app.get("/api/user/:id/transactions", async (req, res) => {
  try {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", req.params.id)
      .order("created_at", { ascending: false })
      .limit(50)

    res.json({ transactions: transactions || [] })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" })
  }
})

app.get("/api/user/:id/referrals", async (req, res) => {
  try {
    const { data: referrals } = await supabase
      .from("users")
      .select("id, username, first_name, created_at")
      .eq("referred_by", req.params.id)

    res.json({ referrals: referrals || [] })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch referrals" })
  }
})

app.get("/api/recent-wins", async (req, res) => {
  try {
    // Generate fake recent wins
    const fakeWins = [
      { item: "Delicious Cake", rarity: "common", time: "2 min ago" },
      { item: "Green Star", rarity: "rare", time: "5 min ago" },
      { item: "Blue Star", rarity: "epic", time: "8 min ago" },
      { item: "Telegram Premium", rarity: "legendary", time: "12 min ago" },
      { item: "Delicious Cake", rarity: "common", time: "15 min ago" },
    ]

    res.json({ wins: fakeWins })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent wins" })
  }
})

app.post("/api/ton/verify-balance", async (req, res) => {
  try {
    const { walletAddress } = req.body

    // Используем TON API для проверки баланса
    const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${walletAddress}`, {
      headers: {
        "X-API-Key": process.env.TON_API_KEY,
      },
    })

    const data = await response.json()
    const balance = data.result ? Number.parseFloat(data.result) / 1000000000 : 0 // Convert from nanotons

    res.json({ balance })
  } catch (error) {
    console.error("TON balance verification error:", error)
    res.status(500).json({ error: "Failed to verify TON balance" })
  }
})

app.post("/api/telegram/notify", async (req, res) => {
  try {
    const { chatId, message } = req.body

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const result = await response.json()
    res.json({ success: result.ok })
  } catch (error) {
    console.error("Telegram notification error:", error)
    res.status(500).json({ error: "Failed to send notification" })
  }
})

app.get("/admin", adminAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TON Mystery Cases - Admin Panel</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
            .container { max-width: 1200px; margin: 0 auto; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #2a2a2a; padding: 20px; border-radius: 10px; text-align: center; }
            .stat-value { font-size: 2em; font-weight: bold; color: #00d4ff; }
            table { width: 100%; border-collapse: collapse; background: #2a2a2a; border-radius: 10px; overflow: hidden; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #444; }
            th { background: #333; }
            .withdraw-btn { background: #ff4444; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; }
            .withdraw-btn:hover { background: #ff6666; }
            .notify-btn { background: #00d4ff; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-left: 5px; }
            .notify-btn:hover { background: #33ddff; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>TON Mystery Cases - Admin Panel</h1>
            <p>Environment: ${process.env.NODE_ENV} | Port: ${process.env.PORT}</p>
            
            <div class="stats" id="stats">
                <div class="stat-card">
                    <div class="stat-value" id="totalDeposits">0</div>
                    <div>Total Deposits (TON)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalUsers">0</div>
                    <div>Total Users</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="activeUsers">0</div>
                    <div>Active Users (24h)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="onlineUsers">0</div>
                    <div>Online Users</div>
                </div>
            </div>

            <h2>Users Management</h2>
            <table id="usersTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Wallet</th>
                        <th>Balance</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="usersBody">
                </tbody>
            </table>
        </div>

        <script>
            const adminKey = prompt('Enter admin key (or use bot token):') || '${process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10)}...';
            
            async function fetchStats() {
                const response = await fetch('/admin/stats', {
                    headers: { 'X-Admin-Key': adminKey }
                });
                const data = await response.json();
                
                document.getElementById('totalDeposits').textContent = data.totalDeposits;
                document.getElementById('totalUsers').textContent = data.totalUsers;
                document.getElementById('activeUsers').textContent = data.activeUsers;
                document.getElementById('onlineUsers').textContent = data.onlineUsers;
            }

            async function fetchUsers() {
                const response = await fetch('/admin/users', {
                    headers: { 'X-Admin-Key': adminKey }
                });
                const data = await response.json();
                
                const tbody = document.getElementById('usersBody');
                tbody.innerHTML = data.users.map(user => \`
                    <tr>
                        <td>\${user.id}</td>
                        <td>\${user.username || 'N/A'}</td>
                        <td>\${user.wallet_address ? user.wallet_address.slice(0, 10) + '...' : 'Not connected'}</td>
                        <td>\${user.balance}</td>
                        <td>\${new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="withdraw-btn" onclick="withdrawTON('\${user.id}')">Withdraw TON</button>
                            <button class="notify-btn" onclick="notifyUser('\${user.telegram_id}')">Notify</button>
                        </td>
                    </tr>
                \`).join('');
            }

            async function withdrawTON(userId) {
                const amount = prompt('Enter amount to withdraw (TON):');
                if (!amount) return;
                
                const response = await fetch('/admin/withdraw', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Key': adminKey
                    },
                    body: JSON.stringify({ userId, amount: parseFloat(amount) })
                });
                
                const result = await response.json();
                alert(result.message || result.error);
                fetchUsers();
            }

            async function notifyUser(telegramId) {
                const message = prompt('Enter message to send:');
                if (!message) return;
                
                const response = await fetch('/api/telegram/notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Key': adminKey
                    },
                    body: JSON.stringify({ chatId: telegramId, message })
                });
                
                const result = await response.json();
                alert(result.success ? 'Message sent!' : 'Failed to send message');
            }

            // Load data
            fetchStats();
            fetchUsers();
            
            // Refresh every 30 seconds
            setInterval(() => {
                fetchStats();
                fetchUsers();
            }, 30000);
        </script>
    </body>
    </html>
  `)
})

app.use((error, req, res, next) => {
  console.error("Server error:", error)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(PORT, () => {
  console.log(`🚀 TON Mystery Cases Backend running on port ${PORT}`)
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`)
  console.log(`🔌 WebSocket server running on port 8080`)
})
