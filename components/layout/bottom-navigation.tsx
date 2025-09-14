"use client"

import { Package, TrendingUp, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: "cases" | "upgrade" | "profile"
  onTabChange: (tab: "cases" | "upgrade" | "profile") => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "cases" as const, label: "Cases", icon: Package },
    { id: "upgrade" as const, label: "Upgrade", icon: TrendingUp },
    { id: "profile" as const, label: "Profile", icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200",
                isActive ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
