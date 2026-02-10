"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useKeyStore } from "@/lib/crypto/key-store"

export function LoginForm() {
  const router = useRouter()
  const unlock = useKeyStore((s) => s.unlock)

  const [phase, setPhase] = useState<"credentials" | "passphrase">("credentials")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passphrase, setPassphrase] = useState("")

  // Stored after successful login
  const [encryptionData, setEncryptionData] = useState<{
    salt: string
    verifier: string
    verifierIv: string
  } | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }

      setEncryptionData({
        salt: data.encryptionSalt,
        verifier: data.encryptionVerifier,
        verifierIv: data.encryptionVerifierIv,
      })
      setPhase("passphrase")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
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
        throw new Error("Invalid passphrase")
      }

      router.push("/app")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {phase === "credentials" ? (
        <div className="space-y-6">
          <div>
            <h2 className="font-terminal text-null-green text-lg mb-1">
              {">"} Authenticate
            </h2>
            <p className="text-sm text-null-muted">
              Enter your credentials to access NullPost.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <p className="text-sm font-terminal text-null-red">{"> "}{error}</p>
          )}

          <Button onClick={handleLogin} loading={loading} className="w-full">
            {loading ? "Verifying..." : "Login"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="font-terminal text-null-green text-lg mb-1">
              {">"} Decrypt
            </h2>
            <p className="text-sm text-null-muted">
              Enter your master passphrase to decrypt your data.
            </p>
          </div>

          <div className="p-3 border border-null-cyan/20 bg-null-cyan/5 rounded">
            <p className="text-xs font-terminal text-null-cyan">
              {"[i]"} Authenticated as {email}
            </p>
          </div>

          <Input
            id="passphrase"
            label="Master Passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Your encryption passphrase"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          />

          {error && (
            <p className="text-sm font-terminal text-null-red">{"> "}{error}</p>
          )}

          <Button onClick={handleUnlock} loading={loading} className="w-full">
            {loading ? "Deriving key..." : "Unlock"}
          </Button>
        </div>
      )}
    </div>
  )
}
