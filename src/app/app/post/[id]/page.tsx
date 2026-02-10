"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock,
  MessageSquare,
  FileText,
  Hash,
  Type,
} from "lucide-react"
import { Header } from "@/components/app/header"
import { Button } from "@/components/ui/button"
import { TagBadge } from "@/components/ui/tag-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MarkdownContent } from "@/components/app/markdown-content"
import { useKeyStore } from "@/lib/crypto/key-store"
import { decrypt } from "@/lib/crypto"
import { toast } from "@/components/ui/toast"
import { formatFullDate } from "@/lib/format"

type PostTag = {
  id: string
  name: string
  color: string
}

type PostMedia = {
  id: string
  mimeType: string
  size: number
}

type PostData = {
  id: string
  encryptedContent: string
  iv: string
  contentType: "thought" | "longform"
  encryptedTitle: string | null
  titleIv: string | null
  charCount: number | null
  wordCount: number | null
  createdAt: string
  updatedAt: string
  tags: PostTag[]
  media: PostMedia[]
}

export default function PostViewPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const cryptoKey = useKeyStore((s) => s.cryptoKey)

  const [post, setPost] = useState<PostData | null>(null)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) throw new Error("Post not found")
      const data = await res.json()
      setPost(data)
    } catch {
      setError("Failed to load post")
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  useEffect(() => {
    if (!post || !cryptoKey) return

    async function decryptPost() {
      try {
        const content = await decrypt(cryptoKey!, post!.encryptedContent, post!.iv)
        setDecryptedContent(content)

        if (post!.encryptedTitle && post!.titleIv) {
          const title = await decrypt(cryptoKey!, post!.encryptedTitle, post!.titleIv)
          setDecryptedTitle(title)
        }
      } catch {
        setError("Failed to decrypt post")
      }
    }

    decryptPost()
  }, [post, cryptoKey])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast("Post deleted", "success")
      router.push("/app/feed")
    } catch {
      toast("Failed to delete post", "error")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Post" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="Loading post" />
        </div>
      </>
    )
  }

  if (error || !post) {
    return (
      <>
        <Header title="Post" />
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="font-terminal text-null-red text-sm">
            {">"} {error || "Post not found"}
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

  const isThought = post.contentType === "thought"

  return (
    <>
      <Header title={isThought ? "Thought" : "Post"} />

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/app/feed"
          className="inline-flex items-center gap-1.5 font-terminal text-xs text-null-muted hover:text-null-cyan transition-colors"
        >
          <ArrowLeft size={12} />
          back to feed
        </Link>

        {/* Title */}
        {decryptedTitle && (
          <h1 className="font-terminal text-null-text text-2xl font-medium leading-tight">
            {decryptedTitle}
          </h1>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-terminal text-null-dim">
          {isThought ? (
            <span className="inline-flex items-center gap-1 text-null-cyan">
              <MessageSquare size={12} />
              thought
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-null-purple">
              <FileText size={12} />
              longform
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {formatFullDate(post.createdAt)}
          </span>
          {post.wordCount && (
            <span className="inline-flex items-center gap-1">
              <Type size={12} />
              {post.wordCount} words
            </span>
          )}
          {post.charCount && (
            <span className="inline-flex items-center gap-1">
              <Hash size={12} />
              {post.charCount} chars
            </span>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        )}

        {/* Divider */}
        <hr className="terminal-divider" />

        {/* Content */}
        {!decryptedContent && (
          <div className="py-8">
            <LoadingSpinner text="Decrypting" />
          </div>
        )}
        {decryptedContent && isThought && (
          <div className="text-null-text leading-relaxed whitespace-pre-wrap text-sm">
            {decryptedContent}
          </div>
        )}
        {decryptedContent && !isThought && (
          <MarkdownContent content={decryptedContent} />
        )}

        {/* Media */}
        {post.media.length > 0 && (
          <div className="space-y-3">
            {post.media.map((m) => {
              const src = `/api/media/${m.id}/file`
              if (m.mimeType.startsWith("image/")) {
                return (
                  <img key={m.id} src={src} alt="" className="max-w-full rounded border border-null-border" loading="lazy" />
                )
              }
              if (m.mimeType.startsWith("audio/")) {
                return <audio key={m.id} src={src} controls className="w-full" />
              }
              if (m.mimeType.startsWith("video/")) {
                return (
                  <video key={m.id} src={src} controls className="max-w-full rounded border border-null-border" />
                )
              }
              return null
            })}
          </div>
        )}

        {/* Divider */}
        <hr className="terminal-divider" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href={`/app/post/${post.id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil size={14} />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete post"
        message="This action cannot be undone. The encrypted data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </>
  )
}
