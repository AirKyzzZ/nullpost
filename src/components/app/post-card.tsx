"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MessageSquare, FileText, Clock, Pencil, Trash2 } from "lucide-react"
import { TagBadge } from "@/components/ui/tag-badge"
import { useKeyStore } from "@/lib/crypto/key-store"
import { decrypt } from "@/lib/crypto"
import { cn } from "@/lib/utils"
import { formatRelativeDate } from "@/lib/format"

type PostTag = {
  id: string
  name: string
  color: string
}

type PostMedia = {
  id: string
  mimeType: string
}

type PostCardProps = {
  id: string
  encryptedContent: string
  iv: string
  contentType: "thought" | "longform"
  encryptedTitle: string | null
  titleIv: string | null
  charCount: number | null
  wordCount: number | null
  createdAt: string
  tags: PostTag[]
  media?: PostMedia[]
  onDelete: (id: string) => void
}

export function PostCard({
  id,
  encryptedContent,
  iv,
  contentType,
  encryptedTitle,
  titleIv,
  wordCount,
  createdAt,
  tags,
  media = [],
  onDelete,
}: PostCardProps) {
  const cryptoKey = useKeyStore((s) => s.cryptoKey)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [decryptedTitle, setDecryptedTitle] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!cryptoKey) return

    async function decryptPost() {
      try {
        const content = await decrypt(cryptoKey!, encryptedContent, iv)
        setDecryptedContent(content)

        if (encryptedTitle && titleIv) {
          const title = await decrypt(cryptoKey!, encryptedTitle, titleIv)
          setDecryptedTitle(title)
        }
      } catch {
        setError(true)
      }
    }

    decryptPost()
  }, [cryptoKey, encryptedContent, iv, encryptedTitle, titleIv])

  const isThought = contentType === "thought"

  function getPreviewContent(): string | null {
    if (!decryptedContent) return null
    if (isThought) return decryptedContent
    if (decryptedContent.length <= 200) return decryptedContent
    return decryptedContent.slice(0, 200) + "..."
  }

  const previewContent = getPreviewContent()

  return (
    <article className="group border border-null-border rounded-lg bg-null-surface/50 hover:border-null-dim transition-colors">
      <Link href={`/app/post/${id}`} className="block p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-terminal text-null-dim">
          {isThought ? (
            <MessageSquare size={12} className="text-null-cyan" />
          ) : (
            <FileText size={12} className="text-null-purple" />
          )}
          <span className={isThought ? "text-null-cyan" : "text-null-purple"}>
            {isThought ? "thought" : "longform"}
          </span>
          <span>{"·"}</span>
          <Clock size={10} />
          <span>{formatRelativeDate(createdAt)}</span>
          {wordCount && (
            <>
              <span>{"·"}</span>
              <span>{wordCount} words</span>
            </>
          )}
        </div>

        {/* Title */}
        {decryptedTitle && (
          <h2 className="font-terminal text-null-text text-base font-medium">
            {decryptedTitle}
          </h2>
        )}

        {/* Content */}
        {error ? (
          <p className="text-sm text-null-red font-terminal">
            {">"} Decryption failed
          </p>
        ) : previewContent ? (
          <p
            className={cn(
              "text-sm text-null-text/80 leading-relaxed",
              isThought ? "whitespace-pre-wrap" : "line-clamp-3",
            )}
          >
            {previewContent}
          </p>
        ) : (
          <p className="text-sm text-null-dim animate-pulse font-terminal">
            Decrypting...
          </p>
        )}

        {/* Media thumbnails */}
        {media.some((m) => m.mimeType.startsWith("image/")) && (
          <div className="flex gap-2 pt-1 overflow-x-auto">
            {media
              .filter((m) => m.mimeType.startsWith("image/"))
              .slice(0, 4)
              .map((m) => (
                <img
                  key={m.id}
                  src={`/api/media/${m.id}/file`}
                  alt=""
                  className="w-16 h-16 object-cover rounded border border-null-border"
                  loading="lazy"
                />
              ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
          </div>
        )}
      </Link>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/app/post/${id}/edit`}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-terminal text-null-muted hover:text-null-cyan hover:bg-null-cyan/10 transition-colors"
        >
          <Pencil size={12} />
          edit
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(id)
          }}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-terminal text-null-muted hover:text-null-red hover:bg-null-red/10 transition-colors cursor-pointer"
        >
          <Trash2 size={12} />
          delete
        </button>
      </div>
    </article>
  )
}
