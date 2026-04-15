/**
 * Instrumentation Next.js — Code exécuté AU DÉMARRAGE du serveur.
 *
 * register() est appelé une seule fois quand Next.js démarre.
 * On l'utilise pour appliquer automatiquement les migrations de base de données
 * en mode local (Docker / développement).
 *
 * Pourquoi pas en production cloud (Turso) ?
 * → En production, les migrations doivent être appliquées manuellement
 *   via `npx drizzle-kit migrate` AVANT le déploiement, car Turso est
 *   un service distant partagé et les migrations automatiques pourraient
 *   causer des problèmes (timeout, conflits).
 */
export async function register() {
  const dbUrl = process.env.DATABASE_URL || "file:./data/nullpost.db"
  const isLocalDb = dbUrl.startsWith("file:")

  // Conditions pour l'auto-migration :
  // 1. Runtime Node.js (pas Edge)
  // 2. Base de données locale (fichier SQLite)
  if (process.env.NEXT_RUNTIME === "nodejs" && isLocalDb) {
    try {
      const { runMigrations } = await import("@/lib/db/migrate")
      await runMigrations()
      console.log("[nullpost] database migrations applied")
    } catch (error) {
      // Erreur fatale : si les migrations échouent, le serveur ne peut pas démarrer
      console.error("[nullpost] FATAL: migration failed:", error)
      throw error
    }
  }
}
