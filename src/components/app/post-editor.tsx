"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Image as ImageIcon, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/app/header"
import { TagSelector } from "@/components/app/tag-selector"
import { MediaUpload } from "@/components/app/media-upload"
import { useKeyStore } from "@/lib/crypto/key-store"
import { encrypt } from "@/lib/crypto"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/format"

type AttachedMedia = {
  id: string
  mimeType: string
  size: number
}

type PostEditorProps = {
  mode: "create" | "edit"
  postId?: string
  initialContent?: string
  initialTitle?: string
  initialContentType?: "thought" | "longform"
  initialIsPublic?: boolean
  initialTagIds?: string[]
  initialMedia?: AttachedMedia[]
}

export function PostEditor({
  mode,
  postId,
  initialContent = "",
  initialTitle = "",
  initialContentType = "thought",
  initialIsPublic = false,
  initialTagIds = [],
  initialMedia = [],
}: PostEditorProps) {
  const router = useRouter()
  const cryptoKey = useKeyStore((s) => s.cryptoKey)

  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [contentType, setContentType] = useState<"thought" | "longform">(initialContentType)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds)
  const [mediaItems, setMediaItems] = useState<AttachedMedia[]>(initialMedia)
  const [saving, setSaving] = useState(false)

  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  function handleMediaUpload(uploaded: { id: string; mimeType: string; size: number }) {
    setMediaItems((prev) => [...prev, uploaded])
  }

  function handleMediaRemove(mediaId: string) {
    setMediaItems((prev) => prev.filter((m) => m.id !== mediaId))
  }

  const handleSubmit = useCallback(async () => {
    if (!cryptoKey) {
      toast("Encryption key not available. Unlock first.", "error")
      return
    }

    if (!content.trim()) {
      toast("Write something first.", "error")
      return
    }

    setSaving(true)

    try {
      const { ciphertext: encryptedContent, iv } = await encrypt(cryptoKey, content)

      let encryptedTitle = null
      let titleIv = null

      if (contentType === "longform" && title.trim()) {
        const titleEncrypted = await encrypt(cryptoKey, title)
        encryptedTitle = titleEncrypted.ciphertext
        titleIv = titleEncrypted.iv
      }

      const payload = {
        encryptedContent,
        iv,
        contentType,
        encryptedTitle,
        titleIv,
        isPublic,
        plainContent: isPublic ? content : undefined,
        plainTitle: isPublic && contentType === "longform" && title.trim() ? title : undefined,
        charCount,
        wordCount,
        tagIds,
        mediaIds: mediaItems.map((m) => m.id),
      }

      const url = mode === "edit" ? `/api/posts/${postId}` : "/api/posts"
      const method = mode === "edit" ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save post")
      }

      const data = await res.json()
      toast(mode === "edit" ? "Post updated" : "Post created", "success")

      if (mode === "create") {
        router.push(`/app/post/${data.id}`)
      } else {
        router.push(`/app/post/${postId}`)
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save", "error")
    } finally {
      setSaving(false)
    }
  }, [cryptoKey, content, title, contentType, isPublic, tagIds, mediaItems, charCount, wordCount, mode, postId, router])

  return (
    <>
      <Header title={mode === "edit" ? "Edit Post" : "New Post"} />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Post type selector */}
        <div className="flex gap-2">
          {(["thought", "longform"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setContentType(type)}
              className={cn(
                "px-3 py-1.5 rounded font-terminal text-xs border transition-colors cursor-pointer",
                contentType === type
                  ? "bg-null-green/10 text-null-green border-null-green/30"
                  : "text-null-muted border-null-border hover:border-null-dim",
              )}
            >
              {type === "thought" ? "// thought" : "# longform"}
            </button>
          ))}
        </div>

        {/* Public toggle */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded font-terminal text-xs border transition-colors cursor-pointer",
              isPublic
                ? "bg-null-cyan/10 text-null-cyan border-null-cyan/30"
                : "text-null-muted border-null-border hover:border-null-dim",
            )}
          >
            {isPublic ? <Globe size={12} /> : <Lock size={12} />}
            {isPublic ? "Public" : "Private"}
          </button>
          {isPublic && (
            <p className="text-xs font-terminal text-null-cyan/70 px-1">
              {"[!]"} A plaintext copy will be stored alongside the encrypted version
              for public display.
            </p>
          )}
        </div>

        {/* Title (longform only) */}
        {contentType === "longform" && (
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="text-lg"
          />
        )}

        {/* Content */}
        <div className="space-y-1.5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              contentType === "thought"
                ? "What's on your mind?..."
                : "Write your post..."
            }
            rows={contentType === "thought" ? 4 : 16}
            className={cn(
              "w-full bg-null-black border border-null-border rounded px-3 py-3",
              "text-sm text-null-text placeholder:text-null-dim resize-y",
              "focus:outline-none focus:border-null-green/50 focus:ring-1 focus:ring-null-green/20",
              "transition-colors duration-200 min-h-[100px]",
            )}
            autoFocus
          />
          <div className="flex justify-between text-xs font-terminal text-null-dim">
            <span>{charCount} chars</span>
            <span>{wordCount} words</span>
          </div>
        </div>

        {/* Media attachments */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <MediaUpload onUpload={handleMediaUpload} compact />
            {mediaItems.length > 0 && (
              <span className="font-terminal text-xs text-null-dim">
                {mediaItems.length} file{mediaItems.length !== 1 ? "s" : ""} attached
              </span>
            )}
          </div>

          {mediaItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaItems.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded border border-null-border bg-null-surface/50 text-xs font-terminal"
                >
                  {m.mimeType.startsWith("image/") ? (
                    <img
                      src={`/api/media/${m.id}/file`}
                      alt=""
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <ImageIcon size={14} className="text-null-cyan" />
                  )}
                  <span className="text-null-dim">{formatFileSize(m.size)}</span>
                  <button
                    onClick={() => handleMediaRemove(m.id)}
                    className="text-null-muted hover:text-null-red transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <TagSelector selectedTagIds={tagIds} onTagsChange={setTagIds} />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSubmit} loading={saving} disabled={!content.trim()}>
            {saving
              ? "Encrypting..."
              : mode === "edit"
                ? "Update post"
                : "Publish post"}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {/* Encryption notice */}
        <p className="text-xs font-terminal text-null-dim">
          <span className="text-null-green">{">"}</span>{" "}
          {isPublic
            ? "Content is encrypted client-side. A plaintext copy is also stored for public access."
            : "Content is encrypted client-side before leaving your browser."}
        </p>
      </div>
    </>
  )
}
