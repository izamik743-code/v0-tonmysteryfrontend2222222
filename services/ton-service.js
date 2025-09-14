const axios = require("axios")

class TONService {
  constructor() {
    this.apiKey = process.env.TON_API_KEY
    this.network = process.env.TON_NETWORK || "mainnet"
    this.baseURL = "https://toncenter.com/api/v2"
  }

  // Get wallet balance
  async getWalletBalance(walletAddress) {
    try {
      const response = await axios.get(`${this.baseURL}/getAddressBalance`, {
        params: {
          address: walletAddress,
          api_key: this.apiKey,
        },
      })

      return {
        balance: response.data.result / 1000000000, // Convert from nanoTON to TON
        success: true,
      }
    } catch (error) {
      console.error("TON balance error:", error)
      return { balance: 0, success: false, error: error.message }
    }
  }

  // Verify transaction
  async verifyTransaction(txHash, expectedAmount, walletAddress) {
    try {
      const response = await axios.get(`${this.baseURL}/getTransactions`, {
        params: {
          address: walletAddress,
          limit: 10,
          api_key: this.apiKey,
        },
      })

      const transactions = response.data.result
      const transaction = transactions.find((tx) => tx.transaction_id.hash === txHash)

      if (!transaction) {
        return { verified: false, error: "Transaction not found" }
      }

      const amount = Math.abs(transaction.in_msg.value) / 1000000000
      const verified = amount >= expectedAmount

      return {
        verified,
        amount,
        timestamp: transaction.utime,
        success: true,
      }
    } catch (error) {
      console.error("TON verification error:", error)
      return { verified: false, success: false, error: error.message }
    }
  }

  // Get current TON price in USD
  async getTONPrice() {
    try {
      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids: "the-open-network",
          vs_currencies: "usd",
        },
      })

      return {
        price: response.data["the-open-network"].usd,
        success: true,
      }
    } catch (error) {
      console.error("TON price error:", error)
      return { price: 2.5, success: false } // Fallback price
    }
  }

  // Generate payment link
  generatePaymentLink(amount, comment, walletAddress) {
    const tonAmount = amount * 1000000000 // Convert to nanoTON
    return `ton://transfer/${walletAddress}?amount=${tonAmount}&text=${encodeURIComponent(comment)}`
  }
}

module.exports = new TONService()
