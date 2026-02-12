const RESERVED_USERNAMES = new Set([
  "app",
  "api",
  "login",
  "setup",
  "admin",
  "settings",
  "profile",
  "public",
  "explore",
  "feed",
  "null",
  "nullpost",
  "system",
  "root",
  "static",
  "_next",
  "favicon",
  "about",
  "help",
  "support",
  "terms",
  "privacy",
  "status",
])

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/

export function isUsernameValid(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: "Username is required" }
  }

  const lower = username.toLowerCase()

  if (!USERNAME_REGEX.test(lower)) {
    return {
      valid: false,
      error: "Username must be 3-30 characters, lowercase letters, numbers, hyphens, or underscores",
    }
  }

  if (RESERVED_USERNAMES.has(lower)) {
    return { valid: false, error: "This username is reserved" }
  }

  return { valid: true }
}
