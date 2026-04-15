/**
 * Tests E2E — Page d'accueil (landing page)
 *
 * Vérifie que la page d'accueil s'affiche correctement pour un visiteur
 * non connecté : titre, sections principales, liens de navigation.
 */

import { test, expect } from "@playwright/test"

test.describe("Landing page", () => {
  test("la page d'accueil charge correctement (status 200)", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
  })

  test("le titre NullPost est visible", async ({ page }) => {
    await page.goto("/")
    // Le logo ou titre principal doit être visible
    await expect(page.locator("text=NullPost").first()).toBeVisible()
  })

  test("le bouton de login est accessible depuis la landing", async ({ page }) => {
    await page.goto("/")
    // Le lien vers la page de connexion doit exister
    const loginLink = page.locator('a[href="/login"]').first()
    await expect(loginLink).toBeVisible()
  })

  test("les sections principales sont rendues", async ({ page }) => {
    await page.goto("/")
    // La page doit contenir les sections clés
    await expect(page.locator("main")).toBeVisible()
  })

  test("la page contient le lien GitHub du projet", async ({ page }) => {
    await page.goto("/")
    const githubLink = page.locator('a[href*="github.com"]').first()
    await expect(githubLink).toBeVisible()
  })
})
