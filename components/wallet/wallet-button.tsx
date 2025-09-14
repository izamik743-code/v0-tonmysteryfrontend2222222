"use client"

import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react"
import { Button } from "@/components/ui/button"
import { Wallet, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { telegramWebApp } from "@/lib/telegram"

interface WalletButtonProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
  className?: string
}

export function WalletButton({ onConnect, onDisconnect, className }: WalletButtonProps) {
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (wallet && onConnect) {
      onConnect(wallet.account.address)
      telegramWebApp.hapticFeedback("success")
    } else if (!wallet && onDisconnect) {
      onDisconnect()
    }
  }, [wallet, onConnect, onDisconnect])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      telegramWebApp.hapticFeedback("light")
      await tonConnectUI.openModal()
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      telegramWebApp.hapticFeedback("error")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      telegramWebApp.hapticFeedback("light")
      await tonConnectUI.disconnect()
    } catch (error) {
      console.error("[v0] Wallet disconnection error:", error)
    }
  }

  if (wallet) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
          <Zap className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">
            {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-400 border-red-400/30 hover:bg-red-500/10 bg-transparent"
        >
          Отключить
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 ${className}`}
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Подключение..." : "Подключить TON кошелёк"}
    </Button>
  )
}
