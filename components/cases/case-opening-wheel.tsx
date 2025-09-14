"use client"

import { useState, useEffect, useRef } from "react"
import type { TelegramGift } from "@/types/telegram-gifts"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Rocket, RotateCcw } from "lucide-react"

interface CaseOpeningWheelProps {
  rewards: TelegramGift[]
  onOpen: () => Promise<TelegramGift>
  isOpening: boolean
  caseName: string
  casePrice: number
  userBalance: number
}

export function CaseOpeningWheel({
  rewards,
  onOpen,
  isOpening,
  caseName,
  casePrice,
  userBalance,
}: CaseOpeningWheelProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [wonItem, setWonItem] = useState<TelegramGift | null>(null)
  const [showResult, setShowResult] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Create extended rewards array for smooth infinite scroll
  const extendedRewards = [
    ...rewards,
    ...rewards,
    ...rewards,
    ...rewards,
    ...rewards, // 5 copies for smooth animation
  ]

  const handleOpen = async () => {
    if (isOpening || isAnimating) return

    if (userBalance < casePrice) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error")
      }
      return
    }

    setIsAnimating(true)
    setWonItem(null)
    setShowResult(false)

    try {
      // Trigger strong haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy")
      }

      // Start the spinning animation immediately
      if (wheelRef.current) {
        wheelRef.current.style.transition = "none"
        wheelRef.current.style.transform = "translateX(0px)"
      }

      // Get the winning item
      const result = await onOpen()

      // Find winning position in the middle section
      const winIndex = rewards.findIndex((r) => r.id === result.id)
      const middleSectionStart = rewards.length * 2 // Start of middle section
      const finalIndex = middleSectionStart + winIndex

      // Calculate final position (center the winning item)
      const itemWidth = 100 // Width + gap
      const containerWidth = containerRef.current?.offsetWidth || 320
      const centerOffset = containerWidth / 2 - itemWidth / 2
      const finalPosition = finalIndex * itemWidth - centerOffset

      // Animate to final position with easing
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        wheelRef.current.style.transform = `translateX(-${finalPosition}px)`
      }

      // Add periodic vibrations during animation
      const vibrationInterval = setInterval(() => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred("light")
        }
      }, 200)

      // Show result after animation completes
      setTimeout(() => {
        clearInterval(vibrationInterval)
        setWonItem(result)
        setIsAnimating(false)
        setShowResult(true)

        // Success haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success")
        }
      }, 4000)
    } catch (error) {
      console.error("Case opening failed:", error)
      setIsAnimating(false)

      // Error haptic feedback
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("error")
      }
    }
  }

  const resetWheel = () => {
    setWonItem(null)
    setShowResult(false)
    setIsAnimating(false)
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none"
      wheelRef.current.style.transform = "translateX(0px)"
    }
  }

  useEffect(() => {
    resetWheel()
  }, [rewards])

  if (showResult && wonItem) {
    return (
      <div className="space-y-6">
        {/* Result Display */}
        <GlassCard className="p-8 text-center relative overflow-hidden">
          {/* Celebration background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse" />

          <div className="relative z-10">
            <div className="mb-6">
              <div className="relative inline-block">
                <img
                  src={wonItem.image || `/placeholder.svg?height=128&width=128&query=${wonItem.name}`}
                  alt={wonItem.name}
                  className="w-32 h-32 mx-auto rounded-2xl shadow-2xl"
                />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl -z-10" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-white mb-3">{wonItem.name}</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <span className="text-blue-400 text-2xl font-bold">{wonItem.price_ton} TON</span>
            </div>
            <p className="text-gray-400 mb-6">{wonItem.description}</p>

            <div className="flex gap-3">
              <Button onClick={resetWheel} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-3">
                <RotateCcw className="w-5 h-5 mr-2" />
                Открыть еще
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">{caseName}</h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <span className="text-blue-400 text-xl font-semibold">{casePrice} TON</span>
        </div>
        {userBalance < casePrice && (
          <p className="text-red-400 text-sm">Недостаточно средств (баланс: {userBalance.toFixed(2)} TON)</p>
        )}
        {isAnimating && <p className="text-yellow-400 text-sm animate-pulse">Определяем выигрыш...</p>}
      </div>

      {/* Spinning Wheel Container */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div ref={containerRef} className="relative">
          {/* Center indicator line with glow */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-blue-500 z-20 transform -translate-x-0.5 shadow-lg shadow-blue-500/50">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
          </div>

          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-900/80 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-900/80 to-transparent z-10" />

          {/* Scrolling items */}
          <div className="overflow-hidden py-4">
            <div
              ref={wheelRef}
              className="flex gap-4"
              style={{
                width: `${extendedRewards.length * 100}px`,
              }}
            >
              {extendedRewards.map((reward, index) => {
                const rarityColors = {
                  common: "from-gray-500/20 to-gray-600/20 border-gray-500/30",
                  rare: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
                  epic: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
                  legendary: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
                }

                return (
                  <div key={`${reward.id}-${index}`} className="flex-shrink-0 w-20 text-center">
                    <div
                      className={`bg-gradient-to-br ${
                        rarityColors[reward.rarity as keyof typeof rarityColors]
                      } rounded-xl p-3 border backdrop-blur-sm transition-all duration-300 hover:scale-105`}
                    >
                      <img
                        src={reward.image || `/placeholder.svg?height=64&width=64&query=${reward.name}`}
                        alt={reward.name}
                        className="w-14 h-14 mx-auto rounded-lg mb-2 object-cover"
                      />
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        <span className="text-blue-400 text-xs font-semibold">{reward.price_ton}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Possible Rewards Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white text-center">Что внутри?</h3>
        <div className="grid grid-cols-3 gap-3">
          {rewards
            .sort((a, b) => b.price_ton - a.price_ton)
            .slice(0, 6)
            .map((reward) => {
              const rarityColors = {
                common: "from-gray-500/10 to-gray-600/10 border-gray-500/20",
                rare: "from-blue-500/10 to-blue-600/10 border-blue-500/20",
                epic: "from-purple-500/10 to-purple-600/10 border-purple-500/20",
                legendary: "from-yellow-500/10 to-yellow-600/10 border-yellow-500/20",
              }

              return (
                <GlassCard
                  key={reward.id}
                  className={`p-3 text-center bg-gradient-to-br ${
                    rarityColors[reward.rarity as keyof typeof rarityColors]
                  } border`}
                >
                  <img
                    src={reward.image || `/placeholder.svg?height=48&width=48&query=${reward.name}`}
                    alt={reward.name}
                    className="w-12 h-12 mx-auto rounded-lg mb-2"
                  />
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-blue-400 text-xs font-semibold">{reward.price_ton}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{reward.name}</p>
                </GlassCard>
              )
            })}
        </div>
      </div>

      {/* Open Button */}
      <Button
        onClick={handleOpen}
        disabled={isOpening || isAnimating || userBalance < casePrice}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 text-lg font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isAnimating ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Открывается...
          </div>
        ) : userBalance < casePrice ? (
          "Недостаточно средств"
        ) : (
          <>
            <Rocket className="w-5 h-5 mr-2" />
            Открыть за {casePrice} TON
          </>
        )}
      </Button>
    </div>
  )
}
