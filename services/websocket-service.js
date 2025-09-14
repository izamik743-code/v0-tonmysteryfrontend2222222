const WebSocket = require("ws")

class WebSocketService {
  constructor() {
    this.wss = null
    this.onlineUsers = new Set()
    this.userSockets = new Map()
  }

  initialize(port = 8080) {
    this.wss = new WebSocket.Server({ port })

    this.wss.on("connection", (ws, req) => {
      const userId = this.generateUserId()
      this.onlineUsers.add(userId)
      this.userSockets.set(userId, ws)

      console.log(`User ${userId} connected. Online: ${this.onlineUsers.size}`)

      // Send initial data
      ws.send(
        JSON.stringify({
          type: "connection",
          userId,
          onlineCount: this.getOnlineCount(),
        }),
      )

      // Handle messages
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message)
          this.handleMessage(userId, data)
        } catch (error) {
          console.error("WebSocket message error:", error)
        }
      })

      // Handle disconnect
      ws.on("close", () => {
        this.onlineUsers.delete(userId)
        this.userSockets.delete(userId)
        console.log(`User ${userId} disconnected. Online: ${this.onlineUsers.size}`)

        // Broadcast updated online count
        this.broadcastOnlineCount()
      })

      // Broadcast updated online count
      this.broadcastOnlineCount()
    })

    console.log(`🔌 WebSocket server running on port ${port}`)
  }

  handleMessage(userId, data) {
    switch (data.type) {
      case "ping":
        this.sendToUser(userId, { type: "pong" })
        break

      case "case_opened":
        this.broadcastCaseOpening(data)
        break

      case "user_activity":
        this.updateUserActivity(userId, data)
        break
    }
  }

  broadcastOnlineCount() {
    const onlineCount = this.getOnlineCount()
    this.broadcast({
      type: "online_count",
      count: onlineCount,
    })
  }

  broadcastCaseOpening(data) {
    this.broadcast({
      type: "case_opened",
      reward: data.reward,
      timestamp: Date.now(),
    })
  }

  broadcast(message) {
    if (!this.wss) return

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  sendToUser(userId, message) {
    const socket = this.userSockets.get(userId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }

  getOnlineCount() {
    // Add some fake users to make it look more active
    const realOnline = this.onlineUsers.size
    const fakeOnline = Math.floor(Math.random() * 50) + 100
    return realOnline + fakeOnline
  }

  generateUserId() {
    return "user_" + Math.random().toString(36).substr(2, 9)
  }
}

module.exports = new WebSocketService()
