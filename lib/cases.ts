import type { CaseType, CaseReward, InventoryItem } from "@/types"

export const CASE_TYPES: CaseType[] = [
  {
    id: "demo",
    name: "Демо-кейс",
    price: 0,
    emoji: "🎁",
    description: "Бесплатный кейс для новых игроков",
    rewards: [
      { name: "0.1 TON", value: 0.1, weight: 50, rarity: "common" },
      { name: "0.2 TON", value: 0.2, weight: 30, rarity: "common" },
      { name: "0.5 TON", value: 0.5, weight: 15, rarity: "rare" },
      { name: "1.0 TON", value: 1.0, weight: 5, rarity: "epic" },
    ],
  },
  {
    id: "basic",
    name: "Базовый кейс",
    price: 0.5,
    emoji: "📦",
    description: "Стандартный кейс с хорошими наградами",
    rewards: [
      { name: "0.3 TON", value: 0.3, weight: 40, rarity: "common" },
      { name: "0.7 TON", value: 0.7, weight: 30, rarity: "common" },
      { name: "1.2 TON", value: 1.2, weight: 20, rarity: "rare" },
      { name: "2.5 TON", value: 2.5, weight: 8, rarity: "epic" },
      { name: "5.0 TON", value: 5.0, weight: 2, rarity: "legendary" },
    ],
  },
  {
    id: "premium",
    name: "Премиум кейс",
    price: 1.0,
    emoji: "💎",
    description: "Премиальный кейс с крупными выигрышами",
    rewards: [
      { name: "0.8 TON", value: 0.8, weight: 35, rarity: "common" },
      { name: "1.5 TON", value: 1.5, weight: 25, rarity: "rare" },
      { name: "3.0 TON", value: 3.0, weight: 20, rarity: "rare" },
      { name: "6.0 TON", value: 6.0, weight: 15, rarity: "epic" },
      { name: "12.0 TON", value: 12.0, weight: 5, rarity: "legendary" },
    ],
  },
  {
    id: "luxury",
    name: "Люкс кейс",
    price: 2.0,
    emoji: "🔥",
    description: "Эксклюзивный кейс с максимальными наградами",
    rewards: [
      { name: "1.5 TON", value: 1.5, weight: 30, rarity: "common" },
      { name: "3.0 TON", value: 3.0, weight: 25, rarity: "rare" },
      { name: "6.0 TON", value: 6.0, weight: 20, rarity: "rare" },
      { name: "12.0 TON", value: 12.0, weight: 15, rarity: "epic" },
      { name: "25.0 TON", value: 25.0, weight: 8, rarity: "legendary" },
      { name: "50.0 TON", value: 50.0, weight: 2, rarity: "legendary" },
    ],
  },
]

export function getCaseById(caseId: string): CaseType | undefined {
  return CASE_TYPES.find((caseType) => caseType.id === caseId)
}

export function getRandomReward(caseType: CaseType): CaseReward {
  const totalWeight = caseType.rewards.reduce((sum, reward) => sum + reward.weight, 0)
  const random = Math.random() * totalWeight

  let weightSum = 0
  for (const reward of caseType.rewards) {
    weightSum += reward.weight
    if (random <= weightSum) {
      return reward
    }
  }

  // Fallback to first reward
  return caseType.rewards[0]
}

export function createInventoryItem(reward: CaseReward): InventoryItem {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: reward.name,
    value: reward.value,
    rarity: reward.rarity,
    timestamp: Date.now(),
  }
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "common":
      return "text-gray-400 border-gray-400/30 bg-gray-400/10"
    case "rare":
      return "text-blue-400 border-blue-400/30 bg-blue-400/10"
    case "epic":
      return "text-purple-400 border-purple-400/30 bg-purple-400/10"
    case "legendary":
      return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
    default:
      return "text-gray-400 border-gray-400/30 bg-gray-400/10"
  }
}

export function getRarityName(rarity: string): string {
  switch (rarity) {
    case "common":
      return "Обычный"
    case "rare":
      return "Редкий"
    case "epic":
      return "Эпический"
    case "legendary":
      return "Легендарный"
    default:
      return "Неизвестный"
  }
}
