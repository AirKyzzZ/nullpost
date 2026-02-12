import { NextRequest, NextResponse } from "next/server"
import { eq, and, desc, inArray } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users, posts, postTags, tags, media } from "@/lib/db/schema"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const offset = parseInt(searchParams.get("offset") || "0")

    const db = getDb()

    // Find user by username
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1)

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userResult[0].id

    // Fetch public posts only
    const result = await db
      .select({
        id: posts.id,
        contentType: posts.contentType,
        plainContent: posts.plainContent,
        plainTitle: posts.plainTitle,
        charCount: posts.charCount,
        wordCount: posts.wordCount,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.isPublic, true)))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)

    // Fetch tags for these posts
    const postIds = result.map((p) => p.id)
    const allPostTags = postIds.length > 0
      ? await db
          .select({
            postId: postTags.postId,
            tagId: tags.id,
            tagName: tags.name,
            tagColor: tags.color,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(inArray(postTags.postId, postIds))
      : []

    const tagsByPostId = new Map<string, Array<{ id: string; name: string; color: string }>>()
    for (const pt of allPostTags) {
      const existing = tagsByPostId.get(pt.postId) || []
      existing.push({ id: pt.tagId, name: pt.tagName, color: pt.tagColor })
      tagsByPostId.set(pt.postId, existing)
    }

    // Fetch media for these posts
    const allMedia = postIds.length > 0
      ? await db
          .select({
            id: media.id,
            postId: media.postId,
            mimeType: media.mimeType,
            size: media.size,
          })
          .from(media)
          .where(inArray(media.postId, postIds))
      : []

    const mediaByPostId = new Map<string, typeof allMedia>()
    for (const m of allMedia) {
      if (!m.postId) continue
      const existing = mediaByPostId.get(m.postId) || []
      existing.push(m)
      mediaByPostId.set(m.postId, existing)
    }

    const postsWithMeta = result.map((post) => ({
      ...post,
      tags: tagsByPostId.get(post.id) || [],
      media: mediaByPostId.get(post.id) || [],
    }))

    return NextResponse.json(
      { posts: postsWithMeta },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } },
    )
  } catch (error) {
    console.error("Public posts error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}
