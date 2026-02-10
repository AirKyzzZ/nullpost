import { getSession } from "./session"

export async function requireAuth() {
  const result = await getSession()
  if (!result) {
    throw new Error("Unauthorized")
  }
  return result
}
