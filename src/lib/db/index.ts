import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

const DATABASE_URL = process.env.DATABASE_URL || "file:./data/nullpost.db"
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN || undefined

function createConnection() {
  const client = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  })
  return drizzle(client, { schema })
}

let db: ReturnType<typeof createConnection>

export function getDb() {
  if (!db) {
    db = createConnection()
  }
  return db
}

export type Db = ReturnType<typeof getDb>
