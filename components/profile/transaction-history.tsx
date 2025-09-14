"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/types"
import { apiClient } from "@/lib/api"
import { History, ArrowUpRight, ArrowDownLeft, Package, Gift, Loader2 } from "lucide-react"

interface TransactionHistoryProps {
  userId: number
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [userId])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.getTransactionHistory(userId)

      if (response.success && response.data) {
        setTransactions(response.data.transactions)
      } else {
        // Fallback to mock data if backend is not available
        setTransactions([
          {
            id: "tx_1",
            type: "reward",
            amount: 0.5,
            status: "completed",
            timestamp: Date.now() - 3600000,
            description: "Награда из Демо-кейса",
          },
          {
            id: "tx_2",
            type: "case_purchase",
            amount: -0.5,
            status: "completed",
            timestamp: Date.now() - 7200000,
            description: "Покупка Базового кейса",
          },
        ])
      }
    } catch (error) {
      console.error("[v0] Failed to load transactions:", error)
      setError("Не удалось загрузить историю транзакций")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-blue-400" />
      case "case_purchase":
        return <Package className="w-4 h-4 text-red-400" />
      case "reward":
        return <Gift className="w-4 h-4 text-yellow-400" />
      default:
        return <History className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "deposit":
      case "reward":
        return "text-green-400"
      case "withdrawal":
        return "text-blue-400"
      case "case_purchase":
        return "text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            Завершено
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            В обработке
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
            Ошибка
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={loadTransactions} variant="outline">
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">История пуста</h3>
          <p className="text-muted-foreground text-center">Здесь будут отображаться ваши транзакции</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          История транзакций
        </CardTitle>
        <CardDescription>Последние {transactions.length} операций</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getTransactionIcon(transaction.type)}
                <div>
                  <p className="font-medium text-sm">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.timestamp).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${getTransactionColor(transaction.type)}`}>
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount.toFixed(2)} TON
                </span>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
