import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users, posts, postTags, tags, media } from "@/lib/db/schema"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string; postId: string }> },
) {
  try {
    const { username, postId } = await params
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

    // Fetch the specific public post
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
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.userId, userId),
          eq(posts.isPublic, true),
        ),
      )
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const post = result[0]

    // Tags
    const postTagsResult = await db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagColor: tags.color,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, postId))

    // Media
    const postMedia = await db
      .select({
        id: media.id,
        mimeType: media.mimeType,
        size: media.size,
      })
      .from(media)
      .where(eq(media.postId, postId))

    return NextResponse.json(
      {
        ...post,
        tags: postTagsResult.map((t) => ({
          id: t.tagId,
          name: t.tagName,
          color: t.tagColor,
        })),
        media: postMedia,
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } },
    )
  } catch (error) {
    console.error("Public post detail error:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}
