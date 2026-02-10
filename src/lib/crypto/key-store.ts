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
}

export const useKeyStore = create<KeyStore>((set) => ({
  cryptoKey: null,
  isUnlocked: false,

  unlock: async (passphrase, salt, verifier, verifierIv) => {
    const key = await deriveKey(passphrase, salt)
    const valid = await verifyPassphrase(key, verifier, verifierIv)

    if (valid) {
      set({ cryptoKey: key, isUnlocked: true })
      return true
    }

    return false
  },

  lock: () => {
    set({ cryptoKey: null, isUnlocked: false })
  },
}))
