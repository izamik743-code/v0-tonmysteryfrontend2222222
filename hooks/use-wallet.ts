"use client"

import { useState, useEffect, useCallback } from "react"
import { useTonWallet } from "@tonconnect/ui-react"
import { apiClient } from "@/lib/api"
import { telegramWebApp } from "@/lib/telegram"

interface UseWalletReturn {
  isConnected: boolean
  address: string | null
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  sendNotification: (message: string, type?: "success" | "error" | "warning") => void
}

export function useWallet(userId?: number): UseWalletReturn {
  const wallet = useTonWallet()
  const [isConnecting, setIsConnecting] = useState(false)

  const sendNotification = useCallback((message: string, type: "success" | "error" | "warning" = "success") => {
    telegramWebApp.showAlert(message)
    telegramWebApp.hapticFeedback(type)
  }, [])

  const connectWallet = useCallback(async () => {
    if (!userId) return

    try {
      setIsConnecting(true)

      if (wallet) {
        // Wallet already connected, just sync with backend
        const response = await apiClient.connectWallet(userId, wallet.account.address)

        if (response.success) {
          sendNotification("Кошелёк успешно подключен!")
        } else {
          throw new Error(response.error || "Ошибка подключения кошелька")
        }
      }
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      sendNotification("Ошибка при подключении кошелька", "error")
    } finally {
      setIsConnecting(false)
    }
  }, [wallet, userId, sendNotification])

  const disconnectWallet = useCallback(async () => {
    try {
      // The actual disconnection is handled by TonConnect UI
      sendNotification("Кошелёк отключен")
    } catch (error) {
      console.error("[v0] Wallet disconnection error:", error)
      sendNotification("Ошибка при отключении кошелька", "error")
    }
  }, [sendNotification])

  // Auto-connect wallet to backend when wallet connects
  useEffect(() => {
    if (wallet && userId) {
      connectWallet()
    }
  }, [wallet, userId, connectWallet])

  return {
    isConnected: !!wallet,
    address: wallet?.account.address || null,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendNotification,
  }
}
