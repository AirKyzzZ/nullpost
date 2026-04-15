/**
 * API Route — Changement de passphrase (POST /api/auth/change-passphrase)
 *
 * Quand l'utilisateur change sa passphrase, TOUS ses posts doivent être
 * re-chiffrés avec la nouvelle clé. Le processus se fait côté client :
 * 1. Déchiffrer chaque post avec l'ancienne clé
 * 2. Re-chiffrer chaque post avec la nouvelle clé
 * 3. Envoyer tout au serveur en une seule requête transactionnelle
 *
 * La transaction garantit que soit TOUT est mis à jour, soit RIEN ne l'est
 * (pas de posts à moitié re-chiffrés en cas d'erreur).
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users, posts } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

type PostUpdate = {
  id: string
  encryptedContent: string
  iv: string
  encryptedTitle: string | null
  titleIv: string | null
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const {
      encryptionSalt,
      encryptionVerifier,
      encryptionVerifierIv,
      posts: postUpdates,
    } = body as {
      encryptionSalt: string
      encryptionVerifier: string
      encryptionVerifierIv: string
      posts: PostUpdate[]
    }

    if (!encryptionSalt || !encryptionVerifier || !encryptionVerifierIv) {
      return NextResponse.json(
        { error: "Encryption fields are required" },
        { status: 400 },
      )
    }

    if (!Array.isArray(postUpdates)) {
      return NextResponse.json(
        { error: "Posts array is required" },
        { status: 400 },
      )
    }

    const db = getDb()

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          encryptionSalt,
          encryptionVerifier,
          encryptionVerifierIv,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      for (const post of postUpdates) {
        await tx
          .update(posts)
          .set({
            encryptedContent: post.encryptedContent,
            iv: post.iv,
            encryptedTitle: post.encryptedTitle,
            titleIv: post.titleIv,
            updatedAt: new Date(),
          })
          .where(and(eq(posts.id, post.id), eq(posts.userId, user.id)))
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Change passphrase error:", error)
    return NextResponse.json(
      { error: "Failed to change passphrase" },
      { status: 500 },
    )
  }
}
