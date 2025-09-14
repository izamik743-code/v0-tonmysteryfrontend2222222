export interface TelegramGift {
  id: string
  name: string
  image: string
  price_ton: number
  rarity: "common" | "rare" | "epic" | "legendary"
  description: string
}

export interface CaseReward extends TelegramGift {
  probability: number
}

export interface UpgradeContract {
  id: string
  user_id: string
  input_gifts: TelegramGift[]
  target_gift: TelegramGift
  success_chance: number
  status: "pending" | "success" | "failed"
  created_at: string
}

export interface OnlineStats {
  online_users: number
  recent_wins: RecentWin[]
}

export interface RecentWin {
  id: string
  username: string
  gift: TelegramGift
  timestamp: string
  case_name?: string
  upgrade?: boolean
}
