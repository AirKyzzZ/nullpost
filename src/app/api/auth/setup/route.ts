import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { runMigrations } from "@/lib/db/migrate"
import { hashPassword } from "@/lib/auth/password"
import { createSession, isSetupComplete } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    // Run migrations on first setup
    runMigrations()

    const setupDone = await isSetupComplete()
    if (setupDone) {
      return NextResponse.json(
        { error: "Setup already completed" },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { email, password, encryptionSalt, encryptionVerifier, encryptionVerifierIv } = body

    if (!email || !password || !encryptionSalt || !encryptionVerifier || !encryptionVerifierIv) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      )
    }

    const db = getDb()
    const userId = nanoid()
    const passwordHash = await hashPassword(password)

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      encryptionSalt,
      encryptionVerifier,
      encryptionVerifierIv,
    })

    await createSession(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      { error: "Setup failed" },
      { status: 500 },
    )
  }
}
