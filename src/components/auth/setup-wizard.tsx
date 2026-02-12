"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateSalt, deriveKey, createVerifier } from "@/lib/crypto"
import { useKeyStore } from "@/lib/crypto/key-store"
import { isUsernameValid } from "@/lib/reserved-usernames"

type Step = 1 | 2 | 3

export function SetupWizard() {
  const router = useRouter()
  const unlock = useKeyStore((s) => s.unlock)

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Step 1
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")

  // Step 2
  const [passphrase, setPassphrase] = useState("")
  const [passphraseConfirm, setPassphraseConfirm] = useState("")

  function handleStep1() {
    setError("")

    if (!email || !password) {
      setError("All fields are required")
      return
    }
    if (username) {
      const check = isUsernameValid(username)
      if (!check.valid) {
        setError(check.error!)
        return
      }
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match")
      return
    }

    setStep(2)
  }

  function getPassphraseStrength(p: string): { level: number; label: string } {
    if (p.length < 8) return { level: 0, label: "Too short" }
    if (p.length < 12) return { level: 1, label: "Weak" }
    if (p.length < 20) return { level: 2, label: "Moderate" }
    if (p.length < 30) return { level: 3, label: "Strong" }
    return { level: 4, label: "Very strong" }
  }

  async function handleStep2() {
    setError("")

    if (!passphrase) {
      setError("Master passphrase is required")
      return
    }
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters")
      return
    }
    if (passphrase !== passphraseConfirm) {
      setError("Passphrases do not match")
      return
    }

    setStep(3)
  }

  async function handleComplete() {
    setLoading(true)
    setError("")

    try {
      const salt = generateSalt()
      const key = await deriveKey(passphrase, salt)
      const { verifier, verifierIv } = await createVerifier(key)

      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username: username || undefined,
          password,
          encryptionSalt: salt,
          encryptionVerifier: verifier,
          encryptionVerifierIv: verifierIv,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Setup failed")
      }

      // Unlock the encryption store
      await unlock(passphrase, salt, verifier, verifierIv)

      router.push("/app")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setLoading(false)
    }
  }

  const strength = getPassphraseStrength(passphrase)
  const strengthColors = [
    "bg-null-red",
    "bg-null-red",
    "bg-yellow-500",
    "bg-null-green",
    "bg-null-green",
  ]

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-null-green" : "bg-null-dim"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step 1: Account */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-terminal text-null-green text-lg mb-1">
              {">"} Create Account
            </h2>
            <p className="text-sm text-null-muted">
              Set up your login credentials. This is for server access only.
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
            <div className="space-y-1.5">
              <Input
                id="username"
                label="Username (optional)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="your-handle"
              />
              {username && (
                <p className="text-xs font-terminal text-null-dim">
                  Your profile: <span className="text-null-cyan">/@{username}</span>
                </p>
              )}
            </div>
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <Input
              id="password-confirm"
              label="Confirm Password"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repeat password"
              onKeyDown={(e) => e.key === "Enter" && handleStep1()}
            />
          </div>

          {error && (
            <p className="text-sm font-terminal text-null-red">{"> "}{error}</p>
          )}

          <Button onClick={handleStep1} className="w-full">
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: Passphrase */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-terminal text-null-green text-lg mb-1">
              {">"} Master Passphrase
            </h2>
            <p className="text-sm text-null-muted">
              This passphrase encrypts your data client-side. The server never sees it.
              If you lose it, your data is unrecoverable.
            </p>
          </div>

          <div className="p-3 border border-null-red/20 bg-null-red/5 rounded">
            <p className="text-xs font-terminal text-null-red">
              {"[!]"} This passphrase cannot be reset. Store it safely.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              id="passphrase"
              label="Master Passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="A long, memorable phrase"
              autoFocus
            />

            {passphrase && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength.level
                          ? strengthColors[strength.level]
                          : "bg-null-dim"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-terminal text-null-muted">
                  Strength: {strength.label}
                </p>
              </div>
            )}

            <Input
              id="passphrase-confirm"
              label="Confirm Passphrase"
              type="password"
              value={passphraseConfirm}
              onChange={(e) => setPassphraseConfirm(e.target.value)}
              placeholder="Repeat passphrase"
              onKeyDown={(e) => e.key === "Enter" && handleStep2()}
            />
          </div>

          {error && (
            <p className="text-sm font-terminal text-null-red">{"> "}{error}</p>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleStep2} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-terminal text-null-green text-lg mb-1">
              {">"} Confirm Setup
            </h2>
            <p className="text-sm text-null-muted">
              Review your configuration before creating your instance.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-null-surface border border-null-border rounded">
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Email</span>
              <span className="text-null-text">{email}</span>
            </div>
            <hr className="terminal-divider" />
            {username && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-null-muted font-terminal">Username</span>
                  <span className="text-null-cyan">@{username}</span>
                </div>
                <hr className="terminal-divider" />
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Password</span>
              <span className="text-null-text">{"*".repeat(password.length)}</span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Passphrase</span>
              <span className="text-null-text">
                {passphrase.slice(0, 3)}{"*".repeat(Math.max(0, passphrase.length - 3))}
              </span>
            </div>
            <hr className="terminal-divider" />
            <div className="flex justify-between text-sm">
              <span className="text-null-muted font-terminal">Encryption</span>
              <span className="text-null-green">AES-256-GCM</span>
            </div>
          </div>

          {error && (
            <p className="text-sm font-terminal text-null-red">{"> "}{error}</p>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleComplete} loading={loading} className="flex-1">
              {loading ? "Initializing..." : "Initialize NullPost"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
