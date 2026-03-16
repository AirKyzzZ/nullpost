import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

// Route pour l'initialisation du chiffrement (premier login)
// Le user existe déjà en DB via le callback signIn d'Auth.js,
// mais les champs encryption ne sont pas encore définis.

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()

    // Ne pas écraser si le chiffrement est déjà configuré
    if (user.encryptionSalt) {
      return NextResponse.json(
        { error: "Encryption already configured" },
        { status: 400 },
      )
    }

    const { encryptionSalt, encryptionVerifier, encryptionVerifierIv } =
      await request.json()

    if (!encryptionSalt || !encryptionVerifier || !encryptionVerifierIv) {
      return NextResponse.json(
        { error: "All encryption fields are required" },
        { status: 400 },
      )
    }

    const db = getDb()
    await db
      .update(users)
      .set({
        encryptionSalt,
        encryptionVerifier,
        encryptionVerifierIv,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Setup encryption error:", error)
    return NextResponse.json(
      { error: "Failed to setup encryption" },
      { status: 500 },
    )
  }
}
