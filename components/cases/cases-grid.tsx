"use client"

import { useState } from "react"
import { CaseCard } from "./case-card"
import { CaseOpeningAnimation } from "./case-opening-animation"
import { CASE_TYPES, getCaseById, getRandomReward, createInventoryItem } from "@/lib/cases"
import { apiClient } from "@/lib/api"
import { telegramWebApp } from "@/lib/telegram"
import type { InventoryItem } from "@/types"

interface CasesGridProps {
  userId: number
  userBalance: number
  isFirstTime: boolean
  onBalanceUpdate: (newBalance: number) => void
  onInventoryUpdate: (newItem: InventoryItem) => void
  onFirstTimeUpdate: () => void
}

export function CasesGrid({
  userId,
  userBalance,
  isFirstTime,
  onBalanceUpdate,
  onInventoryUpdate,
  onFirstTimeUpdate,
}: CasesGridProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [currentReward, setCurrentReward] = useState<InventoryItem | null>(null)
  const [currentCaseEmoji, setCurrentCaseEmoji] = useState("")

  const handleOpenCase = async (caseId: string) => {
    const caseType = getCaseById(caseId)
    if (!caseType) return

    // Check if user can afford the case
    if (caseType.price > userBalance && !(caseId === "demo" && isFirstTime)) {
      telegramWebApp.showAlert("Недостаточно средств для открытия кейса!")
      return
    }

    try {
      setIsOpening(true)
      setCurrentCaseEmoji(caseType.emoji)
      telegramWebApp.hapticFeedback("light")

      // For demo case on first time, handle locally
      if (caseId === "demo" && isFirstTime) {
        const reward = getRandomReward(caseType)
        const inventoryItem = createInventoryItem(reward)

        setCurrentReward(inventoryItem)
        onBalanceUpdate(userBalance + reward.value)
        onInventoryUpdate(inventoryItem)
        onFirstTimeUpdate()

        telegramWebApp.hapticFeedback("success")
        return
      }

      // Try backend API first
      const response = await apiClient.openCase(userId, caseId)

      if (response.success && response.data) {
        setCurrentReward(response.data.reward)
        onBalanceUpdate(response.data.newBalance)
        onInventoryUpdate(response.data.reward)
        telegramWebApp.hapticFeedback("success")
      } else {
        // Fallback to local logic
        const reward = getRandomReward(caseType)
        const inventoryItem = createInventoryItem(reward)

        setCurrentReward(inventoryItem)
        onBalanceUpdate(userBalance - caseType.price + reward.value)
        onInventoryUpdate(inventoryItem)
        telegramWebApp.hapticFeedback("success")
      }
    } catch (error) {
      console.error("[v0] Case opening error:", error)

      // Fallback to local logic on error
      try {
        const reward = getRandomReward(caseType)
        const inventoryItem = createInventoryItem(reward)

        setCurrentReward(inventoryItem)
        onBalanceUpdate(userBalance - caseType.price + reward.value)
        onInventoryUpdate(inventoryItem)
        telegramWebApp.hapticFeedback("success")
      } catch (fallbackError) {
        console.error("[v0] Fallback case opening error:", fallbackError)
        telegramWebApp.showAlert("Ошибка при открытии кейса")
        telegramWebApp.hapticFeedback("error")
      }
    }
  }

  const handleCloseAnimation = () => {
    setIsOpening(false)
    setCurrentReward(null)
    setCurrentCaseEmoji("")
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CASE_TYPES.map((caseType) => (
          <CaseCard
            key={caseType.id}
            caseType={caseType}
            onOpen={handleOpenCase}
            disabled={isOpening}
            userBalance={userBalance}
          />
        ))}
      </div>

      <CaseOpeningAnimation
        isOpen={isOpening}
        reward={currentReward}
        caseEmoji={currentCaseEmoji}
        onClose={handleCloseAnimation}
      />
    </>
  )
}
