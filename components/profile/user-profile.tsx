"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { TelegramUser, UserState } from "@/types"
import { User, Coins, Package, Trophy, Calendar } from "lucide-react"

interface UserProfileProps {
  user: TelegramUser
  userState: UserState
}

export function UserProfile({ user, userState }: UserProfileProps) {
  const joinDate = new Date().toLocaleDateString("ru-RU")
  const totalValue = userState.inventory.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`https://api.telegram.org/file/bot<BOT_TOKEN>/photos/file_${user.id}.jpg`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
              {user.first_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {user.first_name} {user.last_name || ""}
            </CardTitle>
            <CardDescription>{user.username ? `@${user.username}` : `ID: ${user.id}`}</CardDescription>
            {user.is_premium && (
              <Badge variant="secondary" className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Telegram Premium
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Баланс</p>
              <p className="font-bold text-yellow-400">{userState.balance.toFixed(2)} TON</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Package className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Предметов</p>
              <p className="font-bold text-blue-400">{userState.inventory.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Trophy className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Заработано</p>
              <p className="font-bold text-green-400">{totalValue.toFixed(2)} TON</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-muted-foreground">Кейсов</p>
              <p className="font-bold text-purple-400">{userState.casesOpened || 0}</p>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Статус кошелька:</span>
            <Badge
              variant={userState.walletConnected ? "default" : "secondary"}
              className={
                userState.walletConnected
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }
            >
              {userState.walletConnected ? "Подключен" : "Не подключен"}
            </Badge>
          </div>
          {userState.walletAddress && (
            <p className="text-xs text-muted-foreground mt-1">
              {userState.walletAddress.slice(0, 8)}...{userState.walletAddress.slice(-6)}
            </p>
          )}
        </div>

        {/* Join Date */}
        <div className="text-center text-sm text-muted-foreground">Играет с {joinDate}</div>
      </CardContent>
    </Card>
  )
}
