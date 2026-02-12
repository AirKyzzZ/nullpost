import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"
import { isUsernameValid } from "@/lib/reserved-usernames"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const check = isUsernameValid(username)
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 })
    }

    const db = getDb()
    const lower = username.toLowerCase()

    // Check uniqueness (another user might have it)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, lower))
      .limit(1)

    if (existing.length > 0 && existing[0].id !== user.id) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 })
    }

    await db
      .update(users)
      .set({ username: lower, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true, username: lower })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update username error:", error)
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 })
  }
}
