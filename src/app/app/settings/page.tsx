"use client"

import { useState, useEffect } from "react"
import { KeyRound, Download, ShieldAlert, User, ExternalLink } from "lucide-react"
import { Header } from "@/components/app/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "@/components/ui/toast"
import { useKeyStore } from "@/lib/crypto/key-store"
import {
  decrypt,
  encrypt,
  deriveKey,
  generateSalt,
  createVerifier,
} from "@/lib/crypto"

// --- Profile Section (read-only, shows GitHub login) ---

function ProfileSection() {
  const [githubLogin, setGithubLogin] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session")
        if (res.ok) {
          const data = await res.json()
          if (data.user?.githubLogin) {
            setGithubLogin(data.user.githubLogin)
          }
        }
      } finally {
        setFetching(false)
      }
    }
    fetchSession()
  }, [])

  return (
    <div className="border border-null-border rounded bg-null-surface/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <User size={16} className="text-null-cyan" />
        <h2 className="font-terminal text-null-text text-sm">
          Public Profile
        </h2>
      </div>
      <p className="text-xs text-null-muted">
        Your public profile uses your GitHub username. Public posts are visible at your profile URL.
      </p>

      {!fetching && githubLogin && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-terminal text-sm text-null-text">@{githubLogin}</span>
          </div>
          <a
            href={`/@${githubLogin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-terminal text-xs text-null-cyan hover:underline"
          >
            <ExternalLink size={12} />
            /@{githubLogin}
          </a>
        </div>
      )}
    </div>
  )
}

// --- Export Data Section ---

function ExportDataSection() {
  const [loading, setLoading] = useState(false)
  const cryptoKey = useKeyStore((s) => s.cryptoKey)

  async function handleExport() {
    if (!cryptoKey) {
      toast("Vault must be unlocked to export data", "error")
      return
    }

    setLoading(true)
    try {
      const [postsRes, tagsRes] = await Promise.all([
        fetch("/api/posts?limit=10000"),
        fetch("/api/tags"),
      ])

      if (!postsRes.ok || !tagsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const { posts } = await postsRes.json()
      const { tags } = await tagsRes.json()

      const decryptedPosts = await Promise.all(
        posts.map(
          async (post: {
            id: string
            encryptedContent: string
            iv: string
            encryptedTitle: string | null
            titleIv: string | null
            contentType: string
            charCount: number | null
            wordCount: number | null
            tags: { id: string; name: string; color: string }[]
            createdAt: string
            updatedAt: string
          }) => {
            const content = await decrypt(
              cryptoKey,
              post.encryptedContent,
              post.iv,
            )
            let title: string | null = null
            if (post.encryptedTitle && post.titleIv) {
              title = await decrypt(
                cryptoKey,
                post.encryptedTitle,
                post.titleIv,
              )
            }
            return {
              id: post.id,
              content,
              title,
              contentType: post.contentType,
              charCount: post.charCount,
              wordCount: post.wordCount,
              tags: post.tags,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            }
          },
        ),
      )

      const exportData = {
        exportDate: new Date().toISOString(),
        posts: decryptedPosts,
        tags,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nullpost-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast(`Exported ${decryptedPosts.length} posts`, "success")
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Export failed",
        "error",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-null-border rounded bg-null-surface/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Download size={16} className="text-null-green" />
        <h2 className="font-terminal text-null-text text-sm">Export Data</h2>
      </div>
      <p className="text-xs text-null-muted">
        Download all your posts and tags as a decrypted JSON file. Your vault
        must be unlocked.
      </p>
      <Button
        size="sm"
        onClick={handleExport}
        loading={loading}
      >
        Export as JSON
      </Button>
    </div>
  )
}

// --- Change Passphrase Section ---

function ChangePassphraseSection() {
  const [newPassphrase, setNewPassphrase] = useState("")
  const [confirmPassphrase, setConfirmPassphrase] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cryptoKey = useKeyStore((s) => s.cryptoKey)
  const setKey = useKeyStore((s) => s.setKey)

  function validate() {
    const errs: Record<string, string> = {}
    if (!newPassphrase) errs.newPassphrase = "Required"
    else if (newPassphrase.length < 8)
      errs.newPassphrase = "Must be at least 8 characters"
    if (newPassphrase !== confirmPassphrase)
      errs.confirmPassphrase = "Passphrases do not match"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setShowConfirm(true)
  }

  async function handleChangePassphrase() {
    if (!cryptoKey) {
      toast("Vault must be unlocked to change passphrase", "error")
      return
    }

    setShowConfirm(false)
    setLoading(true)

    try {
      setProgress("Fetching posts...")
      const res = await fetch("/api/posts?limit=10000")
      if (!res.ok) throw new Error("Failed to fetch posts")
      const { posts } = await res.json()

      setProgress("Decrypting posts...")
      const decryptedPosts = await Promise.all(
        posts.map(
          async (post: {
            id: string
            encryptedContent: string
            iv: string
            encryptedTitle: string | null
            titleIv: string | null
          }) => {
            const content = await decrypt(
              cryptoKey,
              post.encryptedContent,
              post.iv,
            )
            let title: string | null = null
            if (post.encryptedTitle && post.titleIv) {
              title = await decrypt(
                cryptoKey,
                post.encryptedTitle,
                post.titleIv,
              )
            }
            return { id: post.id, content, title }
          },
        ),
      )

      setProgress("Deriving new encryption key...")
      const newSalt = generateSalt()
      const newKey = await deriveKey(newPassphrase, newSalt)
      const { verifier, verifierIv } = await createVerifier(newKey)

      const reEncryptedPosts = []
      for (let i = 0; i < decryptedPosts.length; i++) {
        const post = decryptedPosts[i]
        setProgress(
          `Re-encrypting post ${i + 1} of ${decryptedPosts.length}...`,
        )

        const { ciphertext: encryptedContent, iv } = await encrypt(
          newKey,
          post.content,
        )

        let encryptedTitle: string | null = null
        let titleIv: string | null = null
        if (post.title) {
          const titleResult = await encrypt(newKey, post.title)
          encryptedTitle = titleResult.ciphertext
          titleIv = titleResult.iv
        }

        reEncryptedPosts.push({
          id: post.id,
          encryptedContent,
          iv,
          encryptedTitle,
          titleIv,
        })
      }

      setProgress("Saving changes...")
      const updateRes = await fetch("/api/auth/change-passphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptionSalt: newSalt,
          encryptionVerifier: verifier,
          encryptionVerifierIv: verifierIv,
          posts: reEncryptedPosts,
        }),
      })

      if (!updateRes.ok) {
        const data = await updateRes.json()
        throw new Error(data.error || "Failed to update passphrase")
      }

      setKey(newKey)

      toast("Passphrase changed successfully", "success")
      setNewPassphrase("")
      setConfirmPassphrase("")
      setErrors({})
      setProgress("")
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Failed to change passphrase",
        "error",
      )
      setProgress("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="border border-null-red/20 rounded bg-null-red/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-null-red" />
          <h2 className="font-terminal text-null-red text-sm">
            Change Encryption Passphrase
          </h2>
        </div>
        <p className="text-xs text-null-muted">
          This will re-encrypt all your posts with a new passphrase. Your vault
          must be unlocked. This operation cannot be undone.
        </p>

        {loading && progress && (
          <div className="font-terminal text-xs text-null-cyan animate-pulse">
            {">"} {progress}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-3">
          <Input
            id="new-passphrase"
            type="password"
            label="New Passphrase"
            value={newPassphrase}
            onChange={(e) => setNewPassphrase(e.target.value)}
            error={errors.newPassphrase}
            disabled={loading}
          />
          <Input
            id="confirm-passphrase"
            type="password"
            label="Confirm New Passphrase"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
            error={errors.confirmPassphrase}
            disabled={loading}
          />
          <Button
            type="submit"
            size="sm"
            variant="danger"
            loading={loading}
          >
            Change Passphrase
          </Button>
        </form>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Change encryption passphrase"
        message="All posts will be re-encrypted with the new passphrase. Make sure you remember it — there is no recovery mechanism."
        confirmLabel="Re-encrypt everything"
        onConfirm={handleChangePassphrase}
        onCancel={() => setShowConfirm(false)}
        variant="danger"
      />
    </>
  )
}

// --- Settings Page ---

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <ProfileSection />
          <ExportDataSection />
          <ChangePassphraseSection />
        </div>
      </div>
    </>
  )
}
