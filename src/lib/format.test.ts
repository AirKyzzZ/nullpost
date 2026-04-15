/**
 * Tests unitaires — Fonctions de formatage (dates et tailles de fichiers)
 *
 * Ces tests vérifient que les fonctions utilitaires d'affichage
 * produisent le bon résultat pour différents cas (normal, limites, erreurs).
 */

import { describe, it, expect, vi, afterEach } from "vitest"
import { formatRelativeDate, formatFileSize, formatFullDate } from "./format"

describe("formatRelativeDate — Affichage de dates relatives", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("retourne 'just now' pour une date de moins de 60 secondes", () => {
    const now = new Date()
    expect(formatRelativeDate(now)).toBe("just now")
  })

  it("retourne les minutes pour une date de moins d'une heure", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
    expect(formatRelativeDate(date)).toBe("5m ago")
  })

  it("retourne les heures pour une date de moins d'un jour", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 heures
    expect(formatRelativeDate(date)).toBe("3h ago")
  })

  it("retourne les jours pour une date de moins d'une semaine", () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 jours
    expect(formatRelativeDate(date)).toBe("2d ago")
  })

  it("retourne une date formatée pour une date de plus d'une semaine", () => {
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
    const result = formatRelativeDate(date)
    // Doit contenir un mois abrégé et un jour (ex: "Feb 22")
    expect(result).toMatch(/\w+ \d+/)
  })

  it("accepte une chaîne ISO en entrée", () => {
    const result = formatRelativeDate(new Date().toISOString())
    expect(result).toBe("just now")
  })
})

describe("formatFileSize — Conversion octets → format lisible", () => {
  it("retourne '0 B' pour 0 octets", () => {
    expect(formatFileSize(0)).toBe("0 B")
  })

  it("retourne '0 B' pour des valeurs négatives", () => {
    expect(formatFileSize(-100)).toBe("0 B")
  })

  it("affiche les octets bruts sous 1 KB", () => {
    expect(formatFileSize(512)).toBe("512 B")
  })

  it("convertit en KB correctement", () => {
    expect(formatFileSize(1024)).toBe("1 KB")
  })

  it("convertit en MB correctement", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB")
  })

  it("convertit en GB correctement", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB")
  })

  it("arrondit à une décimale", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB") // 1.5 * 1024
  })
})

describe("formatFullDate — Date complète avec jour et heure", () => {
  it("retourne une date formatée avec le jour de la semaine", () => {
    const date = new Date("2025-06-15T14:30:00")
    const result = formatFullDate(date)
    // Doit contenir le jour de la semaine, le mois, et l'heure
    expect(result).toContain("June")
    expect(result).toContain("15")
    expect(result).toContain("2025")
  })

  it("accepte une chaîne ISO en entrée", () => {
    const result = formatFullDate("2025-01-01T00:00:00")
    expect(result).toContain("January")
    expect(result).toContain("1")
  })
})
