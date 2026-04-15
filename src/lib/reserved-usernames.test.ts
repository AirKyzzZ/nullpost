/**
 * Tests unitaires — Validation des noms d'utilisateur
 *
 * Vérifie que les règles de nommage sont bien appliquées :
 * - Format : 3-30 caractères, minuscules, chiffres, tirets, underscores
 * - Noms réservés : "admin", "api", "app", etc. sont interdits
 */

import { describe, it, expect } from "vitest"
import { isUsernameValid } from "./reserved-usernames"

describe("isUsernameValid — Validation des noms d'utilisateur", () => {
  // Cas valides
  it("accepte un nom d'utilisateur valide", () => {
    expect(isUsernameValid("maxime")).toEqual({ valid: true })
  })

  it("accepte les chiffres, tirets et underscores", () => {
    expect(isUsernameValid("user-123_test")).toEqual({ valid: true })
  })

  it("accepte un nom de 3 caractères (minimum)", () => {
    expect(isUsernameValid("abc")).toEqual({ valid: true })
  })

  it("accepte un nom de 30 caractères (maximum)", () => {
    expect(isUsernameValid("a".repeat(30))).toEqual({ valid: true })
  })

  // Cas invalides : format
  it("refuse un nom vide", () => {
    const result = isUsernameValid("")
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("refuse un nom trop court (< 3 caractères)", () => {
    const result = isUsernameValid("ab")
    expect(result.valid).toBe(false)
  })

  it("refuse un nom trop long (> 30 caractères)", () => {
    const result = isUsernameValid("a".repeat(31))
    expect(result.valid).toBe(false)
  })

  it("accepte les majuscules (converties en minuscules automatiquement)", () => {
    // La fonction convertit en minuscules avant validation
    const result = isUsernameValid("MaxIME")
    expect(result.valid).toBe(true)
  })

  it("refuse les espaces", () => {
    const result = isUsernameValid("max ime")
    expect(result.valid).toBe(false)
  })

  it("refuse les caractères spéciaux", () => {
    expect(isUsernameValid("user@name").valid).toBe(false)
    expect(isUsernameValid("user.name").valid).toBe(false)
    expect(isUsernameValid("user!name").valid).toBe(false)
  })

  // Cas invalides : noms réservés
  it("refuse les noms réservés (admin, api, app...)", () => {
    const reserved = ["admin", "api", "app", "login", "settings", "nullpost", "root"]
    for (const name of reserved) {
      const result = isUsernameValid(name)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("reserved")
    }
  })

  it("refuse les noms réservés même avec des majuscules", () => {
    // "Admin" est converti en "admin" → détecté comme réservé
    const result = isUsernameValid("Admin")
    expect(result.valid).toBe(false)
    expect(result.error).toContain("reserved")
  })
})
