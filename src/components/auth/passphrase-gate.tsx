"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useKeyStore } from "@/lib/crypto/key-store"

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

  useEffect(() => {
    if (isUnlocked) return

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setEncryptionData({
            salt: data.user.encryptionSalt,
            verifier: data.user.encryptionVerifier,
            verifierIv: data.user.encryptionVerifierIv,
          })
        }
      })
      .catch(() => {})
  }, [isUnlocked])

  if (isUnlocked) {
    return <>{children}</>
  }

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
