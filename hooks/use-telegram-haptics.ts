"use client"

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void
          notificationOccurred: (type: "error" | "success" | "warning") => void
          selectionChanged: () => void
        }
      }
    }
  }
}

export function useTelegramHaptics() {
  const triggerImpact = (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style)
    }
  }

  const triggerNotification = (type: "error" | "success" | "warning") => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(type)
    }
  }

  const triggerSelection = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.selectionChanged()
    }
  }

  return {
    triggerImpact,
    triggerNotification,
    triggerSelection,
  }
}
