/**
 * Constantes cryptographiques — centralisées ici pour faciliter l'audit de sécurité.
 *
 * Ces valeurs suivent les recommandations NIST (National Institute of Standards) :
 * - PBKDF2 avec 600 000 itérations (OWASP recommande ≥ 600 000 en 2024)
 * - AES-256-GCM (chiffrement authentifié standard)
 * - Sel de 32 octets (256 bits — suffisant pour éviter les collisions)
 * - IV de 12 octets (96 bits — taille recommandée pour GCM)
 */
export const CRYPTO_CONFIG = {
  PBKDF2_ITERATIONS: 600_000, // Nombre de tours pour ralentir le brute-force
  KEY_LENGTH: 256, // Taille de la clé AES en bits (256 = niveau maximum)
  SALT_LENGTH: 32, // Taille du sel en octets
  IV_LENGTH: 12, // Taille de l'IV en octets (recommandé par NIST pour GCM)
  ALGORITHM: "AES-GCM" as const, // Mode de chiffrement authentifié
  HASH: "SHA-256" as const, // Fonction de hachage pour PBKDF2
  // Texte connu utilisé pour vérifier si la passphrase est correcte
  // (on chiffre ce texte au setup, puis on le déchiffre pour vérifier)
  VERIFIER_PLAINTEXT: "NULLPOST_ENCRYPTION_VERIFIER_V1",
} as const
