/**
 * Tests E2E — Page RGPD (conformité vie privée)
 *
 * Vérifie que la page RGPD affiche bien toutes les informations
 * requises par le règlement européen sur la protection des données.
 */

import { test, expect } from "@playwright/test"

test.describe("Page RGPD", () => {
  test("la page RGPD charge correctement (status 200)", async ({ page }) => {
    const response = await page.goto("/rgpd")
    expect(response?.status()).toBe(200)
  })

  test("le titre RGPD est présent", async ({ page }) => {
    await page.goto("/rgpd")
    await expect(page.locator("text=RGPD").first()).toBeVisible()
  })

  test("mentionne le chiffrement AES-256-GCM", async ({ page }) => {
    await page.goto("/rgpd")
    // Le chiffrement est un point clé de la politique de confidentialité
    await expect(page.locator("text=AES-256-GCM").first()).toBeVisible()
  })

  test("mentionne les droits des utilisateurs", async ({ page }) => {
    await page.goto("/rgpd")
    // Les droits RGPD doivent être listés (accès, export, suppression)
    const content = await page.textContent("main")
    expect(content).toContain("accès")
    expect(content).toContain("export")
  })

  test("mentionne GitHub OAuth comme sous-traitant", async ({ page }) => {
    await page.goto("/rgpd")
    const content = await page.textContent("main")
    expect(content).toContain("GitHub")
  })
})
