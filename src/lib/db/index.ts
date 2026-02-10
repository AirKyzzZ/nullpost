import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"

const DATABASE_PATH = process.env.DATABASE_URL || "./data/nullpost.db"

function createConnection() {
  const sqlite = new Database(DATABASE_PATH)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  return drizzle(sqlite, { schema })
}

let db: ReturnType<typeof createConnection>

export function getDb() {
  if (!db) {
    db = createConnection()
  }
  return db
}

export type Db = ReturnType<typeof getDb>
