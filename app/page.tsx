"use client"

import { useState, useEffect } from "react"
import { TonConnectProvider } from "@/components/wallet/ton-connect-provider"
import { CasesSection } from "@/components/cases/cases-section"
import { UpgradeSection } from "@/components/upgrade/upgrade-section"
import { ProfileSection } from "@/components/profile/profile-section"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { OnlineStats } from "@/components/stats/online-stats"
import type { TelegramUser } from "@/types"
import { apiClient } from "@/lib/api"

export default function HomePage() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [activeTab, setActiveTab] = useState<"cases" | "upgrade" | "profile">("cases")
  const [balance, setBalance] = useState(0)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()
        tg.expand()

        // Get user data directly from Telegram WebApp
        const tgUser = tg.initDataUnsafe?.user

        if (tgUser) {
          console.log("[v0] Telegram user found:", tgUser)
          setUser({
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || "",
            username: tgUser.username || "",
            language_code: tgUser.language_code || "en",
            photo_url: tgUser.photo_url, // Added photo_url for Telegram avatar
          })
          await initializeUserInDatabase(tgUser)
        } else {
          // Demo user for testing
          const demoUser = {
            id: 12345,
            first_name: "Demo User",
            username: "demo",
            last_name: "",
            language_code: "en",
          }
          setUser(demoUser)
          await initializeUserInDatabase(demoUser)
        }
      } else {
        // Demo user when not in Telegram
        const demoUser = {
          id: 12345,
          first_name: "Demo User",
          username: "demo",
          last_name: "",
          language_code: "en",
        }
        setUser(demoUser)
        await initializeUserInDatabase(demoUser)
      }
    } catch (error) {
      console.error("[v0] App initialization error:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeUserInDatabase = async (tgUser: TelegramUser) => {
    try {
      console.log("[v0] Sending user data to backend:", tgUser)

      const result = await apiClient.initializeUser({
        tg_id: tgUser.id,
        username: tgUser.username || "",
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || "",
        init_data: window.Telegram?.WebApp?.initData || "",
      })

      console.log("[v0] Backend response:", result)

      if (result.success && result.data) {
        setBalance(result.data.balance || 0.05)

        const inventoryResult = await apiClient.getUserInventory(tgUser.id)
        if (inventoryResult.success && inventoryResult.data) {
          setInventory(inventoryResult.data.inventory || [])
        }
      } else {
        console.error("[v0] Backend user creation failed:", result.error)
        // Fallback to demo balance
        setBalance(0.05)
      }
    } catch (error) {
      console.error("[v0] Backend communication error:", error)
      // Fallback to demo balance
      setBalance(0.05)
    }
  }

  return (
    <TonConnectProvider>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Header with user info and balance */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src={
                user?.photo_url || `/placeholder.svg?height=32&width=32&query=user avatar ${user?.first_name || "user"}`
              }
              alt={user?.first_name || "User"}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-white font-medium">{user?.first_name || "User"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-white font-medium">{balance.toFixed(2)}</span>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">+</span>
            </div>
          </div>
        </div>

        <OnlineStats />

        {/* Main content */}
        <div className="relative z-10 px-4 pb-24">
          {activeTab === "cases" && user && (
            <CasesSection
              user={user}
              balance={balance}
              onBalanceUpdate={setBalance}
              onInventoryUpdate={(newItem) => setInventory((prev) => [...prev, newItem])}
            />
          )}

          {activeTab === "upgrade" && user && (
            <UpgradeSection
              user={user}
              inventory={inventory}
              balance={balance}
              onBalanceUpdate={setBalance}
              onInventoryUpdate={setInventory}
            />
          )}

          {activeTab === "profile" && user && (
            <ProfileSection user={user} balance={balance} inventory={inventory} onBalanceUpdate={setBalance} />
          )}
        </div>

        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </TonConnectProvider>
  )
}
