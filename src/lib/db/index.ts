/**
 * Connexion à la base de données — Drizzle ORM + libSQL (SQLite)
 *
 * Pourquoi libSQL plutôt que better-sqlite3 ?
 * → libSQL est compatible avec Turso (SQLite distribué dans le cloud).
 *   En local, on utilise un fichier SQLite classique (file:./data/nullpost.db).
 *   En production cloud, on utilise une URL Turso (libsql://...).
 *   Le même code fonctionne dans les deux cas.
 *
 * Pattern Singleton : on ne crée qu'une seule connexion (variable `db`).
 * getDb() retourne toujours la même instance pour éviter d'ouvrir
 * plusieurs connexions simultanées à SQLite (qui est mono-processus).
 */

import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

// Variables d'environnement pour la connexion
// Par défaut : fichier SQLite local (mode développement / Docker)
const DATABASE_URL = process.env.DATABASE_URL || "file:./data/nullpost.db"
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN || undefined

function createConnection() {
  const client = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN, // Nécessaire uniquement pour Turso (cloud)
  })
  // Le paramètre `schema` active le mode "relational queries" de Drizzle
  return drizzle(client, { schema })
}

// Singleton : une seule instance de connexion partagée
let db: ReturnType<typeof createConnection>

export function getDb() {
  if (!db) {
    db = createConnection()
  }
  return db
}

export type Db = ReturnType<typeof getDb>
