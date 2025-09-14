import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (usersError) {
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 })
    }

    const totalUsers = users?.length || 0
    const totalBalance = users?.reduce((sum, user) => sum + (user.balance || 0), 0) || 0
    const connectedWallets = users?.filter((user) => user.wallet_address).length || 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeToday = users?.filter((user) => new Date(user.last_active || user.created_at) >= today).length || 0

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        stats: {
          totalUsers,
          totalBalance,
          connectedWallets,
          activeToday,
        },
      },
    })
  } catch (error) {
    console.error("Admin users fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
