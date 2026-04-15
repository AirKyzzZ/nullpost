/**
 * API Route — Initialisation du chiffrement (POST /api/auth/setup-encryption)
 *
 * Appelée une seule fois, lors du premier login de l'utilisateur.
 * À ce stade, l'utilisateur existe déjà en DB (créé par le callback signIn d'Auth.js),
 * mais ses champs de chiffrement (salt, verifier) ne sont pas encore définis.
 *
 * Flux côté client :
 * 1. L'utilisateur choisit sa passphrase
 * 2. Le client génère un sel aléatoire
 * 3. Le client dérive une clé AES-256 via PBKDF2(passphrase, sel)
 * 4. Le client chiffre le texte "NULLPOST_ENCRYPTION_VERIFIER_V1" avec cette clé
 * 5. Le client envoie (sel, verifier_chiffré, iv_du_verifier) au serveur
 *
 * Le serveur ne reçoit JAMAIS la passphrase ni la clé.
 * Il stocke juste les données nécessaires pour vérifier la passphrase plus tard.
 */

import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

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
