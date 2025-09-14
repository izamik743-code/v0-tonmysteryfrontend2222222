"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { InventoryItem } from "@/types"
import { getRarityColor, getRarityName } from "@/lib/cases"
import { Sparkles, Gift } from "lucide-react"

interface CaseOpeningAnimationProps {
  isOpen: boolean
  reward: InventoryItem | null
  caseEmoji: string
  onClose: () => void
}

export function CaseOpeningAnimation({ isOpen, reward, caseEmoji, onClose }: CaseOpeningAnimationProps) {
  const [stage, setStage] = useState<"opening" | "revealing" | "revealed">("opening")

  useEffect(() => {
    if (isOpen && reward) {
      setStage("opening")

      // Opening animation
      const openingTimer = setTimeout(() => {
        setStage("revealing")
      }, 1500)

      // Reveal animation
      const revealTimer = setTimeout(() => {
        setStage("revealed")
      }, 3000)

      return () => {
        clearTimeout(openingTimer)
        clearTimeout(revealTimer)
      }
    }
  }, [isOpen, reward])

  if (!isOpen || !reward) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-md border-border/50">
        <CardContent className="p-8 text-center space-y-6">
          {stage === "opening" && (
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">{caseEmoji}</div>
              <h3 className="text-xl font-bold">Открываем кейс...</h3>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          )}

          {stage === "revealing" && (
            <div className="space-y-4">
              <div className="relative">
                <Gift className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <Sparkles className="w-6 h-6 absolute -top-2 -right-2 text-yellow-400 animate-ping" />
                <Sparkles
                  className="w-4 h-4 absolute -bottom-1 -left-1 text-blue-400 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
              <h3 className="text-xl font-bold">Что же там внутри?</h3>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {stage === "revealed" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-yellow-400" />
                <h3 className="text-2xl font-bold text-green-400">Поздравляем!</h3>
                <p className="text-muted-foreground">Вы выиграли:</p>
              </div>

              <div className={`p-4 rounded-lg border-2 ${getRarityColor(reward.rarity)}`}>
                <div className="text-3xl font-bold mb-2">{reward.name}</div>
                <div className="text-sm opacity-75">{getRarityName(reward.rarity)} предмет</div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Награда добавлена в ваш инвентарь</p>
                <Button onClick={onClose} className="w-full">
                  Отлично!
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
