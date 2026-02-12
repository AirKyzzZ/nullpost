import type { Metadata } from "next"
import { eq, and } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users, posts } from "@/lib/db/schema"
import { PublicPostDetail } from "@/components/public/public-post-detail"

type Props = {
  params: Promise<{ username: string; postId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, postId } = await params
  const db = getDb()

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1)

  if (userResult.length === 0) {
    return { title: "Not Found — NullPost" }
  }

  const postResult = await db
    .select({
      plainTitle: posts.plainTitle,
      plainContent: posts.plainContent,
      contentType: posts.contentType,
    })
    .from(posts)
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.userId, userResult[0].id),
        eq(posts.isPublic, true),
      ),
    )
    .limit(1)

  if (postResult.length === 0) {
    return { title: "Not Found — NullPost" }
  }

  const post = postResult[0]
  const title = post.plainTitle || `Post by @${username}`
  const description = (post.plainContent || "").slice(0, 160)

  return {
    title: `${title} — NullPost`,
    description,
    openGraph: {
      title: `${title} — @${username}`,
      description,
      type: "article",
    },
  }
}

export default async function PublicPostPage({ params }: Props) {
  const { username, postId } = await params

  return <PublicPostDetail username={username} postId={postId} />
}
