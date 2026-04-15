/**
 * Gestion des sessions — Pont entre Auth.js et la base de données.
 *
 * Auth.js gère l'authentification OAuth (token JWT dans un cookie httpOnly),
 * mais nos routes API ont besoin des données complètes de l'utilisateur
 * (notamment les champs de chiffrement stockés en DB).
 *
 * Flux : Cookie JWT → Auth.js (vérifie le token) → DB (récupère l'utilisateur)
 */

import { eq } from "drizzle-orm"
import { auth, signOut } from "@/auth"
import { getDb } from "@/lib/db"
import { users } from "@/lib/db/schema"

/**
 * Récupère la session courante avec les données utilisateur complètes.
 *
 * 1. auth() lit le cookie JWT et vérifie sa signature
 * 2. On extrait le githubLogin du token
 * 3. On récupère l'utilisateur complet en DB (avec les champs de chiffrement)
 *
 * Retourne null si pas de session ou utilisateur introuvable.
 */
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

/** Déconnexion : supprime le cookie de session via Auth.js */
export async function deleteSession() {
  await signOut()
}

/** Vérifie si au moins un utilisateur existe en DB (= setup terminé) */
export async function isSetupComplete(): Promise<boolean> {
  const db = getDb()
  const result = await db.select({ id: users.id }).from(users).limit(1)
  return result.length > 0
}
