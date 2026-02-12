import { NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { createSession, isSetupComplete } from "@/lib/auth/session"
import { isUsernameValid } from "@/lib/reserved-usernames"

export async function POST(request: NextRequest) {
  try {
    const setupDone = await isSetupComplete()
    if (setupDone) {
      return NextResponse.json(
        { error: "Setup already completed" },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { email, username, password, encryptionSalt, encryptionVerifier, encryptionVerifierIv } = body

    if (!email || !password || !encryptionSalt || !encryptionVerifier || !encryptionVerifierIv) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      )
    }

    if (username) {
      const check = isUsernameValid(username)
      if (!check.valid) {
        return NextResponse.json({ error: check.error }, { status: 400 })
      }
    }

    const db = getDb()
    const userId = nanoid()
    const passwordHash = await hashPassword(password)

    await db.insert(users).values({
      id: userId,
      email,
      username: username ? username.toLowerCase() : null,
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
