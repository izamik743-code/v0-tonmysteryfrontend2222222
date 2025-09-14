"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { InventoryItem } from "@/types"
import { getRarityColor, getRarityName } from "@/lib/cases"
import { Package, Search, Filter, Coins } from "lucide-react"

interface InventoryGridProps {
  inventory: InventoryItem[]
  onSellItem?: (itemId: string) => void
}

export function InventoryGrid({ inventory, onSellItem }: InventoryGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [rarityFilter, setRarityFilter] = useState<string>("all")

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = rarityFilter === "all" || item.rarity === rarityFilter
    return matchesSearch && matchesRarity
  })

  const totalValue = inventory.reduce((sum, item) => sum + item.value, 0)
  const rarityStats = inventory.reduce(
    (stats, item) => {
      stats[item.rarity] = (stats[item.rarity] || 0) + 1
      return stats
    },
    {} as Record<string, number>,
  )

  if (inventory.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Инвентарь пуст</h3>
          <p className="text-muted-foreground text-center">Откройте кейсы, чтобы получить первые предметы</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Inventory Stats */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Инвентарь ({inventory.length} предметов)
          </CardTitle>
          <CardDescription>Общая стоимость: {totalValue.toFixed(2)} TON</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(rarityStats).map(([rarity, count]) => (
              <Badge key={rarity} variant="outline" className={`${getRarityColor(rarity)} text-xs`}>
                {getRarityName(rarity)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск предметов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                <option value="all">Все редкости</option>
                <option value="common">Обычные</option>
                <option value="rare">Редкие</option>
                <option value="epic">Эпические</option>
                <option value="legendary">Легендарные</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map((item) => (
          <Card
            key={item.id}
            className={`bg-card/50 backdrop-blur-sm border-2 ${getRarityColor(item.rarity)} hover:scale-105 transition-transform duration-200`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{item.name}</span>
                <Coins className="w-4 h-4 text-yellow-400" />
              </CardTitle>
              <CardDescription>{getRarityName(item.rarity)} предмет</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{item.value.toFixed(2)} TON</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString("ru-RU")}
                </div>
              </div>

              {onSellItem && (
                <Button onClick={() => onSellItem(item.id)} variant="outline" size="sm" className="w-full">
                  Продать
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && inventory.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground text-center">Попробуйте изменить параметры поиска</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
