import type { UserState, BackendResponse, Transaction, InventoryItem } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ton-mini-app-backend.onrender.com/api"

class APIClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<BackendResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] API request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async initializeUser(userData: {
    tg_id: number
    username?: string
    first_name: string
    last_name?: string
    init_data: string
    referral_code?: string
  }): Promise<BackendResponse<UserState>> {
    return this.request<UserState>("/user/init", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async connectWallet(tg_id: number, walletAddress: string): Promise<BackendResponse> {
    return this.request("/user/connect-wallet", {
      method: "POST",
      body: JSON.stringify({ tg_id, wallet_address: walletAddress }),
    })
  }

  async openCase(
    tg_id: number,
    caseType: string,
  ): Promise<
    BackendResponse<{
      reward: InventoryItem
      newBalance: number
    }>
  > {
    return this.request("/cases/open", {
      method: "POST",
      body: JSON.stringify({ tg_id, case_type: caseType }),
    })
  }

  async getUserBalance(tg_id: number): Promise<BackendResponse<{ balance: number }>> {
    return this.request(`/user/${tg_id}/balance`)
  }

  async getUserInventory(tg_id: number): Promise<BackendResponse<{ inventory: InventoryItem[] }>> {
    return this.request(`/user/${tg_id}/inventory`)
  }

  async getTransactionHistory(tg_id: number): Promise<BackendResponse<{ transactions: Transaction[] }>> {
    return this.request(`/user/${tg_id}/transactions`)
  }

  async withdrawFunds(
    tg_id: number,
    amount: number,
    walletAddress: string,
  ): Promise<
    BackendResponse<{
      transaction_id: string
    }>
  > {
    return this.request("/user/withdraw", {
      method: "POST",
      body: JSON.stringify({ tg_id, amount, wallet_address: walletAddress }),
    })
  }

  async getReferralStats(tg_id: number): Promise<
    BackendResponse<{
      referrals_count: number
      total_earned: number
      referral_code: string
    }>
  > {
    return this.request(`/user/${tg_id}/referrals`)
  }

  async initiateTransfer(walletAddress: string, amount: number): Promise<BackendResponse<{ transactionId: string }>> {
    return this.request("/initiate-transfer", {
      method: "POST",
      body: JSON.stringify({ walletAddress, amount }),
    })
  }

  async verifyTransaction(transactionId: string): Promise<BackendResponse<{ verified: boolean }>> {
    return this.request("/verify-transaction", {
      method: "POST",
      body: JSON.stringify({ transactionId }),
    })
  }
}

export const apiClient = new APIClient()
