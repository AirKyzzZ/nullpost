"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useKeyStore } from "@/lib/crypto/key-store"
import { generateSalt, deriveKey, createVerifier } from "@/lib/crypto"

type PassphraseGateProps = {
  children: React.ReactNode
}

export function PassphraseGate({ children }: PassphraseGateProps) {
  const isUnlocked = useKeyStore((s) => s.isUnlocked)
  const unlock = useKeyStore((s) => s.unlock)

  const [passphrase, setPassphrase] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [encryptionData, setEncryptionData] = useState<{
    salt: string
    verifier: string
    verifierIv: string
  } | null>(null)
  // true si l'utilisateur n'a pas encore configuré son chiffrement (premier login)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [confirmPassphrase, setConfirmPassphrase] = useState("")

  useEffect(() => {
    if (isUnlocked) return

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user.encryptionSalt) {
            // Utilisateur existant : demander la passphrase
            setEncryptionData({
              salt: data.user.encryptionSalt,
              verifier: data.user.encryptionVerifier,
              verifierIv: data.user.encryptionVerifierIv,
            })
          } else {
            // Nouveau user : pas encore de chiffrement configuré
            setNeedsSetup(true)
          }
        }
      })
      .catch(() => {})
  }, [isUnlocked])

  if (isUnlocked) {
    return <>{children}</>
  }

  // --- Mode setup : première configuration du chiffrement ---
  async function handleSetupEncryption() {
    setLoading(true)
    setError("")

    try {
      if (passphrase.length < 8) {
        throw new Error("Passphrase must be at least 8 characters")
      }
      if (passphrase !== confirmPassphrase) {
        throw new Error("Passphrases do not match")
      }

      // Dériver la clé et créer le verifier
      const salt = generateSalt()
      const key = await deriveKey(passphrase, salt)
      const { verifier, verifierIv } = await createVerifier(key)

      // Enregistrer en DB
      const res = await fetch("/api/auth/setup-encryption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptionSalt: salt,
          encryptionVerifier: verifier,
          encryptionVerifierIv: verifierIv,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to setup encryption")
      }

      // Déverrouiller le store
      await unlock(passphrase, salt, verifier, verifierIv)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setLoading(false)
    }
  }

  // --- Mode unlock : saisir la passphrase existante ---
  async function handleUnlock() {
    if (!encryptionData) return

    setLoading(true)
    setError("")

    try {
      const success = await unlock(
        passphrase,
        encryptionData.salt,
        encryptionData.verifier,
        encryptionData.verifierIv,
      )

      if (!success) {
        setError("Invalid passphrase")
      }
    } catch {
      setError("Failed to derive key")
    } finally {
      setLoading(false)
    }
  }

  // --- Rendu : setup ou unlock ---
  if (needsSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-null-black p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="font-terminal text-null-green text-2xl glow-green">
              {"[ SETUP ]"}
            </div>
            <p className="text-sm text-null-muted">
              Set your master passphrase. It encrypts your data client-side. The server never sees it.
            </p>
          </div>

          <div className="p-3 border border-null-red/20 bg-null-red/5 rounded">
            <p className="text-xs font-terminal text-null-red">
              {"[!]"} This passphrase cannot be reset. Store it safely.
            </p>
          </div>

          <Input
            id="setup-passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Master passphrase (min. 8 chars)"
            label="Master Passphrase"
            autoFocus
          />

          <Input
            id="setup-passphrase-confirm"
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
            placeholder="Confirm passphrase"
            label="Confirm Passphrase"
            onKeyDown={(e) => e.key === "Enter" && handleSetupEncryption()}
          />

          {error && (
            <p className="text-sm font-terminal text-null-red text-center">
              {"> "}{error}
            </p>
          )}

          <Button
            onClick={handleSetupEncryption}
            loading={loading}
            className="w-full"
          >
            {loading ? "Deriving key..." : "Initialize Encryption"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-null-black p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="font-terminal text-null-green text-2xl glow-green">
            {"[ LOCKED ]"}
          </div>
          <p className="text-sm text-null-muted">
            Enter your master passphrase to decrypt your data.
          </p>
        </div>

        <Input
          id="gate-passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Master passphrase"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
        />

        {error && (
          <p className="text-sm font-terminal text-null-red text-center">
            {"> "}{error}
          </p>
        )}

        <Button
          onClick={handleUnlock}
          loading={loading}
          className="w-full"
          disabled={!encryptionData}
        >
          {loading ? "Deriving key..." : "Unlock"}
        </Button>
      </div>
    </div>
  )
}
