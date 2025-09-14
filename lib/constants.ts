export const APP_CONFIG = {
  name: "TON Mystery Cases",
  description: "Открывайте кейсы и выигрывайте TON криптовалюту",
  version: "1.0.0",
  telegram: {
    botUsername: "your_bot", // Replace with your bot username
  },
  ton: {
    network: "mainnet" as const, // or "testnet" for development
    depositAddress: "UQAjU_dKuBVzeAQOfqNZ5kqUGsuPBXY9bjW1Cs4ZT_eTANGy", // Replace with your deposit address
  },
  referral: {
    commission: 0.1, // 10% commission
    welcomeBonus: 0.2, // 0.2 TON welcome bonus
  },
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
  },
} as const

export const RARITY_COLORS = {
  common: {
    text: "text-gray-400",
    border: "border-gray-400/30",
    bg: "bg-gray-400/10",
  },
  rare: {
    text: "text-blue-400",
    border: "border-blue-400/30",
    bg: "bg-blue-400/10",
  },
  epic: {
    text: "text-purple-400",
    border: "border-purple-400/30",
    bg: "bg-purple-400/10",
  },
  legendary: {
    text: "text-yellow-400",
    border: "border-yellow-400/30",
    bg: "bg-yellow-400/10",
  },
} as const

export const API_ENDPOINTS = {
  user: {
    init: "/user/init",
    balance: (id: number) => `/user/${id}/balance`,
    inventory: (id: number) => `/user/${id}/inventory`,
    transactions: (id: number) => `/user/${id}/transactions`,
    referrals: (id: number) => `/user/${id}/referrals`,
    withdraw: "/user/withdraw",
    connectWallet: "/user/connect-wallet",
  },
  cases: {
    open: "/cases/open",
  },
} as const
