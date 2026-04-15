/**
 * API Route — Opérations sur un post individuel
 *
 * GET    /api/posts/[id] → Récupérer un post par son ID
 * PATCH  /api/posts/[id] → Modifier un post existant
 * DELETE /api/posts/[id] → Supprimer un post
 *
 * Chaque opération vérifie que le post appartient à l'utilisateur connecté
 * (on ne peut pas modifier/supprimer les posts d'un autre utilisateur).
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { posts, postTags, tags, media } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

/** GET /api/posts/[id] — Récupérer un post avec ses tags et médias */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const db = getDb()

    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, user.id)))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const post = result[0]

    const postTagsResult = await db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, id))

    const postMedia = await db
      .select({
        id: media.id,
        encryptedFilename: media.encryptedFilename,
        filenameIv: media.filenameIv,
        mimeType: media.mimeType,
        size: media.size,
      })
      .from(media)
      .where(eq(media.postId, id))

    return NextResponse.json({
      ...post,
      tags: postTagsResult.map((t) => ({
        id: t.tagId,
        name: t.tagName,
        color: t.tagColor,
      })),
      media: postMedia,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Get post error:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

/**
 * PATCH /api/posts/[id] — Modifier un post existant
 *
 * On n'envoie QUE les champs à modifier (PATCH partiel).
 * La vérification "post appartient à l'utilisateur" se fait AVANT la mise à jour.
 *
 * Règle pour les posts publics :
 * → Un post public a TOUJOURS une copie en clair (plainContent) pour l'affichage
 *   sans passphrase. Si on modifie le contenu d'un post public, on doit aussi
 *   envoyer le nouveau plainContent.
 * → Si on bascule un post de public à privé, on efface le plainContent.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const db = getDb()

    // Vérifie que le post existe ET appartient à l'utilisateur connecté
    const existing = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, user.id)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const {
      encryptedContent,
      iv,
      contentType,
      encryptedTitle,
      titleIv,
      isPublic,
      plainContent,
      plainTitle,
      charCount,
      wordCount,
      tagIds,
      mediaIds,
    } = body

    // On construit l'objet de mise à jour avec seulement les champs fournis
    const updates: Record<string, unknown> = { updatedAt: new Date() }

    if (encryptedContent && iv) {
      updates.encryptedContent = encryptedContent
      updates.iv = iv
    }
    if (contentType) updates.contentType = contentType
    if (encryptedTitle !== undefined) {
      updates.encryptedTitle = encryptedTitle || null
      updates.titleIv = titleIv || null
    }

    // Gestion de la visibilité (public/privé)
    if (isPublic !== undefined) {
      updates.isPublic = !!isPublic
      if (isPublic) {
        // Le client doit envoyer le contenu en clair pour les posts publics
        if (!plainContent) {
          return NextResponse.json(
            { error: "Plain content is required for public posts" },
            { status: 400 },
          )
        }
        updates.plainContent = plainContent
        updates.plainTitle = plainTitle || null
      } else {
        // Passage de public → privé : on supprime la copie en clair
        updates.plainContent = null
        updates.plainTitle = null
      }
    } else if (existing[0].isPublic && encryptedContent) {
      // Post déjà public dont on met à jour le contenu : synchroniser plainContent
      if (!plainContent) {
        return NextResponse.json(
          { error: "Plain content is required when updating public posts" },
          { status: 400 },
        )
      }
      updates.plainContent = plainContent
      updates.plainTitle = plainTitle || null
    }

    if (charCount !== undefined) updates.charCount = charCount
    if (wordCount !== undefined) updates.wordCount = wordCount

    await db.update(posts).set(updates).where(eq(posts.id, id))

    // Mise à jour des tags : on supprime les anciens puis on insère les nouveaux
    // (stratégie "delete + insert" plus simple qu'un diff)
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      await db.delete(postTags).where(eq(postTags.postId, id))
      if (tagIds.length > 0) {
        await db.insert(postTags).values(
          tagIds.map((tagId: string) => ({ postId: id, tagId })),
        )
      }
    }

    // Mise à jour des médias rattachés au post
    if (mediaIds !== undefined && Array.isArray(mediaIds)) {
      // Détacher tous les médias actuellement liés à ce post
      await db
        .update(media)
        .set({ postId: null })
        .where(and(eq(media.postId, id), eq(media.userId, user.id)))
      // Rattacher les nouveaux médias sélectionnés
      if (mediaIds.length > 0) {
        await Promise.all(
          mediaIds.map((mediaId: string) =>
            db.update(media).set({ postId: id }).where(
              and(eq(media.id, mediaId), eq(media.userId, user.id))
            )
          ),
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update post error:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

/**
 * DELETE /api/posts/[id] — Supprimer un post
 *
 * Vérifie que le post appartient à l'utilisateur avant de supprimer.
 * La suppression en cascade (définie dans le schéma) supprime automatiquement
 * les associations post_tags liées à ce post.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const db = getDb()

    // Vérification d'appartenance : un utilisateur ne peut supprimer que ses propres posts
    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, user.id)))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await db.delete(posts).where(eq(posts.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete post error:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
