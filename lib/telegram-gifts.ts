import { createClient } from "@/lib/supabase/client"
import type { TelegramGift, CaseReward, OnlineStats, RecentWin } from "@/types/telegram-gifts"

export class TelegramGiftsService {
  private supabase = createClient()

  async getAllGifts(): Promise<TelegramGift[]> {
    const { data, error } = await this.supabase
      .from("telegram_gifts")
      .select("*")
      .order("price_ton", { ascending: true })

    if (error) throw error
    return data || []
  }

  async getGiftsByRarity(rarity: string): Promise<TelegramGift[]> {
    const { data, error } = await this.supabase
      .from("telegram_gifts")
      .select("*")
      .eq("rarity", rarity)
      .order("price_ton", { ascending: true })

    if (error) throw error
    return data || []
  }

  async getCases() {
    const { data, error } = await this.supabase
      .from("cases")
      .select(`
        *,
        case_rewards (
          probability,
          telegram_gifts (*)
        )
      `)
      .eq("is_active", true)
      .order("price_ton", { ascending: true })

    if (error) throw error
    return data || []
  }

  async getCaseRewards(caseId: string): Promise<CaseReward[]> {
    const { data, error } = await this.supabase
      .from("case_rewards")
      .select(`
        probability,
        telegram_gifts (*)
      `)
      .eq("case_id", caseId)

    if (error) throw error

    return (
      data?.map((item) => ({
        ...item.telegram_gifts,
        probability: item.probability,
      })) || []
    )
  }

  async openCase(caseId: string, userId: string): Promise<TelegramGift> {
    // Get case rewards with probabilities
    const rewards = await this.getCaseRewards(caseId)

    if (!rewards.length) {
      throw new Error("No rewards found for this case")
    }

    // Weighted random selection
    const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0)
    let random = Math.random() * totalProbability
    let selectedReward = rewards[0]

    for (const reward of rewards) {
      random -= reward.probability
      if (random <= 0) {
        selectedReward = reward
        break
      }
    }

    // Record the case opening
    const { data: caseData } = await this.supabase.from("cases").select("price_ton").eq("id", caseId).single()

    await this.supabase.from("case_openings").insert({
      user_id: userId,
      case_id: caseId,
      gift_won_id: selectedReward.id,
      ton_spent: caseData?.price_ton || 0,
    })

    // Add to user inventory
    await this.addToInventory(userId, selectedReward.id, 1)

    return selectedReward
  }

  async addToInventory(userId: string, giftId: string, quantity = 1) {
    // Try to update existing inventory item
    const { data: existing } = await this.supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId)
      .eq("gift_id", giftId)
      .single()

    if (existing) {
      // Update quantity
      await this.supabase
        .from("user_inventory")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
    } else {
      // Insert new inventory item
      await this.supabase.from("user_inventory").insert({
        user_id: userId,
        gift_id: giftId,
        quantity,
      })
    }
  }

  async getUserInventory(userId: string) {
    const { data, error } = await this.supabase
      .from("user_inventory")
      .select(`
        *,
        telegram_gifts (*)
      `)
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getOnlineStats(): Promise<OnlineStats> {
    // Get fake online count
    const { data: statsData } = await this.supabase.from("online_stats").select("online_count").single()

    // Get recent wins
    const { data: winsData } = await this.supabase
      .from("recent_wins")
      .select(`
        *,
        telegram_gifts (*)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    const recentWins: RecentWin[] =
      winsData?.map((win) => ({
        id: win.id,
        username: win.fake_username,
        gift: win.telegram_gifts,
        timestamp: win.created_at,
        case_name: win.case_name,
        upgrade: win.is_upgrade,
      })) || []

    return {
      online_users: statsData?.online_count || 127,
      recent_wins: recentWins,
    }
  }

  // Update online count periodically (fake fluctuation)
  async updateOnlineCount() {
    const baseCount = 127
    const variation = Math.floor(Math.random() * 40) - 20 // ±20 users
    const newCount = Math.max(100, Math.min(150, baseCount + variation))

    await this.supabase.from("online_stats").update({ online_count: newCount }).eq("id", 1)
  }

  // Add fake recent win
  async addFakeWin() {
    const usernames = [
      "CryptoKing",
      "DiamondHands",
      "MoonWalker",
      "StarCollector",
      "GiftHunter",
      "LuckyPlayer",
      "CrystalMaster",
      "DragonSlayer",
      "PhoenixRider",
      "UnicornLord",
    ]

    const caseNames = ["Starter Case", "Premium Case", "Elite Case", "Legendary Case"]

    // Get random gift
    const { data: gifts } = await this.supabase.from("telegram_gifts").select("id").order("RANDOM()").limit(1)

    if (gifts?.[0]) {
      await this.supabase.from("recent_wins").insert({
        fake_username: usernames[Math.floor(Math.random() * usernames.length)],
        gift_id: gifts[0].id,
        case_name: caseNames[Math.floor(Math.random() * caseNames.length)],
        is_upgrade: Math.random() < 0.3,
      })

      // Keep only last 20 wins
      const { data: oldWins } = await this.supabase
        .from("recent_wins")
        .select("id")
        .order("created_at", { ascending: false })
        .range(20, 100)

      if (oldWins?.length) {
        await this.supabase
          .from("recent_wins")
          .delete()
          .in(
            "id",
            oldWins.map((w) => w.id),
          )
      }
    }
  }
}

// Create RPC function for atomic balance updates
export const createBalanceUpdateFunction = `
CREATE OR REPLACE FUNCTION update_user_balance(user_id UUID, amount_change DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET ton_balance = ton_balance + amount_change,
      updated_at = NOW()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.users (id, ton_balance) 
    VALUES (user_id, GREATEST(0, amount_change));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`
