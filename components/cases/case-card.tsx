"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CaseType } from "@/types"
import { getRarityColor } from "@/lib/cases"
import { Coins, Zap } from "lucide-react"

interface CaseCardProps {
  caseType: CaseType
  onOpen: (caseId: string) => void
  disabled?: boolean
  userBalance: number
}

export function CaseCard({ caseType, onOpen, disabled, userBalance }: CaseCardProps) {
  const canAfford = userBalance >= caseType.price || caseType.price === 0
  const isDisabled = disabled || !canAfford

  const handleOpen = () => {
    if (!isDisabled) {
      onOpen(caseType.id)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group">
      <CardHeader className="text-center pb-3">
        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{caseType.emoji}</div>
        <CardTitle className="text-lg">{caseType.name}</CardTitle>
        <CardDescription className="text-sm">{caseType.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-center justify-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-xl font-bold text-yellow-400">
            {caseType.price === 0 ? "Бесплатно" : `${caseType.price} TON`}
          </span>
        </div>

        {/* Rewards Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Возможные награды:</h4>
          <div className="grid grid-cols-2 gap-1">
            {caseType.rewards.slice(0, 4).map((reward, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`text-xs justify-center ${getRarityColor(reward.rarity)}`}
              >
                {reward.name}
              </Badge>
            ))}
          </div>
          {caseType.rewards.length > 4 && (
            <p className="text-xs text-muted-foreground text-center">+{caseType.rewards.length - 4} других наград</p>
          )}
        </div>

        {/* Open Button */}
        <Button
          onClick={handleOpen}
          disabled={isDisabled}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 mr-2" />
          {!canAfford && caseType.price > 0 ? "Недостаточно средств" : "Открыть кейс"}
        </Button>

        {!canAfford && caseType.price > 0 && (
          <p className="text-xs text-red-400 text-center">Нужно еще {(caseType.price - userBalance).toFixed(2)} TON</p>
        )}
      </CardContent>
    </Card>
  )
}
