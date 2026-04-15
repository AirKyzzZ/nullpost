/**
 * Guard d'authentification — utilisé dans toutes les routes API protégées.
 *
 * Pattern "fail fast" : si l'utilisateur n'est pas connecté, on lève une
 * erreur immédiatement au lieu de retourner null et vérifier plus tard.
 * Chaque route API appelle requireAuth() en première ligne.
 *
 * L'erreur "Unauthorized" est attrapée dans le try/catch de chaque route
 * pour retourner une réponse HTTP 401.
 */

import { getSession } from "./session"

export async function requireAuth() {
  const result = await getSession()
  if (!result) {
    throw new Error("Unauthorized")
  }
  return result
}
