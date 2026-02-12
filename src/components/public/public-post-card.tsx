"use client"

import Link from "next/link"
import { MessageSquare, FileText, Clock } from "lucide-react"
import { TagBadge } from "@/components/ui/tag-badge"
import { formatRelativeDate } from "@/lib/format"
import { cn } from "@/lib/utils"

type PostTag = {
  id: string
  name: string
  color: string
}

type PostMedia = {
  id: string
  mimeType: string
}

type PublicPostCardProps = {
  id: string
  username: string
  contentType: "thought" | "longform"
  plainContent: string
  plainTitle: string | null
  wordCount: number | null
  createdAt: string
  tags: PostTag[]
  media: PostMedia[]
}

export function PublicPostCard({
  id,
  username,
  contentType,
  plainContent,
  plainTitle,
  wordCount,
  createdAt,
  tags,
  media,
}: PublicPostCardProps) {
  const isThought = contentType === "thought"

  function getPreview(): string {
    if (isThought) return plainContent
    if (plainContent.length <= 200) return plainContent
    return plainContent.slice(0, 200) + "..."
  }

  return (
    <article className="border border-null-border rounded-lg bg-null-surface/50 hover:border-null-dim transition-colors">
      <Link href={`/@${username}/${id}`} className="block p-4 space-y-3">
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
        {plainTitle && (
          <h2 className="font-terminal text-null-text text-base font-medium">
            {plainTitle}
          </h2>
        )}

        {/* Content preview */}
        <p
          className={cn(
            "text-sm text-null-text/80 leading-relaxed",
            isThought ? "whitespace-pre-wrap" : "line-clamp-3",
          )}
        >
          {getPreview()}
        </p>

        {/* Media thumbnails */}
        {media.some((m) => m.mimeType.startsWith("image/")) && (
          <div className="flex gap-2 pt-1 overflow-x-auto">
            {media
              .filter((m) => m.mimeType.startsWith("image/"))
              .slice(0, 4)
              .map((m) => (
                <img
                  key={m.id}
                  src={`/api/public/media/${m.id}/file`}
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
    </article>
  )
}
