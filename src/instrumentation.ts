export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/lib/db/migrate")
    try {
      await runMigrations()
      console.log("[nullpost] database migrations applied")
    } catch (error) {
      console.error("[nullpost] FATAL: migration failed:", error)
      throw error
    }
  }
}
