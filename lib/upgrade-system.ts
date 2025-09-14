import { createClient } from "@/lib/supabase/client"
import type { TelegramGift, UpgradeContract } from "@/types/telegram-gifts"

export class UpgradeSystemService {
  private supabase = createClient()

  async getUserInventory(userId: string) {
    const { data, error } = await this.supabase
      .from("user_inventory")
      .select(`
        *,
        telegram_gifts (*)
      `)
      .eq("user_id", userId)
      .gt("quantity", 0)
      .order("telegram_gifts(price_ton)", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUpgradeTargets(inputValue: number): Promise<TelegramGift[]> {
    // Get gifts that are 10-50% more valuable than input
    const minValue = inputValue * 1.1
    const maxValue = inputValue * 1.5

    const { data, error } = await this.supabase
      .from("telegram_gifts")
      .select("*")
      .gte("price_ton", minValue)
      .lte("price_ton", maxValue)
      .order("price_ton", { ascending: true })

    if (error) throw error
    return data || []
  }

  calculateSuccessChance(inputValue: number, targetValue: number): number {
    // CS:GO style calculation: higher value difference = lower chance
    const ratio = inputValue / targetValue
    const baseChance = Math.min(0.9, Math.max(0.1, ratio))

    // Add some randomness and round to nearest 5%
    const finalChance = Math.round(baseChance * 20) / 20
    return Math.max(0.05, Math.min(0.95, finalChance))
  }

  async createUpgradeContract(
    userId: string,
    inputGifts: Array<{ id: string; quantity: number }>,
    targetGiftId: string,
  ): Promise<UpgradeContract> {
    // Calculate total input value
    const { data: inputGiftsData } = await this.supabase
      .from("telegram_gifts")
      .select("*")
      .in(
        "id",
        inputGifts.map((g) => g.id),
      )

    const totalInputValue = inputGifts.reduce((sum, input) => {
      const gift = inputGiftsData?.find((g) => g.id === input.id)
      return sum + (gift?.price_ton || 0) * input.quantity
    }, 0)

    // Get target gift
    const { data: targetGift } = await this.supabase.from("telegram_gifts").select("*").eq("id", targetGiftId).single()

    if (!targetGift) throw new Error("Target gift not found")

    const successChance = this.calculateSuccessChance(totalInputValue, targetGift.price_ton)

    // Create contract
    const { data, error } = await this.supabase
      .from("upgrade_contracts")
      .insert({
        user_id: userId,
        input_gifts: inputGifts,
        target_gift_id: targetGiftId,
        success_chance: successChance,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async executeUpgrade(contractId: string): Promise<{ success: boolean; resultGift?: TelegramGift }> {
    const { data: contract } = await this.supabase
      .from("upgrade_contracts")
      .select(`
        *,
        telegram_gifts!upgrade_contracts_target_gift_id_fkey (*)
      `)
      .eq("id", contractId)
      .single()

    if (!contract || contract.status !== "pending") {
      throw new Error("Invalid contract")
    }

    // Determine success
    const success = Math.random() < contract.success_chance

    let resultGift: TelegramGift | undefined

    if (success) {
      resultGift = contract.telegram_gifts
      // Add winning gift to inventory
      await this.addToInventory(contract.user_id, contract.target_gift_id, 1)
    } else {
      // On failure, give back a random lower-value gift (10-30% of input value)
      const inputValue = this.calculateInputValue(contract.input_gifts)
      const consolationValue = inputValue * (0.1 + Math.random() * 0.2)

      const { data: consolationGifts } = await this.supabase
        .from("telegram_gifts")
        .select("*")
        .lte("price_ton", consolationValue)
        .order("price_ton", { ascending: false })
        .limit(5)

      if (consolationGifts?.length) {
        resultGift = consolationGifts[Math.floor(Math.random() * consolationGifts.length)]
        await this.addToInventory(contract.user_id, resultGift.id, 1)
      }
    }

    // Remove input gifts from inventory
    for (const input of contract.input_gifts as Array<{ id: string; quantity: number }>) {
      await this.removeFromInventory(contract.user_id, input.id, input.quantity)
    }

    // Update contract
    await this.supabase
      .from("upgrade_contracts")
      .update({
        status: success ? "success" : "failed",
        result_gift_id: resultGift?.id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    return { success, resultGift }
  }

  private calculateInputValue(inputGifts: Array<{ id: string; quantity: number }>): number {
    // This would need to be calculated with actual gift data
    // For now, return a placeholder
    return 1.0
  }

  private async addToInventory(userId: string, giftId: string, quantity: number) {
    const { data: existing } = await this.supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId)
      .eq("gift_id", giftId)
      .single()

    if (existing) {
      await this.supabase
        .from("user_inventory")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
    } else {
      await this.supabase.from("user_inventory").insert({
        user_id: userId,
        gift_id: giftId,
        quantity,
      })
    }
  }

  private async removeFromInventory(userId: string, giftId: string, quantity: number) {
    const { data: existing } = await this.supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId)
      .eq("gift_id", giftId)
      .single()

    if (existing) {
      const newQuantity = existing.quantity - quantity
      if (newQuantity <= 0) {
        await this.supabase.from("user_inventory").delete().eq("id", existing.id)
      } else {
        await this.supabase.from("user_inventory").update({ quantity: newQuantity }).eq("id", existing.id)
      }
    }
  }
}
