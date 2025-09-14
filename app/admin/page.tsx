"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, EyeOff, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api"

interface AdminUser {
  id: number
  tg_id: number
  username: string
  first_name: string
  last_name: string
  balance: number
  wallet_address?: string
  created_at: string
  last_active: string
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    connectedWallets: 0,
    activeToday: 0,
  })

  const handleLogin = async () => {
    if (password === "admin123") {
      // В продакшене использовать более безопасный способ
      setIsAuthenticated(true)
      await loadUsers()
    } else {
      alert("Неверный пароль")
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getAdminUsers()
      if (response.success && response.data) {
        setUsers(response.data.users)
        setStats(response.data.stats)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawBalance = async (userId: number, tgId: number) => {
    if (!confirm("Вы уверены, что хотите списать весь баланс этого пользователя?")) {
      return
    }

    try {
      const response = await apiClient.withdrawUserBalance(userId, tgId)
      if (response.success) {
        alert("Баланс успешно списан")
        await loadUsers() // Обновить данные
      } else {
        alert("Ошибка при списании баланса: " + response.error)
      }
    } catch (error) {
      console.error("Error withdrawing balance:", error)
      alert("Ошибка при списании баланса")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-white">Админ Панель</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white pr-10"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700">
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Админ Панель TON Mystery</h1>
          <Button onClick={loadUsers} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
              <p className="text-gray-400">Всего пользователей</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-400">{stats.totalBalance.toFixed(2)} TON</div>
              <p className="text-gray-400">Общий баланс</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-400">{stats.connectedWallets}</div>
              <p className="text-gray-400">Подключенных кошельков</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-400">{stats.activeToday}</div>
              <p className="text-gray-400">Активных сегодня</p>
            </CardContent>
          </Card>
        </div>

        {/* Таблица пользователей */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">ID</TableHead>
                    <TableHead className="text-gray-300">Telegram ID</TableHead>
                    <TableHead className="text-gray-300">Username</TableHead>
                    <TableHead className="text-gray-300">Имя</TableHead>
                    <TableHead className="text-gray-300">Баланс</TableHead>
                    <TableHead className="text-gray-300">Кошелек</TableHead>
                    <TableHead className="text-gray-300">Регистрация</TableHead>
                    <TableHead className="text-gray-300">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-gray-700">
                      <TableCell className="text-white">{user.id}</TableCell>
                      <TableCell className="text-white">{user.tg_id}</TableCell>
                      <TableCell className="text-blue-400">@{user.username || "—"}</TableCell>
                      <TableCell className="text-white">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.balance > 0 ? "default" : "secondary"} className="bg-green-600">
                          {user.balance.toFixed(2)} TON
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {user.wallet_address ? (
                          <span className="font-mono text-xs">
                            {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(user.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleWithdrawBalance(user.id, user.tg_id)}
                          disabled={user.balance <= 0}
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Списать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
