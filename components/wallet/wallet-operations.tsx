"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react"
import { telegramWebApp } from "@/lib/telegram"
import { apiClient } from "@/lib/api"
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react"

interface WalletOperationsProps {
  userId: number
  balance: number
  onBalanceUpdate: (newBalance: number) => void
}

export function WalletOperations({ userId, balance, onBalanceUpdate }: WalletOperationsProps) {
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)

  const handleWithdraw = async () => {
    if (!wallet || !withdrawAmount) return

    const amount = Number.parseFloat(withdrawAmount)
    if (amount <= 0 || amount > balance) {
      telegramWebApp.showAlert("Некорректная сумма для вывода")
      return
    }

    try {
      setIsWithdrawing(true)
      telegramWebApp.hapticFeedback("light")

      const response = await apiClient.withdrawFunds(userId, amount, wallet.account.address)

      if (response.success) {
        onBalanceUpdate(balance - amount)
        setWithdrawAmount("")
        telegramWebApp.hapticFeedback("success")
        telegramWebApp.showAlert(`Заявка на вывод ${amount} TON создана!`)
      } else {
        throw new Error(response.error || "Ошибка вывода средств")
      }
    } catch (error) {
      console.error("[v0] Withdrawal error:", error)
      telegramWebApp.hapticFeedback("error")
      telegramWebApp.showAlert("Ошибка при выводе средств")
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleDeposit = async () => {
    if (!wallet || !depositAmount) return

    const amount = Number.parseFloat(depositAmount)
    if (amount <= 0) {
      telegramWebApp.showAlert("Некорректная сумма для пополнения")
      return
    }

    try {
      setIsDepositing(true)
      telegramWebApp.hapticFeedback("light")

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: "UQAjU_dKuBVzeAQOfqNZ5kqUGsuPBXY9bjW1Cs4ZT_eTANGy", // Main contract address
            amount: (amount * 1e9).toString(), // Convert to nanotons
            payload: btoa(`deposit_${userId}`), // Include user ID in comment
          },
        ],
      }

      const result = await tonConnectUI.sendTransaction(transaction)

      if (result) {
        setDepositAmount("")
        telegramWebApp.hapticFeedback("success")
        telegramWebApp.showAlert(`Транзакция отправлена! Баланс обновится после подтверждения в сети.`)
      }
    } catch (error) {
      console.error("[v0] Deposit error:", error)
      telegramWebApp.hapticFeedback("error")
      telegramWebApp.showAlert("Ошибка при отправке транзакции")
    } finally {
      setIsDepositing(false)
    }
  }

  if (!wallet) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-center">Кошелёк не подключен</CardTitle>
          <CardDescription className="text-center">
            Подключите TON кошелёк для пополнения и вывода средств
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Deposit Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-green-400" />
            Пополнить баланс
          </CardTitle>
          <CardDescription>Отправьте TON на свой игровой баланс</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Сумма в TON"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min="0.1"
            step="0.1"
          />
          <Button
            onClick={handleDeposit}
            disabled={isDepositing || !depositAmount}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isDepositing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Пополнить {depositAmount && `${depositAmount} TON`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-400" />
            Вывести средства
          </CardTitle>
          <CardDescription>Доступно для вывода: {balance.toFixed(2)} TON</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Сумма в TON"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            min="0.1"
            max={balance}
            step="0.1"
          />
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing || !withdrawAmount || Number.parseFloat(withdrawAmount) > balance}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Вывести {withdrawAmount && `${withdrawAmount} TON`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
