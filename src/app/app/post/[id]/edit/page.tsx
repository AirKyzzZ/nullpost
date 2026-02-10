"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/app/header"
import { PostEditor } from "@/components/app/post-editor"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useKeyStore } from "@/lib/crypto/key-store"
import { decrypt } from "@/lib/crypto"
import Link from "next/link"

type PostData = {
  id: string
  encryptedContent: string
  iv: string
  contentType: "thought" | "longform"
  encryptedTitle: string | null
  titleIv: string | null
  tags: Array<{ id: string; name: string; color: string }>
}

export default function EditPostPage() {
  const params = useParams()
  const postId = params.id as string
  const cryptoKey = useKeyStore((s) => s.cryptoKey)

  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null)
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAndDecrypt = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) throw new Error("Post not found")
      const data: PostData = await res.json()
      setPost(data)

      if (!cryptoKey) {
        setError("Encryption key not available")
        return
      }

      const content = await decrypt(cryptoKey, data.encryptedContent, data.iv)
      setDecryptedContent(content)

      if (data.encryptedTitle && data.titleIv) {
        const title = await decrypt(cryptoKey, data.encryptedTitle, data.titleIv)
        setDecryptedTitle(title)
      }
    } catch {
      setError("Failed to load post")
    } finally {
      setLoading(false)
    }
  }, [postId, cryptoKey])

  useEffect(() => {
    fetchAndDecrypt()
  }, [fetchAndDecrypt])

  if (loading) {
    return (
      <>
        <Header title="Edit Post" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="Decrypting post" />
        </div>
      </>
    )
  }

  if (error || !post || decryptedContent === null) {
    return (
      <>
        <Header title="Edit Post" />
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="font-terminal text-null-red text-sm">
            {">"} {error || "Failed to load post"}
          </p>
          <Link
            href="/app/feed"
            className="font-terminal text-xs text-null-cyan hover:underline"
          >
            Back to feed
          </Link>
        </div>
      </>
    )
  }

  return (
    <PostEditor
      mode="edit"
      postId={postId}
      initialContent={decryptedContent}
      initialTitle={decryptedTitle || ""}
      initialContentType={post.contentType}
      initialTagIds={post.tags.map((t) => t.id)}
    />
  )
}
