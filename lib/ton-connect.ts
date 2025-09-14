import { TonConnect, TonConnectUI } from "@tonconnect/ui-react"
import { beginCell, toNano } from "@ton/core"

export interface TonTransaction {
  validUntil: number
  messages: Array<{
    address: string
    amount: string
    payload?: string
  }>
}

export class TonConnectService {
  private tonConnect: TonConnect | null = null
  private tonConnectUI: TonConnectUI | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeTonConnect()
    }
  }

  private async initializeTonConnect() {
    try {
      const manifestUrl = "https://ton-mini-app-backend.onrender.com/tonconnect-manifest.json"

      // Initialize TonConnect with proper manifest URL
      this.tonConnect = new TonConnect({
        manifestUrl,
      })

      // Initialize TonConnectUI for better UX
      this.tonConnectUI = new TonConnectUI({
        manifestUrl,
        buttonRootId: "ton-connect-button",
      })

      // Listen for connection status changes
      this.tonConnect.onStatusChange((wallet) => {
        console.log("[v0] Wallet connection status changed:", wallet)
        if (wallet) {
          console.log("[v0] Connected to wallet:", wallet.account.address)
        }
      })
    } catch (error) {
      console.error("[v0] Failed to initialize TonConnect:", error)
    }
  }

  async connectWallet(): Promise<boolean> {
    if (!this.tonConnectUI) {
      throw new Error("TonConnect not initialized")
    }

    try {
      console.log("[v0] Initiating wallet connection...")

      // Open wallet connection modal
      await this.tonConnectUI.openModal()

      // Wait for connection to be established
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"))
        }, 60000) // 60 second timeout

        const unsubscribe = this.tonConnectUI!.onStatusChange((wallet) => {
          console.log("[v0] Connection status update:", wallet)

          if (wallet) {
            clearTimeout(timeout)
            unsubscribe()
            console.log("[v0] Wallet connected successfully:", wallet.account.address)

            this.retryOnNetworkError(() => {
              console.log("[v0] Network connection stable")
            })

            resolve(true)
          }
        })
      })
    } catch (error) {
      console.error("[v0] Wallet connection failed:", error)
      throw error
    }
  }

  async disconnectWallet(): Promise<void> {
    if (!this.tonConnect) {
      throw new Error("TonConnect not initialized")
    }

    try {
      await this.tonConnect.disconnect()
      console.log("[v0] Wallet disconnected")
    } catch (error) {
      console.error("[v0] Failed to disconnect wallet:", error)
      throw error
    }
  }

  getWalletInfo() {
    if (!this.tonConnect?.wallet) {
      return null
    }

    return {
      address: this.tonConnect.wallet.account.address,
      chain: this.tonConnect.wallet.account.chain,
      publicKey: this.tonConnect.wallet.account.publicKey,
    }
  }

  isConnected(): boolean {
    return !!this.tonConnect?.wallet
  }

  async sendTransaction(transaction: TonTransaction): Promise<string> {
    if (!this.tonConnect?.wallet) {
      throw new Error("Wallet not connected")
    }

    try {
      console.log("[v0] Sending transaction:", transaction)

      const result = await this.tonConnect.sendTransaction(transaction)
      console.log("[v0] Transaction sent successfully:", result)

      return result.boc
    } catch (error) {
      console.error("[v0] Transaction failed:", error)
      throw error
    }
  }

  async createCaseOpeningTransaction(casePrice: number, caseId: string): Promise<TonTransaction> {
    const amount = toNano(casePrice.toString()).toString()

    // Contract address for case opening (replace with your actual contract)
    const contractAddress = "UQAjU_dKuBVzeAQOfqNZ5kqUGsuPBXY9bjW1Cs4ZT_eTANGy"

    // Create payload for case opening with case ID
    const payload = beginCell()
      .storeUint(0x12345678, 32) // op code for case opening
      .storeUint(Number.parseInt(caseId), 32) // case ID
      .storeUint(Math.floor(Date.now() / 1000), 64) // timestamp
      .endCell()

    return {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      messages: [
        {
          address: contractAddress,
          amount: amount,
          payload: payload.toBoc().toString("base64"),
        },
      ],
    }
  }

  async createUpgradeTransaction(
    inputValue: number,
    targetValue: number,
    upgradeChance: number,
  ): Promise<TonTransaction> {
    const amount = toNano(inputValue.toString()).toString()

    // Contract address for upgrades (replace with your actual contract)
    const contractAddress = "UQAjU_dKuBVzeAQOfqNZ5kqUGsuPBXY9bjW1Cs4ZT_eTANGy"

    // Create payload for upgrade contract
    const payload = beginCell()
      .storeUint(0x87654321, 32) // op code for upgrade
      .storeCoins(toNano(targetValue.toString())) // target value
      .storeUint(Math.floor(upgradeChance * 100), 16) // chance percentage (0-10000)
      .storeUint(Math.floor(Date.now() / 1000), 64) // timestamp
      .endCell()

    return {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      messages: [
        {
          address: contractAddress,
          amount: amount,
          payload: payload.toBoc().toString("base64"),
        },
      ],
    }
  }

  async createGiftPurchaseTransaction(
    giftPrice: number,
    recipientAddress: string,
    giftType: string,
  ): Promise<TonTransaction> {
    const amount = toNano(giftPrice.toString()).toString()

    // Contract address for gifts (replace with your actual contract)
    const contractAddress = "UQAjU_dKuBVzeAQOfqNZ5kqUGsuPBXY9bjW1Cs4ZT_eTANGy"

    // Create payload for gift purchase
    const payload = beginCell()
      .storeUint(0x11111111, 32) // op code for gift purchase
      .storeAddress(recipientAddress) // recipient address
      .storeStringTail(giftType) // gift type
      .storeUint(Math.floor(Date.now() / 1000), 64) // timestamp
      .endCell()

    return {
      validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      messages: [
        {
          address: contractAddress,
          amount: amount,
          payload: payload.toBoc().toString("base64"),
        },
      ],
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(boc: string): Promise<boolean> {
    try {
      console.log("[v0] Verifying transaction:", boc)

      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In production, you would verify against TON blockchain
      // For now, return true for demo purposes
      return true
    } catch (error) {
      console.error("[v0] Transaction verification failed:", error)
      return false
    }
  }

  private async retryOnNetworkError(callback: () => void, maxRetries = 3): Promise<void> {
    let attempts = 0

    while (attempts < maxRetries) {
      try {
        callback()
        break
      } catch (error) {
        attempts++
        console.log(`[v0] Network retry attempt ${attempts}/${maxRetries}`)

        if (attempts === maxRetries) {
          throw error
        }

        // Экспоненциальная задержка
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000))
      }
    }
  }
}

// Singleton instance
let tonConnectService: TonConnectService | null = null

export function getTonConnectService(): TonConnectService {
  if (!tonConnectService) {
    tonConnectService = new TonConnectService()
  }
  return tonConnectService
}
