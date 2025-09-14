"use client"

import { useState, useEffect } from "react"
import { TelegramGiftsService } from "@/lib/telegram-gifts"
import type { RecentWin } from "@/types/telegram-gifts"

export function RecentWins() {
  const [recentWins, setRecentWins] = useState<RecentWin[]>([])
  const [loading, setLoading] = useState(true)

  const giftsService = new TelegramGiftsService()

  useEffect(() => {
    const loadRecentWins = async () => {
      try {
        const stats = await giftsService.getOnlineStats()
        setRecentWins(stats.recent_wins)
      } catch (error) {
        console.error("Failed to load recent wins:", error)
        const fakeWins: RecentWin[] = [
          {
            id: "1",
            username: "CryptoKing",
            gift: { id: "1", name: "🌸", emoji: "🌸", price_ton: 5.2, rarity: "rare", image: "" },
            timestamp: new Date().toISOString(),
            case_name: "Premium Case",
            upgrade: false,
          },
          {
            id: "2",
            username: "DiamondHands",
            gift: { id: "2", name: "🧙‍♂️", emoji: "🧙‍♂️", price_ton: 12.8, rarity: "epic", image: "" },
            timestamp: new Date().toISOString(),
            case_name: "Elite Case",
            upgrade: false,
          },
          {
            id: "3",
            username: "MoonWalker",
            gift: { id: "3", name: "⛄", emoji: "⛄", price_ton: 3.1, rarity: "common", image: "" },
            timestamp: new Date().toISOString(),
            case_name: "Starter Case",
            upgrade: false,
          },
          {
            id: "4",
            username: "StarCollector",
            gift: { id: "4", name: "🎮", emoji: "🎮", price_ton: 8.7, rarity: "rare", image: "" },
            timestamp: new Date().toISOString(),
            case_name: "Gaming Case",
            upgrade: false,
          },
          {
            id: "5",
            username: "GiftHunter",
            gift: { id: "5", name: "🍀", emoji: "🍀", price_ton: 15.3, rarity: "legendary", image: "" },
            timestamp: new Date().toISOString(),
            case_name: "Lucky Case",
            upgrade: false,
          },
        ]
        setRecentWins(fakeWins)
      } finally {
        setLoading(false)
      }
    }

    loadRecentWins()
    const interval = setInterval(loadRecentWins, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 font-medium text-sm">Последние выигрыши</span>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded mb-2" />
          <div className="h-4 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  const duplicatedWins = [...recentWins, ...recentWins, ...recentWins]

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 font-medium text-sm">🔥 LIVE</span>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex gap-6 animate-scroll-left">
          {duplicatedWins.map((win, index) => (
            <div key={`${win.id}-${index}`} className="flex items-center gap-3 whitespace-nowrap flex-shrink-0">
              <div className="w-8 h-8 flex items-center justify-center">
                {win.gift.image ? (
                  <img
                    src={win.gift.image || "/placeholder.svg"}
                    alt={win.gift.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      e.currentTarget.nextElementSibling.style.display = "block"
                    }}
                  />
                ) : null}
                <div className="text-2xl" style={{ display: win.gift.image ? "none" : "block" }}>
                  {win.gift.emoji || win.gift.name}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white font-medium">{win.username}</span>
                  <span className="text-gray-400">выиграл</span>
                  <span className="text-blue-400">{win.gift.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-400 font-medium">{win.gift.price_ton} TON</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{win.case_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
