/**
 * Tests E2E — Routes API publiques
 *
 * Vérifie que les routes API répondent correctement :
 * - Health check : toujours accessible
 * - Routes protégées : retournent 401 sans session
 * - Routes publiques : fonctionnent sans authentification
 */

import { test, expect } from "@playwright/test"

test.describe("API — Health check", () => {
  test("GET /api/health retourne status ok", async ({ request }) => {
    const response = await request.get("/api/health")
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.status).toBe("ok")
    expect(body.timestamp).toBeDefined()
  })
})

test.describe("API — Routes protégées (sans authentification)", () => {
  test("GET /api/posts retourne 401 sans session", async ({ request }) => {
    const response = await request.get("/api/posts")
    expect(response.status()).toBe(401)
  })

  test("POST /api/posts retourne 401 sans session", async ({ request }) => {
    const response = await request.post("/api/posts", {
      data: { encryptedContent: "test", iv: "test" },
    })
    expect(response.status()).toBe(401)
  })

  test("GET /api/tags retourne 401 sans session", async ({ request }) => {
    const response = await request.get("/api/tags")
    expect(response.status()).toBe(401)
  })

  test("POST /api/tags retourne 401 sans session", async ({ request }) => {
    const response = await request.post("/api/tags", {
      data: { name: "test" },
    })
    expect(response.status()).toBe(401)
  })

  test("GET /api/auth/session retourne authenticated: false", async ({ request }) => {
    const response = await request.get("/api/auth/session")
    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body.authenticated).toBe(false)
  })
})

test.describe("API — Security headers", () => {
  test("les headers de sécurité sont présents sur les réponses API", async ({ request }) => {
    const response = await request.get("/api/health")

    expect(response.headers()["x-frame-options"]).toBe("DENY")
    expect(response.headers()["x-content-type-options"]).toBe("nosniff")
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  })
})
