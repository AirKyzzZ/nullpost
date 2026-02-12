export async function register() {
  // Only auto-migrate for local file databases (Docker/self-hosted).
  // Remote databases (Turso on Netlify/Vercel) should be migrated
  // via `npx drizzle-kit migrate` before deploying.
  const dbUrl = process.env.DATABASE_URL || "file:./data/nullpost.db"
  const isLocalDb = dbUrl.startsWith("file:")

  if (process.env.NEXT_RUNTIME === "nodejs" && isLocalDb) {
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
