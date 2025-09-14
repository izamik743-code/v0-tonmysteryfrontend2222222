"use client"

import { useState, useEffect } from "react"
import { UpgradeSystemService } from "@/lib/upgrade-system"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Plus, Minus, TrendingUp, Sparkles, Zap } from "lucide-react"
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
                {upgradeResult.success ? <Sparkles className="w-10 h-10" /> : <div className="text-2xl">💔</div>}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {upgradeResult.success ? "🎉 Успешный апгрейд!" : "😔 Неудачный апгрейд"}
              </h3>

              {upgradeResult.resultGift && (
                <div className="mt-6">
                  <div className="relative inline-block">
                    <img
                      src={
                        upgradeResult.resultGift.image ||
                        `/placeholder.svg?height=96&width=96&query=${upgradeResult.resultGift.name || "/placeholder.svg"}`
                      }
                      alt={upgradeResult.resultGift.name}
                      className="w-24 h-24 mx-auto rounded-2xl mb-3 shadow-2xl"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl -z-10" />
                  </div>
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

            <Button
              onClick={resetUpgrade}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 rounded-2xl shadow-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
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
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Upgrade System
          </h1>
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
        <p className="text-gray-400">Улучшай свои НФТ подарки как в CS:GO</p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">70%+ Высокий шанс</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-yellow-400">40-70% Средний шанс</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-400">&lt;40% Низкий шанс</span>
          </div>
        </div>
      </div>

      {/* Selected Items */}
      <GlassCard className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Выбранные предметы</h3>
        </div>
        {selectedItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-500/20 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">Выберите предметы для апгрейда</p>
            <p className="text-gray-500 text-sm mt-1">Нажмите на предметы в инвентаре ниже</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((selected) => {
              const item = inventory.find((inv) => inv.gift?.id === selected.id)
              if (!item) return null

              return (
                <div
                  key={selected.id}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10"
                >
                  <div className="relative">
                    <img
                      src={
                        item.gift.image ||
                        `/placeholder.svg?height=48&width=48&query=${item.gift.name || "/placeholder.svg"}`
                      }
                      alt={item.gift.name}
                      className="w-12 h-12 rounded-lg shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{selected.quantity}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.gift.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">T</span>
                      </div>
                      <span className="text-blue-400 text-sm font-semibold">{item.gift.price_ton} TON</span>
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                        {item.gift.rarity}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemSelect(selected.id, -1)}
                      className="w-8 h-8 p-0 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50"
                    >
                      <Minus className="w-4 h-4 text-red-400" />
                    </Button>
                    <span className="text-white font-bold w-8 text-center">{selected.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemSelect(selected.id, 1)}
                      className="w-8 h-8 p-0 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50"
                      disabled={selected.quantity >= (item.quantity || 1)}
                    >
                      <Plus className="w-4 h-4 text-green-400" />
                    </Button>
                  </div>
                </div>
              )
            })}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-xl">
                <span className="text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Общая стоимость:
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <span className="text-blue-400 font-bold text-lg">{totalValue.toFixed(2)} TON</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Upgrade Arrow */}
      {selectedItems.length > 0 && (
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full p-4 border border-blue-500/30">
            <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
        </div>
      )}

      {/* Upgrade Targets */}
      {upgradeTargets.length > 0 && (
        <GlassCard className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Возможные улучшения</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/25"
                      : "border-white/10 bg-gradient-to-br from-white/5 to-white/10 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-500/10 hover:to-pink-500/10"
                  }`}
                >
                  <div className="relative mb-3">
                    <img
                      src={target.image || `/placeholder.svg?height=64&width=64&query=${target.name}`}
                      alt={target.name}
                      className="w-16 h-16 mx-auto rounded-lg shadow-lg"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-sm -z-10" />
                    )}
                  </div>
                  <p className="text-white font-medium text-sm mb-2 truncate">{target.name}</p>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-blue-400 text-sm font-semibold">{target.price_ton}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold ${
                      chance >= 0.7
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : chance >= 0.4
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {Math.round(chance * 100)}% шанс
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
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-semibold rounded-2xl shadow-lg shadow-green-500/25 transition-all duration-300 hover:shadow-green-500/40 hover:scale-[1.02]"
        >
          {isUpgrading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Улучшение...
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Улучшить ({Math.round(successChance * 100)}% шанс успеха)
            </>
          )}
        </Button>
      )}

      {/* Inventory */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
          <h3 className="text-lg font-semibold text-white">Инвентарь</h3>
        </div>
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-500/20 rounded-full flex items-center justify-center">
              <div className="text-2xl">📦</div>
            </div>
            <p className="text-gray-400">Инвентарь пуст</p>
            <p className="text-gray-500 text-sm mt-1">Откройте кейсы, чтобы получить предметы</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {inventory.map((item) => {
              const selected = selectedItems.find((s) => s.id === item.gift?.id)
              const selectedQuantity = selected?.quantity || 0
              const rarityColors = {
                common: "border-gray-500/30 hover:border-gray-400/50",
                rare: "border-blue-500/30 hover:border-blue-400/50",
                epic: "border-purple-500/30 hover:border-purple-400/50",
                legendary: "border-yellow-500/30 hover:border-yellow-400/50",
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.gift?.id, 1)}
                  disabled={selectedQuantity >= (item.quantity || 1)}
                  className={`p-3 rounded-xl border ${rarityColors[item.gift?.rarity as keyof typeof rarityColors] || rarityColors.common} bg-white/5 hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
                >
                  <div className="relative">
                    <img
                      src={
                        item.gift?.image ||
                        `/placeholder.svg?height=48&width=48&query=${item.gift?.name || "/placeholder.svg"}`
                      }
                      alt={item.gift?.name}
                      className="w-12 h-12 mx-auto rounded-lg mb-2 shadow-md"
                    />
                    {selectedQuantity > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs font-bold">{selectedQuantity}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium mb-1 truncate">{item.gift?.name}</p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-blue-400 text-xs font-semibold">{item.gift?.price_ton}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-white/10">
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
