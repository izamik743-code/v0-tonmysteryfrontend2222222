"use client"

import { useState, useEffect } from "react"
import { UpgradeSystemService } from "@/lib/upgrade-system"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Plus, Minus, TrendingUp } from "lucide-react"
import type { TelegramGift } from "@/types/telegram-gifts"
import type { TelegramUser } from "@/types"

interface InventoryItem {
  id: string
  gift_id: string
  quantity: number
  telegram_gifts: TelegramGift
}

interface UpgradeSectionProps {
  user: TelegramUser | null
  inventory: any[]
  balance: number
  onBalanceUpdate: (newBalance: number) => void
  onInventoryUpdate: (newInventory: any[]) => void
}

export function UpgradeSection({ user, inventory, balance, onBalanceUpdate, onInventoryUpdate }: UpgradeSectionProps) {
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; quantity: number }>>([])
  const [upgradeTargets, setUpgradeTargets] = useState<TelegramGift[]>([])
  const [selectedTarget, setSelectedTarget] = useState<TelegramGift | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeResult, setUpgradeResult] = useState<{
    success: boolean
    resultGift?: TelegramGift
  } | null>(null)

  const upgradeService = new UpgradeSystemService()

  useEffect(() => {
    if (selectedItems.length > 0) {
      const totalValue = calculateTotalValue()
      loadUpgradeTargets(totalValue)
    } else {
      setUpgradeTargets([])
      setSelectedTarget(null)
    }
  }, [selectedItems, inventory])

  const loadUpgradeTargets = async (inputValue: number) => {
    try {
      const targets = await upgradeService.getUpgradeTargets(inputValue)
      setUpgradeTargets(targets)
    } catch (error) {
      console.error("Failed to load upgrade targets:", error)
    }
  }

  const calculateTotalValue = (): number => {
    return selectedItems.reduce((sum, selected) => {
      const item = inventory.find((inv) => inv.gift?.id === selected.id)
      return sum + (item?.gift?.price_ton || 0) * selected.quantity
    }, 0)
  }

  const handleItemSelect = (giftId: string, change: number) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
    }

    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.id === giftId)
      const inventoryItem = inventory.find((inv) => inv.gift?.id === giftId)
      const maxQuantity = inventoryItem?.quantity || 1

      if (existing) {
        const newQuantity = Math.max(0, Math.min(maxQuantity, existing.quantity + change))
        if (newQuantity === 0) {
          return prev.filter((item) => item.id !== giftId)
        }
        return prev.map((item) => (item.id === giftId ? { ...item, quantity: newQuantity } : item))
      } else if (change > 0) {
        return [...prev, { id: giftId, quantity: 1 }]
      }
      return prev
    })
  }

  const handleUpgrade = async () => {
    if (!selectedTarget || selectedItems.length === 0) return

    setIsUpgrading(true)

    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy")
    }

    try {
      const contract = await upgradeService.createUpgradeContract(
        user?.id.toString() || "demo-user",
        selectedItems,
        selectedTarget.id,
      )
      const result = await upgradeService.executeUpgrade(contract.id)

      setUpgradeResult(result)

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(result.success ? "success" : "error")
      }

      if (result.success && result.resultGift) {
        const newItem = {
          id: Date.now(),
          gift: result.resultGift,
          opened_at: new Date().toISOString(),
          case_name: "Upgrade",
        }
        onInventoryUpdate([...inventory, newItem])
      }

      setSelectedItems([])
      setSelectedTarget(null)
    } catch (error) {
      console.error("Upgrade failed:", error)
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error")
      }
    } finally {
      setIsUpgrading(false)
    }
  }

  const resetUpgrade = () => {
    setUpgradeResult(null)
    setSelectedItems([])
    setSelectedTarget(null)
  }

  if (upgradeResult) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8 text-center relative overflow-hidden">
          <div
            className={`absolute inset-0 ${
              upgradeResult.success
                ? "bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10"
                : "bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10"
            } animate-pulse`}
          />

          <div className="relative z-10">
            <div className="mb-6">
              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  upgradeResult.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {upgradeResult.success ? <TrendingUp className="w-10 h-10" /> : <div className="text-2xl">💔</div>}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {upgradeResult.success ? "Успешный апгрейд!" : "Неудачный апгрейд"}
              </h3>

              {upgradeResult.resultGift && (
                <div className="mt-6">
                  <img
                    src={
                      upgradeResult.resultGift.image ||
                      `/placeholder.svg?height=96&width=96&query=${upgradeResult.resultGift.name || "/placeholder.svg"}`
                    }
                    alt={upgradeResult.resultGift.name}
                    className="w-24 h-24 mx-auto rounded-2xl mb-3"
                  />
                  <h4 className="text-xl font-semibold text-white">{upgradeResult.resultGift.name}</h4>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                    <span className="text-blue-400 text-lg font-bold">{upgradeResult.resultGift.price_ton} TON</span>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={resetUpgrade} className="bg-blue-500 hover:bg-blue-600 text-white px-8 rounded-2xl">
              Попробовать еще
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  const totalValue = calculateTotalValue()
  const successChance = selectedTarget ? upgradeService.calculateSuccessChance(totalValue, selectedTarget.price_ton) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Upgrade</h1>
        <p className="text-gray-400">Улучшай свои НФТ подарки как в CS:GO</p>
      </div>

      {/* Selected Items */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Выбранные предметы</h3>
        {selectedItems.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Выберите предметы для апгрейда</p>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((selected) => {
              const item = inventory.find((inv) => inv.gift?.id === selected.id)
              if (!item) return null

              return (
                <div key={selected.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <img
                    src={
                      item.gift.image ||
                      `/placeholder.svg?height=48&width=48&query=${item.gift.name || "/placeholder.svg"}`
                    }
                    alt={item.gift.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.gift.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                      <span className="text-blue-400 text-sm">{item.gift.price_ton} TON</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemSelect(selected.id, -1)}
                      className="w-8 h-8 p-0 border-white/20"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-white font-medium w-8 text-center">{selected.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemSelect(selected.id, 1)}
                      className="w-8 h-8 p-0 border-white/20"
                      disabled={selected.quantity >= (item.quantity || 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Общая стоимость:</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <span className="text-blue-400 font-bold">{totalValue.toFixed(2)} TON</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Upgrade Arrow */}
      {selectedItems.length > 0 && (
        <div className="flex justify-center">
          <div className="bg-blue-500/20 rounded-full p-4">
            <ArrowRight className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      )}

      {/* Upgrade Targets */}
      {upgradeTargets.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Возможные улучшения</h3>
          <div className="grid grid-cols-2 gap-3">
            {upgradeTargets.slice(0, 6).map((target) => {
              const chance = upgradeService.calculateSuccessChance(totalValue, target.price_ton)
              const isSelected = selectedTarget?.id === target.id

              return (
                <button
                  key={target.id}
                  onClick={() => {
                    setSelectedTarget(target)
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium")
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <img
                    src={target.image || `/placeholder.svg?height=64&width=64&query=${target.name}`}
                    alt={target.name}
                    className="w-16 h-16 mx-auto rounded-lg mb-2"
                  />
                  <p className="text-white font-medium text-sm mb-1">{target.name}</p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-blue-400 text-sm font-semibold">{target.price_ton}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      chance >= 0.7
                        ? "bg-green-500/20 text-green-400"
                        : chance >= 0.4
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {Math.round(chance * 100)}%
                  </Badge>
                </button>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Upgrade Button */}
      {selectedTarget && selectedItems.length > 0 && (
        <Button
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-semibold rounded-2xl shadow-lg shadow-green-500/25"
        >
          {isUpgrading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Улучшение...
            </div>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              Улучшить ({Math.round(successChance * 100)}% шанс)
            </>
          )}
        </Button>
      )}

      {/* Inventory */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Инвентарь</h3>
        {inventory.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Инвентарь пуст</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {inventory.map((item) => {
              const selected = selectedItems.find((s) => s.id === item.gift?.id)
              const selectedQuantity = selected?.quantity || 0

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.gift?.id, 1)}
                  disabled={selectedQuantity >= (item.quantity || 1)}
                  className="p-3 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="relative">
                    <img
                      src={
                        item.gift?.image ||
                        `/placeholder.svg?height=48&width=48&query=${item.gift?.name || "/placeholder.svg"}`
                      }
                      alt={item.gift?.name}
                      className="w-12 h-12 mx-auto rounded-lg mb-2"
                    />
                    {selectedQuantity > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectedQuantity}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium mb-1 truncate">{item.gift?.name}</p>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-blue-400 text-xs">{item.gift?.price_ton}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    x{item.quantity || 1}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
