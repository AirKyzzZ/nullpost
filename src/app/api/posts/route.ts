import { NextRequest, NextResponse } from "next/server"
import { eq, desc, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getDb } from "@/lib/db"
import { posts, postTags, tags } from "@/lib/db/schema"
import { requireAuth } from "@/lib/auth/guard"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()

    const {
      encryptedContent,
      iv,
      contentType = "thought",
      encryptedTitle,
      titleIv,
      charCount,
      wordCount,
      tagIds,
    } = body

    if (!encryptedContent || !iv) {
      return NextResponse.json(
        { error: "Encrypted content and IV are required" },
        { status: 400 },
      )
    }

    if (!["thought", "longform"].includes(contentType)) {
      return NextResponse.json(
        { error: "Content type must be 'thought' or 'longform'" },
        { status: 400 },
      )
    }

    const db = getDb()
    const postId = nanoid()

    await db.insert(posts).values({
      id: postId,
      userId: user.id,
      encryptedContent,
      iv,
      contentType,
      encryptedTitle: encryptedTitle || null,
      titleIv: titleIv || null,
      charCount: charCount || null,
      wordCount: wordCount || null,
    })

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(postTags).values(
        tagIds.map((tagId: string) => ({ postId, tagId })),
      )
    }

    return NextResponse.json({ id: postId }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create post error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const offset = parseInt(searchParams.get("offset") || "0")
    const tagId = searchParams.get("tag")

    const db = getDb()

    let postIds: string[] | null = null

    if (tagId) {
      const taggedPosts = await db
        .select({ postId: postTags.postId })
        .from(postTags)
        .where(eq(postTags.tagId, tagId))
      postIds = taggedPosts.map((r) => r.postId)

      if (postIds.length === 0) {
        return NextResponse.json({ posts: [], total: 0 })
      }
    }

    let query = db
      .select()
      .from(posts)
      .where(eq(posts.userId, user.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)

    if (postIds) {
      query = db
        .select()
        .from(posts)
        .where(inArray(posts.id, postIds))
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset)
    }

    const result = await query

    const allPostTags = result.length > 0
      ? await db
          .select({
            postId: postTags.postId,
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(inArray(postTags.postId, result.map((p) => p.id)))
      : []

    const tagsByPostId = new Map<string, Array<{ id: string; name: string; color: string }>>()
    for (const pt of allPostTags) {
      const existing = tagsByPostId.get(pt.postId) || []
      existing.push({ id: pt.tagId, name: pt.tagName, color: pt.tagColor })
      tagsByPostId.set(pt.postId, existing)
    }

    const postsWithTags = result.map((post) => ({
      ...post,
      tags: tagsByPostId.get(post.id) || [],
    }))

    return NextResponse.json({ posts: postsWithTags })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("List posts error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}
