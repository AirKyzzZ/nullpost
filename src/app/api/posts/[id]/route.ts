import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { posts, postTags, tags, media } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const db = getDb()

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
      charCount,
      wordCount,
      tagIds,
      mediaIds,
    } = body

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
    if (charCount !== undefined) updates.charCount = charCount
    if (wordCount !== undefined) updates.wordCount = wordCount

    await db.update(posts).set(updates).where(eq(posts.id, id))

    if (tagIds !== undefined && Array.isArray(tagIds)) {
      await db.delete(postTags).where(eq(postTags.postId, id))
      if (tagIds.length > 0) {
        await db.insert(postTags).values(
          tagIds.map((tagId: string) => ({ postId: id, tagId })),
        )
      }
    }

    if (mediaIds !== undefined && Array.isArray(mediaIds)) {
      await db
        .update(media)
        .set({ postId: null })
        .where(and(eq(media.postId, id), eq(media.userId, user.id)))
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuth()
    const { id } = await params
    const db = getDb()

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
