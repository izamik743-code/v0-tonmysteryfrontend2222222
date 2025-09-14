"use client"

import { useState, useEffect } from "react"

export function OnlineStats() {
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    const generateOnlineCount = () => {
      return Math.floor(Math.random() * 51) + 100 // 100-150
    }

    setOnlineCount(generateOnlineCount())

    const interval = setInterval(
      () => {
        setOnlineCount(generateOnlineCount())
      },
      Math.random() * 15000 + 15000,
    ) // 15-30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 text-sm font-medium">{onlineCount} онлайн</span>
      </div>
    </div>
  )
}
