import { eq, and, gt } from "drizzle-orm"
import { nanoid } from "nanoid"
import { cookies } from "next/headers"
import { getDb } from "@/lib/db"
import { sessions, users } from "@/lib/db/schema"

const SESSION_COOKIE = "nullpost_session"
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function createSession(userId: string) {
  const db = getDb()
  const token = nanoid(48)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const db = getDb()
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (result.length === 0) return null

  return {
    session: result[0].session,
    user: result[0].user,
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    const db = getDb()
    await db.delete(sessions).where(eq(sessions.id, token))
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function isSetupComplete(): Promise<boolean> {
  const db = getDb()
  const result = await db.select({ id: users.id }).from(users).limit(1)
  return result.length > 0
}
