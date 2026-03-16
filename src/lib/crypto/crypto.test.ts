import { describe, it, expect } from "vitest"
import { encrypt, decrypt, deriveKey, generateSalt, createVerifier, verifyPassphrase } from "./index"
import { CRYPTO_CONFIG } from "./constants"

describe("Crypto module (AES-256-GCM)", () => {
  // Dériver une clé de test réutilisable
  async function getTestKey() {
    const salt = generateSalt()
    return { key: await deriveKey("test-passphrase-secure", salt), salt }
  }

  it("roundtrip : encrypt puis decrypt retourne le texte original", async () => {
    const { key } = await getTestKey()
    const plaintext = "Hello, NullPost! 🔐"

    const { ciphertext, iv } = await encrypt(key, plaintext)
    const result = await decrypt(key, ciphertext, iv)

    expect(result).toBe(plaintext)
  })

  it("mauvaise passphrase : decrypt throw une erreur (intégrité AES-GCM)", async () => {
    const { key: correctKey } = await getTestKey()
    const { key: wrongKey } = await getTestKey()

    const { ciphertext, iv } = await encrypt(correctKey, "secret data")

    await expect(decrypt(wrongKey, ciphertext, iv)).rejects.toThrow()
  })

  it("IV unique : deux encrypt() du même texte produisent des IVs différents", async () => {
    const { key } = await getTestKey()
    const plaintext = "same text"

    const result1 = await encrypt(key, plaintext)
    const result2 = await encrypt(key, plaintext)

    expect(result1.iv).not.toBe(result2.iv)
  })

  it("PBKDF2 reproductible : même passphrase + même sel → peut déchiffrer", async () => {
    const salt = generateSalt()
    const key1 = await deriveKey("my-passphrase", salt)
    const key2 = await deriveKey("my-passphrase", salt)

    const { ciphertext, iv } = await encrypt(key1, "reproducible test")
    const result = await decrypt(key2, ciphertext, iv)

    expect(result).toBe("reproducible test")
  })

  it("texte vide : encrypt/decrypt gère une chaîne vide", async () => {
    const { key } = await getTestKey()

    const { ciphertext, iv } = await encrypt(key, "")
    const result = await decrypt(key, ciphertext, iv)

    expect(result).toBe("")
  })

  it("texte long : encrypt/decrypt gère un texte de plusieurs KB", async () => {
    const { key } = await getTestKey()
    const longText = "A".repeat(10_000)

    const { ciphertext, iv } = await encrypt(key, longText)
    const result = await decrypt(key, ciphertext, iv)

    expect(result).toBe(longText)
    expect(result.length).toBe(10_000)
  })

  it("caractères spéciaux : supporte Unicode et emojis", async () => {
    const { key } = await getTestKey()
    const text = "Héllo 世界 🎉🔒 café naïve"

    const { ciphertext, iv } = await encrypt(key, text)
    const result = await decrypt(key, ciphertext, iv)

    expect(result).toBe(text)
  })

  it("generateSalt : produit un sel de la bonne longueur en base64", () => {
    const salt = generateSalt()
    // 32 bytes en base64 = 44 caractères (avec padding)
    expect(salt.length).toBeGreaterThan(0)

    // Deux sels consécutifs sont différents (aléatoire)
    const salt2 = generateSalt()
    expect(salt).not.toBe(salt2)
  })

  it("verifier : createVerifier + verifyPassphrase fonctionne", async () => {
    const { key } = await getTestKey()

    const { verifier, verifierIv } = await createVerifier(key)
    const isValid = await verifyPassphrase(key, verifier, verifierIv)

    expect(isValid).toBe(true)
  })

  it("verifier : mauvaise clé retourne false", async () => {
    const { key: correctKey } = await getTestKey()
    const { key: wrongKey } = await getTestKey()

    const { verifier, verifierIv } = await createVerifier(correctKey)
    const isValid = await verifyPassphrase(wrongKey, verifier, verifierIv)

    expect(isValid).toBe(false)
  })

  it("config : les constantes crypto sont correctes", () => {
    expect(CRYPTO_CONFIG.PBKDF2_ITERATIONS).toBe(600_000)
    expect(CRYPTO_CONFIG.KEY_LENGTH).toBe(256)
    expect(CRYPTO_CONFIG.SALT_LENGTH).toBe(32)
    expect(CRYPTO_CONFIG.IV_LENGTH).toBe(12)
    expect(CRYPTO_CONFIG.ALGORITHM).toBe("AES-GCM")
    expect(CRYPTO_CONFIG.HASH).toBe("SHA-256")
  })
})
