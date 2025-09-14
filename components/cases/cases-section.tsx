"use client"

import { useState, useEffect } from "react"
import { TelegramGiftsService } from "@/lib/telegram-gifts"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { CaseOpeningWheel } from "./case-opening-wheel"
import { RecentWins } from "./recent-wins"
import type { TelegramGift } from "@/types/telegram-gifts"
import type { TelegramUser } from "@/types"

interface Case {
  id: string
  name: string
  price_ton: number
  image_url: string
  description: string
  case_rewards: Array<{
    probability: number
    telegram_gifts: TelegramGift
  }>
}

interface CasesSectionProps {
  user: TelegramUser | null
  balance: number
  onBalanceUpdate: (newBalance: number) => void
  onInventoryUpdate: (newItem: any) => void
}

export function CasesSection({ user, balance, onBalanceUpdate, onInventoryUpdate }: CasesSectionProps) {
  const [cases, setCases] = useState<Case[]>([])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid")

  const giftsService = new TelegramGiftsService()

  useEffect(() => {
    const loadCases = async () => {
      try {
        const data = await giftsService.getCases()
        setCases(data)
      } catch (error) {
        console.error("Failed to load cases:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCases()
  }, [])

  const handleOpenCase = async (): Promise<TelegramGift> => {
    if (!selectedCase) throw new Error("No case selected")

    if (balance < selectedCase.price_ton) {
      throw new Error("Недостаточно средств")
    }

    setIsOpening(true)
    try {
      const result = await giftsService.openCase(selectedCase.id, user?.id.toString() || "demo-user")

      onBalanceUpdate(balance - selectedCase.price_ton)
      onInventoryUpdate({
        id: Date.now(),
        gift: result,
        opened_at: new Date().toISOString(),
        case_name: selectedCase.name,
      })

      return result
    } finally {
      setIsOpening(false)
    }
  }

  const getCaseGradient = (price: number) => {
    if (price === 0) return "from-gray-500/30 to-gray-700/30"
    if (price <= 0.5) return "from-green-500/30 to-emerald-600/30"
    if (price <= 1) return "from-blue-500/30 to-cyan-600/30"
    if (price <= 1.5) return "from-purple-500/30 to-violet-600/30"
    return "from-yellow-500/30 to-orange-600/30"
  }

  const getCaseBorderGlow = (price: number) => {
    if (price === 0) return "shadow-gray-500/20"
    if (price <= 0.5) return "shadow-green-500/20"
    if (price <= 1) return "shadow-blue-500/20"
    if (price <= 1.5) return "shadow-purple-500/20"
    return "shadow-yellow-500/20"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-white/10 rounded-lg" />
          </GlassCard>
        ))}
      </div>
    )
  }

  if (selectedCase) {
    const rewards = selectedCase.case_rewards.map((cr) => ({
      ...cr.telegram_gifts,
      probability: cr.probability,
    }))

    return (
      <div className="space-y-6">
        <Button onClick={() => setSelectedCase(null)} variant="ghost" className="text-gray-400 hover:text-white">
          ← Назад к кейсам
        </Button>

        <CaseOpeningWheel
          rewards={rewards}
          onOpen={handleOpenCase}
          isOpening={isOpening}
          caseName={selectedCase.name}
          casePrice={selectedCase.price_ton}
          userBalance={balance}
        />
      </div>
    )
  }

  const filteredCases = cases.filter((caseItem) =>
    activeTab === "free" ? caseItem.price_ton === 0 : caseItem.price_ton > 0,
  )

  return (
    <div className="space-y-6">
      <RecentWins />

      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Mystery Cases</h1>
        <p className="text-gray-400">Открывай кейсы и получай НФТ подарки Telegram</p>
      </div>

      <div className="flex gap-2 bg-gray-800/50 p-1 rounded-2xl">
        <Button
          onClick={() => setActiveTab("paid")}
          className={`flex-1 rounded-xl py-3 transition-all ${
            activeTab === "paid"
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
              : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Paid
        </Button>
        <Button
          onClick={() => setActiveTab("free")}
          className={`flex-1 rounded-xl py-3 transition-all ${
            activeTab === "free"
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
              : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Free
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredCases.map((caseItem) => (
          <div key={caseItem.id} className="case-3d">
            <div
              className={`case-3d-inner glass-case case-blur-edges rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${getCaseBorderGlow(caseItem.price_ton)} hover:shadow-2xl`}
              onClick={() => setSelectedCase(caseItem)}
            >
              <div
                className={`aspect-square mb-4 rounded-xl overflow-hidden bg-gradient-to-br ${getCaseGradient(caseItem.price_ton)} relative group`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <img
                  src={
                    caseItem.image_url || `/placeholder.svg?height=150&width=150&query=3D mystery case ${caseItem.name}`
                  }
                  alt={caseItem.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <span className="text-white font-semibold text-sm">
                      {caseItem.price_ton === 0 ? "FREE" : caseItem.price_ton}
                    </span>
                  </div>
                </div>

                {caseItem.price_ton > balance && caseItem.price_ton > 0 && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-red-500/80 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-white text-xs font-medium">Недостаточно</span>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg leading-tight">{caseItem.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{caseItem.description}</p>

                <div className="flex items-center gap-1 mt-3">
                  {caseItem.case_rewards.slice(0, 3).map((reward, index) => (
                    <div key={index} className="text-lg">
                      {reward.telegram_gifts.emoji || reward.telegram_gifts.name.charAt(0)}
                    </div>
                  ))}
                  {caseItem.case_rewards.length > 3 && (
                    <span className="text-gray-400 text-sm">+{caseItem.case_rewards.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {activeTab === "free" ? "Бесплатные кейсы скоро появятся!" : "Платные кейсы загружаются..."}
          </p>
        </div>
      )}
    </div>
  )
}
