"use client"

import { CRYPTO_CONFIG } from "./constants"

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(
    new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH),
  )
  return toBase64(salt.buffer)
}

export async function deriveKey(
  passphrase: string,
  saltBase64: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  const salt = fromBase64(saltBase64)

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
      hash: CRYPTO_CONFIG.HASH,
    },
    keyMaterial,
    {
      name: CRYPTO_CONFIG.ALGORITHM,
      length: CRYPTO_CONFIG.KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"],
  )
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH))

  const encrypted = await crypto.subtle.encrypt(
    { name: CRYPTO_CONFIG.ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv.buffer),
  }
}

export async function decrypt(
  key: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string,
): Promise<string> {
  const ciphertext = fromBase64(ciphertextBase64)
  const iv = fromBase64(ivBase64)

  const decrypted = await crypto.subtle.decrypt(
    { name: CRYPTO_CONFIG.ALGORITHM, iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(decrypted)
}

export async function createVerifier(key: CryptoKey): Promise<{
  verifier: string
  verifierIv: string
}> {
  const { ciphertext, iv } = await encrypt(
    key,
    CRYPTO_CONFIG.VERIFIER_PLAINTEXT,
  )
  return { verifier: ciphertext, verifierIv: iv }
}

export async function verifyPassphrase(
  key: CryptoKey,
  verifier: string,
  verifierIv: string,
): Promise<boolean> {
  try {
    const decrypted = await decrypt(key, verifier, verifierIv)
    return decrypted === CRYPTO_CONFIG.VERIFIER_PLAINTEXT
  } catch {
    return false
  }
}
