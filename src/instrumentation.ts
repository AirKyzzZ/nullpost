export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/lib/db/migrate")
    try {
      await runMigrations()
      console.log("[nullpost] database migrations applied")
    } catch (error) {
      console.error("[nullpost] FATAL: migration failed:", error)
      // Re-throw in Docker/self-hosted (fail fast), but log-only on serverless
      // so the health endpoint and static pages remain reachable for debugging
      if (!process.env.NETLIFY && !process.env.VERCEL) {
        throw error
      }
    }
  }
}
