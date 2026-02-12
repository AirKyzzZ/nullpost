import type { Metadata } from "next"
import { eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { ProfileFeed } from "@/components/public/profile-feed"

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  return {
    title: `@${username} — NullPost`,
    description: `Public posts by @${username} on NullPost`.slice(0, 160),
    openGraph: {
      title: `@${username} — NullPost`,
      description: `Public posts by @${username}`,
      type: "profile",
    },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params

  // Verify user exists server-side for 404
  const db = getDb()
  const result = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1)

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="font-terminal text-null-red text-sm">
          {">"} User not found
        </p>
      </div>
    )
  }

  return <ProfileFeed username={username} />
}
