import { migrate } from "drizzle-orm/libsql/migrator"
import { getDb } from "."

export async function runMigrations() {
  const db = getDb()
  await migrate(db, { migrationsFolder: "./drizzle" })
}
