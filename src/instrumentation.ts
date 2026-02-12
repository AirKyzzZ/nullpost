export async function register() {
  // Only run auto-migrations in Docker/self-hosted (local SQLite).
  // On serverless (Netlify/Vercel) the DB is remote (Turso) — run migrations
  // via `npx drizzle-kit migrate` or the Turso dashboard instead.
  const isServerless = !!(process.env.NETLIFY || process.env.VERCEL)

  if (process.env.NEXT_RUNTIME === "nodejs" && !isServerless) {
    try {
      const { runMigrations } = await import("@/lib/db/migrate")
      await runMigrations()
      console.log("[nullpost] database migrations applied")
    } catch (error) {
      console.error("[nullpost] FATAL: migration failed:", error)
      throw error
    }
  }
}
