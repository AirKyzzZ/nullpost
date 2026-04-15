/**
 * Module de chiffrement côté client — AES-256-GCM
 *
 * "use client" car ce code s'exécute UNIQUEMENT dans le navigateur.
 * Le serveur ne voit jamais les données en clair ni la passphrase.
 *
 * Flux de chiffrement :
 * 1. L'utilisateur saisit sa passphrase
 * 2. PBKDF2 dérive une clé AES-256 à partir de la passphrase + sel
 * 3. AES-256-GCM chiffre/déchiffre les données avec cette clé
 *
 * Pourquoi AES-256-GCM ?
 * → AES-256 = chiffrement symétrique standard (utilisé par gouvernements, banques)
 * → GCM (Galois/Counter Mode) = mode authentifié qui détecte toute altération
 *   des données chiffrées (intégrité + confidentialité)
 *
 * Pourquoi PBKDF2 ?
 * → Transforme une passphrase humaine en clé cryptographique de 256 bits.
 *   Les 600 000 itérations ralentissent volontairement le calcul pour
 *   rendre les attaques par force brute impraticables.
 */
"use client"

import { CRYPTO_CONFIG } from "./constants"

// Conversion ArrayBuffer ↔ Base64 pour stocker les données chiffrées en texte
// (la base de données SQLite stocke du texte, pas des binaires)
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

/**
 * Génère un sel aléatoire cryptographiquement sûr (32 octets).
 * Le sel est unique par utilisateur et stocké en base de données.
 * Il empêche deux utilisateurs avec la même passphrase d'avoir la même clé.
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(
    new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH),
  )
  return toBase64(salt.buffer)
}

/**
 * Dérive une clé AES-256 à partir d'une passphrase et d'un sel via PBKDF2.
 *
 * Étapes :
 * 1. importKey — transforme la passphrase texte en "matériau de clé" brut
 * 2. deriveKey — applique PBKDF2 avec 600 000 itérations + SHA-256
 *    pour produire une clé AES-256 de 256 bits
 *
 * La clé retournée est non-extractible (extractable: false) :
 * même du JavaScript malveillant ne peut pas lire les octets de la clé.
 */
export async function deriveKey(
  passphrase: string,
  saltBase64: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false, // non-extractible
    ["deriveKey"],
  )

  const salt = fromBase64(saltBase64)

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS, // 600 000 itérations
      hash: CRYPTO_CONFIG.HASH, // SHA-256
    },
    keyMaterial,
    {
      name: CRYPTO_CONFIG.ALGORITHM, // AES-GCM
      length: CRYPTO_CONFIG.KEY_LENGTH, // 256 bits
    },
    false, // non-extractible
    ["encrypt", "decrypt"],
  )
}

/**
 * Chiffre un texte en clair avec AES-256-GCM.
 *
 * Un IV (Initialization Vector) de 12 octets est généré aléatoirement
 * pour CHAQUE opération de chiffrement. C'est essentiel :
 * → Même texte + même clé + IV différent = résultat chiffré différent.
 * → Réutiliser un IV avec la même clé compromettrait la sécurité.
 *
 * Retourne le texte chiffré + l'IV, tous deux en base64 pour le stockage.
 */
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

/**
 * Déchiffre un texte avec AES-256-GCM.
 *
 * GCM vérifie automatiquement l'intégrité : si le texte chiffré a été
 * modifié ou si la clé est incorrecte, decrypt() lève une exception.
 * C'est la propriété "authentifié" de GCM — pas besoin de vérification séparée.
 */
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

/**
 * Crée un "verifier" — un texte connu chiffré avec la clé de l'utilisateur.
 *
 * Stocké en base de données lors du setup initial. Permet de vérifier
 * si une passphrase est correcte SANS stocker la passphrase elle-même :
 * → On déchiffre le verifier avec la clé dérivée de la passphrase saisie
 * → Si le résultat correspond au texte connu, la passphrase est correcte
 */
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

/**
 * Vérifie si une passphrase est correcte en tentant de déchiffrer le verifier.
 * Retourne true si la passphrase est bonne, false sinon.
 *
 * En cas de mauvaise passphrase, AES-GCM lève une erreur (intégrité compromise)
 * que l'on attrape pour retourner false au lieu de crasher.
 */
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
