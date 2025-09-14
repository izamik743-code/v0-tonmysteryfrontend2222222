import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  blur?: boolean
}

export function GlassCard({ children, className, blur = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10",
        blur && "backdrop-blur-xl bg-white/5",
        !blur && "bg-gray-900/80",
        className,
      )}
    >
      {children}
    </div>
  )
}
