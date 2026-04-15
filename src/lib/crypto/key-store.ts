/**
 * Key Store — Gestion de la clé de chiffrement en mémoire côté client.
 *
 * Utilise Zustand (bibliothèque de state management) pour stocker la clé AES
 * dans l'état global de l'application React.
 *
 * Pourquoi Zustand plutôt que React Context ?
 * → Zustand est plus simple pour un état global qui n'a pas besoin de props.
 *   Chaque composant peut accéder à la clé via useKeyStore() sans prop drilling.
 *
 * Sécurité : la clé n'est JAMAIS envoyée au serveur ni persistée en localStorage.
 * Elle existe uniquement en mémoire (RAM) du navigateur.
 * → Si l'utilisateur ferme l'onglet, la clé est perdue et il devra
 *   re-saisir sa passphrase (comportement voulu).
 */
"use client"

import { create } from "zustand"
import { deriveKey, verifyPassphrase } from "."

type KeyStore = {
  cryptoKey: CryptoKey | null
  isUnlocked: boolean
  unlock: (
    passphrase: string,
    salt: string,
    verifier: string,
    verifierIv: string,
  ) => Promise<boolean>
  lock: () => void
  setKey: (key: CryptoKey) => void
}

export const useKeyStore = create<KeyStore>((set) => ({
  cryptoKey: null,
  isUnlocked: false,

  // Tente de déverrouiller avec une passphrase :
  // 1. Dérive la clé AES à partir de la passphrase + sel
  // 2. Vérifie la clé en déchiffrant le verifier stocké en DB
  // 3. Si correct → stocke la clé en mémoire, retourne true
  unlock: async (passphrase, salt, verifier, verifierIv) => {
    const key = await deriveKey(passphrase, salt)
    const valid = await verifyPassphrase(key, verifier, verifierIv)

    if (valid) {
      set({ cryptoKey: key, isUnlocked: true })
      return true
    }

    return false
  },

  // Verrouille : supprime la clé de la mémoire
  lock: () => {
    set({ cryptoKey: null, isUnlocked: false })
  },

  // Définit directement la clé (utilisé après le setup initial)
  setKey: (key: CryptoKey) => {
    set({ cryptoKey: key, isUnlocked: true })
  },
}))
