"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { useWallet } from "./ton-wallet-provider"
import { Wallet, ExternalLink, Copy, Check } from "lucide-react"
import { useTelegramHaptics } from "@/hooks/use-telegram-haptics"

export function WalletConnectButton() {
  const { isConnected, walletAddress, isConnecting, connectWallet, disconnectWallet } = useWallet()
  const [copied, setCopied] = useState(false)
  const { triggerImpact, triggerNotification } = useTelegramHaptics()

  const handleConnect = async () => {
    try {
      triggerImpact("medium")
      await connectWallet()
      triggerNotification("success")
    } catch (error) {
      console.error("[v0] Connection failed:", error)
      triggerNotification("error")
    }
  }

  const handleDisconnect = async () => {
    try {
      triggerImpact("light")
      await disconnectWallet()
      triggerNotification("success")
    } catch (error) {
      console.error("[v0] Disconnection failed:", error)
      triggerNotification("error")
    }
  }

  const copyAddress = async () => {
    if (!walletAddress) return

    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      triggerImpact("light")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy address:", error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  if (isConnected && walletAddress) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">Кошелек подключен</p>
              <p className="text-gray-400 text-sm">{formatAddress(walletAddress)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={copyAddress} className="p-2">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDisconnect} className="p-2">
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="text-center">
          <div id="ton-connect-button" />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6 text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Wallet className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Подключите кошелек</h3>
        <p className="text-gray-400 text-sm">Подключите TON кошелек для совершения транзакций</p>
      </div>

      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-3"
      >
        {isConnecting ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Подключение...
          </div>
        ) : (
          <>
            <Wallet className="w-5 h-5 mr-2" />
            Подключить кошелек
          </>
        )}
      </Button>

      <div className="mt-4">
        <div id="ton-connect-button" />
      </div>
    </GlassCard>
  )
}
