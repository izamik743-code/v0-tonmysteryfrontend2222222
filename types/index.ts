export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface UserState {
  tg_user: TelegramUser | null
  balance: number
  inventory: InventoryItem[]
  walletConnected: boolean
  walletAddress?: string
  firstTime: boolean
  referralCode?: string
  totalEarned: number
  casesOpened: number
}

export interface InventoryItem {
  id: string
  name: string
  value: number
  rarity: "common" | "rare" | "epic" | "legendary"
  timestamp: number
}

export interface CaseReward {
  name: string
  value: number
  weight: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface CaseType {
  id: string
  name: string
  price: number
  emoji: string
  rewards: CaseReward[]
  description: string
}

export interface BackendResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface WalletConnection {
  address: string
  publicKey: string
  network: "mainnet" | "testnet"
}

export interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "case_purchase" | "reward"
  amount: number
  status: "pending" | "completed" | "failed"
  timestamp: number
  description: string
}
