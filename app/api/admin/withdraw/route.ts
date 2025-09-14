import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, tgId } = await request.json()

    if (!userId || !tgId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const { data: user, error: getUserError } = await supabase
      .from("users")
      .select("balance, wallet_address")
      .eq("id", userId)
      .eq("tg_id", tgId)
      .single()

    if (getUserError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (user.balance <= 0) {
      return NextResponse.json({ success: false, error: "User has no balance to withdraw" }, { status: 400 })
    }

    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "admin_withdrawal",
      amount: user.balance,
      status: "completed",
      description: `Admin withdrawal of ${user.balance} TON`,
      wallet_address: user.wallet_address,
    })

    if (transactionError) {
      console.error("Transaction record error:", transactionError)
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        balance: 0,
        last_active: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("tg_id", tgId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // TODO: Integrate with TON Blockchain for real withdrawal
    // This would involve calling TON API to transfer funds from user's wallet
    console.log(`[ADMIN] Withdrew ${user.balance} TON from user ${tgId} (${userId})`)

    return NextResponse.json({
      success: true,
      data: {
        withdrawnAmount: user.balance,
        message: "Balance successfully withdrawn",
      },
    })
  } catch (error) {
    console.error("Admin withdrawal error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
