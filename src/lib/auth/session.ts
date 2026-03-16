import { eq } from "drizzle-orm"
import { auth, signOut } from "@/auth"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

// Couche de compatibilité : les API routes existantes appellent getSession()
// et attendent { user } avec les données DB. On utilise auth() d'Auth.js
// pour vérifier la session, puis on récupère l'utilisateur complet en DB.

export async function getSession() {
  const session = await auth()
  if (!session?.user?.githubLogin) return null

  const db = getDb()
  const result = await db
    .select()
    .from(users)
    .where(eq(users.githubLogin, session.user.githubLogin))
    .limit(1)

  if (result.length === 0) return null

  return { user: result[0] }
}

export async function deleteSession() {
  await signOut()
}

export async function isSetupComplete(): Promise<boolean> {
  const db = getDb()
  const result = await db.select({ id: users.id }).from(users).limit(1)
  return result.length > 0
}
