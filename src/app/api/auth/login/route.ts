import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      )
    }

    const db = getDb()
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      )
    }

    const user = result[0]
    const valid = await verifyPassword(password, user.passwordHash)

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      )
    }

    await createSession(user.id)

    return NextResponse.json({
      success: true,
      encryptionSalt: user.encryptionSalt,
      encryptionVerifier: user.encryptionVerifier,
      encryptionVerifierIv: user.encryptionVerifierIv,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 },
    )
  }
}
