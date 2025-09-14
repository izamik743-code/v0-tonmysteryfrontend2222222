"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { telegramWebApp } from "@/lib/telegram"
import { Users, Copy, Gift, Coins, Share, Loader2 } from "lucide-react"

interface ReferralSystemProps {
  userId: number
}

interface ReferralStats {
  referrals_count: number
  total_earned: number
  referral_code: string
}

export function ReferralSystem({ userId }: ReferralSystemProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    loadReferralStats()
  }, [userId])

  const loadReferralStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getReferralStats(userId)

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        // Fallback to default stats
        setStats({
          referrals_count: 0,
          total_earned: 0,
          referral_code: `ref_${userId}`,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to load referral stats:", error)
      setStats({
        referrals_count: 0,
        total_earned: 0,
        referral_code: `ref_${userId}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const getReferralLink = () => {
    if (!stats) return ""
    return `https://t.me/your_bot?start=${stats.referral_code}`
  }

  const copyReferralLink = async () => {
    try {
      setCopying(true)
      const link = getReferralLink()

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = link
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }

      telegramWebApp.hapticFeedback("success")
      telegramWebApp.showAlert("Реферальная ссылка скопирована!")
    } catch (error) {
      console.error("[v0] Failed to copy link:", error)
      telegramWebApp.hapticFeedback("error")
      telegramWebApp.showAlert("Ошибка при копировании ссылки")
    } finally {
      setCopying(false)
    }
  }

  const shareReferralLink = () => {
    const link = getReferralLink()
    const text = `🎁 Присоединяйся к TON Mystery Cases!\n\n💎 Открывай кейсы и выигрывай TON\n🎯 Получи бонус за регистрацию\n\n${link}`

    if (telegramWebApp.isAvailable()) {
      // Use Telegram sharing if available
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank")
    } else {
      // Fallback to generic sharing
      if (navigator.share) {
        navigator.share({
          title: "TON Mystery Cases",
          text: text,
          url: link,
        })
      } else {
        copyReferralLink()
      }
    }

    telegramWebApp.hapticFeedback("light")
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
          <p className="text-muted-foreground text-center">Не удалось загрузить данные реферальной системы</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Referral Stats */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Реферальная система
          </CardTitle>
          <CardDescription>Приглашайте друзей и получайте 10% от их депозитов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Рефералов</p>
                <p className="font-bold text-blue-400">{stats.referrals_count}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Заработано</p>
                <p className="font-bold text-yellow-400">{stats.total_earned.toFixed(2)} TON</p>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ваша реферальная ссылка:</label>
            <div className="flex gap-2">
              <Input value={getReferralLink()} readOnly className="font-mono text-xs" />
              <Button onClick={copyReferralLink} disabled={copying} variant="outline" size="sm">
                {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={shareReferralLink}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Share className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
            <Button onClick={copyReferralLink} disabled={copying} variant="outline" className="flex-1 bg-transparent">
              <Copy className="w-4 h-4 mr-2" />
              Копировать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Как это работает
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge
              variant="outline"
              className="bg-blue-500/20 text-blue-400 border-blue-500/30 min-w-6 h-6 flex items-center justify-center text-xs"
            >
              1
            </Badge>
            <div>
              <p className="font-medium">Поделитесь ссылкой</p>
              <p className="text-sm text-muted-foreground">Отправьте реферальную ссылку друзьям</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge
              variant="outline"
              className="bg-green-500/20 text-green-400 border-green-500/30 min-w-6 h-6 flex items-center justify-center text-xs"
            >
              2
            </Badge>
            <div>
              <p className="font-medium">Друг регистрируется</p>
              <p className="text-sm text-muted-foreground">Ваш друг переходит по ссылке и начинает играть</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge
              variant="outline"
              className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 min-w-6 h-6 flex items-center justify-center text-xs"
            >
              3
            </Badge>
            <div>
              <p className="font-medium">Получайте бонусы</p>
              <p className="text-sm text-muted-foreground">Получайте 10% от всех пополнений ваших рефералов</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
