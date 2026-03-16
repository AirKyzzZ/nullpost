import { test, expect } from "@playwright/test"

test.describe("Auth flow", () => {
  test("/app/feed sans session redirige vers /login", async ({ page }) => {
    await page.goto("/app/feed")
    await expect(page).toHaveURL(/\/login/)
  })

  test("/app/post/new sans session redirige vers /login", async ({ page }) => {
    await page.goto("/app/post/new")
    await expect(page).toHaveURL(/\/login/)
  })

  test("/app/settings sans session redirige vers /login", async ({ page }) => {
    await page.goto("/app/settings")
    await expect(page).toHaveURL(/\/login/)
  })

  test("/login répond 200", async ({ page }) => {
    const response = await page.goto("/login")
    expect(response?.status()).toBe(200)
  })

  test("/login contient un bouton GitHub", async ({ page }) => {
    await page.goto("/login")
    const button = page.getByRole("button", { name: /github/i })
    await expect(button).toBeVisible()
  })

  test("security headers présents sur /login", async ({ page }) => {
    const response = await page.goto("/login")
    const headers = response?.headers() || {}

    expect(headers["x-frame-options"]).toBe("DENY")
    expect(headers["x-content-type-options"]).toBe("nosniff")
  })
})
